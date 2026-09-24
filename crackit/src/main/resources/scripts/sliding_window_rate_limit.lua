-- Sliding Window Rate Limiter using Redis Sorted Sets
-- Keys:
-- KEYS[1]: Rate limit key (e.g. ratelimit:auth_login:192.168.1.1)
--
-- Arguments:
-- ARGV[1]: Current timestamp in milliseconds (now)
-- ARGV[2]: Window size in milliseconds (window_ms)
-- ARGV[3]: Max requests allowed in window (limit)
-- ARGV[4]: Unique member identifier (e.g. <now>-<uuid>)

local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

local clearBefore = now - window

-- Step 1: Remove all requests older than the sliding window boundary
redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)

-- Step 2: Count requests remaining in the current sliding window
local currentRequests = redis.call('ZCARD', key)

-- Step 3: Check whether the request is within capacity
if currentRequests < limit then
    -- Allowed: record this request timestamp
    redis.call('ZADD', key, now, member)
    -- Extend key TTL with a safety buffer of 5 seconds beyond the window
    local ttlSeconds = math.ceil((window + 5000) / 1000)
    redis.call('EXPIRE', key, ttlSeconds)
    -- Return array: {allowed (1), remaining_tokens, retry_after_seconds (0)}
    return {1, limit - currentRequests - 1, 0}
else
    -- Denied: calculate exact retry-after seconds until the oldest request slides out
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local retryAfterMs = window
    if oldest and #oldest >= 2 then
        local oldestScore = tonumber(oldest[2])
        local expiresAt = oldestScore + window
        if expiresAt > now then
            retryAfterMs = expiresAt - now
        else
            retryAfterMs = 1000
        end
    end
    local retryAfterSeconds = math.max(1, math.ceil(retryAfterMs / 1000))
    -- Return array: {allowed (0), 0, retry_after_seconds}
    return {0, 0, retryAfterSeconds}
end
