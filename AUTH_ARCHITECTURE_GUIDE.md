# Authentication (AuthN) & Authorization (AuthZ) Architecture Guide

> **Project**: CrackIt (Career & Technical Interview Preparation Platform)  
> **Topic**: Production-Grade Identity, Access Control, Google OAuth 2.0, RBAC, and IDOR Defense  
> **Technology Stack**: Spring Boot 3, Spring Security 6, JWT (jjwt 0.12.6), Google Identity Services (OIDC), BCrypt, React 19  

---

## Table of Contents
1. [Core Difference: Authentication vs. Authorization](#1-core-difference-authentication-vs-authorization)
2. [End-to-End Auth Architecture Diagram](#2-end-to-end-auth-architecture-diagram)
3. [Authentication (AuthN) Deep Dive](#3-authentication-authn-deep-dive)
   - [BCrypt Password Hashing](#31-bcrypt-password-hashing)
   - [Google OAuth 2.0 & OpenID Connect (OIDC)](#32-google-oauth-20--openid-connect-oidc)
   - [JWT Token Anatomy & Statelessness](#33-jwt-token-anatomy--statelessness)
4. [Authorization (AuthZ) Deep Dive](#4-authorization-authz-deep-dive)
   - [Role-Based Access Control (RBAC)](#41-role-based-access-control-rbac)
   - [Method-Level Security (`@PreAuthorize`)](#42-method-level-security-preauthorize)
   - [Resource Ownership & IDOR Protection](#43-resource-ownership--idor-protection)
   - [RBAC vs. ABAC](#44-rbac-vs-abac)
5. [Top 10 Senior Engineer Interview Q&A](#5-top-10-senior-engineer-interview-qa)

---

## 1. Core Difference: Authentication vs. Authorization

In interviews, senior candidates must articulate this fundamental distinction with crisp precision:

| Dimension | Authentication (AuthN) | Authorization (AuthZ) |
| :--- | :--- | :--- |
| **Core Question** | *"Who are you?"* | *"What are you allowed to do?"* |
| **Focus** | Identity verification | Permissions, Privileges, and Resource Access |
| **Mechanisms** | Email + Password, Google OAuth 2.0, OTP, Biometrics | RBAC (Roles), ABAC (Attributes), ACLs, Scopes |
| **Output** | Security Principal & Cryptographic Token (JWT) | Access Granted (200 OK) or Access Denied (**403 Forbidden**) |
| **In CrackIt** | BCrypt password checking, Google ID Token verification, JWT issuance | Role checks (`ROLE_ADMIN` vs `ROLE_USER`), candidate resource ownership |

---

## 2. End-to-End Auth Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["Client (React 19)"]
        Login["Login.jsx<br/>(Password or Google)"]
        Signup["Signup.jsx<br/>(Strength meter, Confirm pass)"]
        Context["AuthContext.jsx<br/>(Stores JWT with role & avatar)"]
    end

    subgraph AuthN["Authentication Layer (AuthN)"]
        LocalLogin["AuthService: login or signup<br/>BCrypt PasswordEncoder"]
        GoogleLogin["AuthService.googleLogin()<br/>Google OIDC TokenInfo Verification"]
        JwtUtil["JwtUtil.generateToken()<br/>Embeds sub, userId, role claim"]
    end

    subgraph AuthZ["Authorization Layer (AuthZ)"]
        Filter["JwtAuthFilter (OncePerRequestFilter)<br/>Extracts JWT to SecurityContext"]
        SecConfig["SecurityFilterChain<br/>permitAll: /api/auth/**<br/>hasRole ADMIN: /api/admin/**<br/>authenticated: all other requests"]
        MethodSec["Method Security (@PreAuthorize)<br/>IDOR Ownership checks in Services"]
    end

    subgraph Endpoints["Target Resources"]
        UserAPIs["User Endpoints<br/>(/api/tracker, /api/ai/jobs/...)"]
        AdminAPIs["AdminController<br/>(/api/admin/users, /api/admin/system/metrics)"]
        DB[("MySQL Database<br/>users: password_hash, role, auth_provider")]
    end

    Login -->|"1a. Email or Password"| LocalLogin
    Signup -->|"1b. Register"| LocalLogin
    Login -->|"1c. Google ID Token"| GoogleLogin
    Signup -->|"1d. Google ID Token"| GoogleLogin

    LocalLogin -->|"2. Verify Credentials"| DB
    GoogleLogin -->|"2. Verify OIDC with Google"| DB

    LocalLogin -->|"3. Issue JWT"| JwtUtil
    GoogleLogin -->|"3. Issue JWT"| JwtUtil
    JwtUtil -->>|"4. Return AuthResponse"| Context

    Context -->|"5. Bearer JWT Header"| Filter
    Filter -->|"6. Populate Authentication"| SecConfig
    SecConfig -->|"7. Role Allowed"| MethodSec
    MethodSec -->|"8a. Candidate Resource"| UserAPIs
    MethodSec -->|"8b. Admin Resource"| AdminAPIs
```

---

## 3. Authentication (AuthN) Deep Dive

### 3.1 BCrypt Password Hashing
Storing raw passwords or simple hashes like MD5 or SHA-256 is an immediate security vulnerability.
In CrackIt:
- **Adaptive Salting**: BCrypt generates a random 128-bit salt for each password automatically, appending it directly into the formatted hash (`$2a$10$...`). This completely prevents **Rainbow Table attacks**.
- **Configurable Work Factor (Cost Factor)**: Defaults to 10 ($2^{10} = 1024$ key expansion rounds). This CPU-intensive algorithm protects against offline brute-force and GPU hardware cracking attacks.
- **Verification**: `passwordEncoder.matches(rawPassword, storedHash)` hashes the input using the extracted salt and compares hashes in constant time to prevent **timing attacks**.

### 3.2 Google OAuth 2.0 & OpenID Connect (OIDC)
CrackIt implements **Google Identity Services (GIS)** for Google Sign-In and Sign-Up:
1. **Frontend Initiation**:
   The user clicks the official Google button in [`GoogleSignInButton.jsx`](file:///home/stpl/Crackit/crackit-ui/src/components/auth/GoogleSignInButton.jsx). Google opens an authorized popup or One-Tap dialog.
2. **Credential Issuance**:
   Google cryptographically signs an **ID Token (JWT)** using its private RSA keys and returns it to the client callback.
3. **Backend Cryptographic Verification**:
   The frontend dispatches `POST /api/auth/google` with `{ idToken: credential }`.
   [`AuthService.java`](file:///home/stpl/Crackit/crackit/src/main/java/com/crackit/auth/service/AuthService.java) validates this token directly with Google's OIDC server (`https://oauth2.googleapis.com/tokeninfo?id_token={token}`):
   - Verifies `iss` is `accounts.google.com` or `https://accounts.google.com`.
   - Verifies `email_verified == "true"`.
   - Extracts unique user subject (`sub`), email, full name, and avatar picture.
4. **Account Linking & Provisioning**:
   - If the candidate's email already exists in MySQL: Links `googleId` and updates `avatarUrl`.
   - If new: Auto-creates a user record with `role = ROLE_USER`, `authProvider = "GOOGLE"`, and a secure unguessable random password hash.
5. **Session Handoff**:
   Spring Boot generates an application JWT containing the candidate's claims and returns `200 OK`. The client saves the token and navigates directly to `/dashboard`.

### 3.3 JWT Token Anatomy & Statelessness
CrackIt issues stateless JSON Web Tokens signed with HMAC-SHA256 (`Keys.hmacShaKeyFor`):

$$\text{JWT} = \underbrace{\text{Base64Url}(\text{Header})}_{\text{Algorithm \& Token Type}} \;. \; \underbrace{\text{Base64Url}(\text{Payload})}_{\text{Claims: sub, userId, role, exp}} \;. \; \underbrace{\text{Signature}}_{\text{HMAC-SHA256}(\text{Header} + \text{Payload}, \text{Secret})}$$

- **Stateless Verification**: Spring Boot does not query the database on every HTTP request. [`JwtAuthFilter.java`](file:///home/stpl/Crackit/crackit/src/main/java/com/crackit/auth/security/JwtAuthFilter.java) validates the cryptographic signature using the server secret key in RAM in $< 1\text{ms}$.
- **Claims Stored in CrackIt JWT**:
  - `sub`: User email
  - `userId`: Internal UUID
  - `role`: `ROLE_USER` or `ROLE_ADMIN`
  - `iat` / `exp`: Issued-at and expiration timestamps (24-hour lifetime).

---

## 4. Authorization (AuthZ) Deep Dive

### 4.1 Role-Based Access Control (RBAC)
CrackIt defines explicit security roles in [`Role.java`](file:///home/stpl/Crackit/crackit/src/main/java/com/crackit/auth/enums/Role.java):
- `ROLE_USER`: Candidates managing their resumes, applications, and mock interview preparations.
- `ROLE_ADMIN`: Platform administrators with access to system telemetry and platform user directories.

#### Spring Security Integration:
In [`CustomUserDetailsService.java`](file:///home/stpl/Crackit/crackit/src/main/java/com/crackit/auth/security/CustomUserDetailsService.java):
```java
String roleName = user.getRole() != null ? user.getRole().name() : "ROLE_USER";
List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(roleName));
return new org.springframework.security.core.userdetails.User(user.getEmail(), user.getPasswordHash(), authorities);
```
When `JwtAuthFilter` runs, it places these authorities into the `SecurityContextHolder`:
```java
UsernamePasswordAuthenticationToken authToken = 
    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
SecurityContextHolder.getContext().setAuthentication(authToken);
```

### 4.2 Method-Level Security (`@PreAuthorize`)
In [`SecurityConfig.java`](file:///home/stpl/Crackit/crackit/src/main/java/com/crackit/auth/config/SecurityConfig.java):
```java
@Configuration
@EnableMethodSecurity(prePostEnabled = true)
```
This enables Spring Security AOP proxies to intercept method calls before execution.

In [`AdminController.java`](file:///home/stpl/Crackit/crackit/src/main/java/com/crackit/admin/controller/AdminController.java):
```java
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController { ... }
```
- If a standard candidate (`ROLE_USER`) attempts to call `GET /api/admin/system/metrics`, Spring Security immediately throws an `AccessDeniedException` and returns **`403 Forbidden`**.
- If an administrator calls it, access is granted (`200 OK`).

### 4.3 Resource Ownership & IDOR Protection
**Insecure Direct Object Reference (IDOR)** is one of the OWASP Top 10 vulnerabilities.
- *Scenario*: User A modifies the URL from `/api/tracker/app-123` to `/api/tracker/app-456` (User B's job application).
- *CrackIt Defense*: In each service (e.g. `JobApplicationService`, `InterviewPrepService`, `ResumeService`), queries always filter by the currently authenticated principal:
  ```java
  String loggedInEmail = SecurityContextHolder.getContext().getAuthentication().getName();
  User user = userRepository.findByEmail(loggedInEmail).orElseThrow(...);
  
  // Ownership check:
  if (!application.getUser().getId().equals(user.getId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You do not own this resource");
  }
  ```
  A candidate cannot view, update, or delete any resource that does not belong to their tenant.

### 4.4 RBAC vs. ABAC
- **RBAC (Role-Based Access Control)**: Access decisions are based strictly on assigned roles (`ROLE_USER`, `ROLE_ADMIN`).
  - *Pros*: Simple, fast, clean to reason about.
  - *Cons*: Cannot handle fine-grained context (e.g. "allow access only during business hours" or "allow access only if candidate created this file").
- **ABAC (Attribute-Based Access Control)**: Access decisions evaluate attributes of the **subject** (user department), **resource** (owner, classification), and **environment** (time, IP address, geolocation).
  - *In CrackIt*: We combine **RBAC** for system-level APIs (`/api/admin/**`) with **Resource Ownership Attributes** (`user.id == resource.ownerId`) for candidate domain data.

---

## 5. Top 10 Senior Engineer Interview Q&A

### Q1: What is the exact difference between Authentication and Authorization?
> **Answer**:  
> **Authentication** is the process of verifying who a user is (e.g., validating credentials with BCrypt or verifying a Google OIDC ID token).  
> **Authorization** is determining what permissions or resources an authenticated user can access (e.g., checking if the user has `ROLE_ADMIN` to view system telemetry or verifying that a candidate owns a specific resume before permitting an edit). Authentication always precedes authorization.

---

### Q2: How does JWT authentication work, and what are its trade-offs compared to Session Cookies?
> **Answer**:  
> A JWT is a self-contained, digitally signed token consisting of a Header, Payload, and Signature.  
> - **Advantages**: Truly stateless. Any backend server in a clustered or microservice architecture can verify the token's HMAC-SHA256 signature in memory using the shared secret without querying a shared Redis session cache or database.  
> - **Trade-offs**: Token revocation is difficult before expiration because the server does not hold state. If a token is compromised, it remains valid until it expires unless you maintain a token revocation blacklist (e.g. in Redis) or keep token lifespans short (15-60 min) with refresh tokens.

---

### Q3: Why is BCrypt preferred for passwords instead of fast hash algorithms like SHA-256 or MD5?
> **Answer**:  
> Fast hashing algorithms like SHA-256 and MD5 were designed for high-speed file checksums, making them dangerous for passwords because modern GPUs can compute billions of SHA-256 hashes per second in offline brute-force attacks.  
> **BCrypt** is intentionally computationally slow:
> 1. It incorporates an internal **work factor** ($2^{\text{cost}}$ rounds). As hardware gets faster, you simply increase the cost factor without changing user passwords.
> 2. It automatically incorporates a unique random 128-bit salt into every hash, neutralizing precomputed **Rainbow Table** attacks.

---

### Q4: How does Google OAuth 2.0 / OpenID Connect (OIDC) work in your React SPA + Spring Boot architecture?
> **Answer**:  
> We use the OpenID Connect (OIDC) flow via Google Identity Services:
> 1. The React SPA renders the Google Sign-In component and receives a signed Google ID Token (JWT) from Google's authorization servers upon user consent.
> 2. The client transmits the ID token to our Spring Boot endpoint `POST /api/auth/google`.
> 3. Spring Boot validates the cryptographic signature and token claims with Google's OIDC service (`https://oauth2.googleapis.com/tokeninfo`).
> 4. We verify that `email_verified` is true, find or auto-provision the user in MySQL, and issue our own signed application JWT containing the user's role.
> This keeps our application server decoupled from Google while providing a frictionless one-click login for candidates.

---

### Q5: How do you defend against Insecure Direct Object References (IDOR)?
> **Answer**:  
> IDOR occurs when an application exposes a reference to an internal resource (like an ID in a URL) without validating that the authenticated user owns that resource.  
> In CrackIt, having a valid JWT only grants identity; it does not grant blanket access to every database ID. In our service layer, every query either:
> 1. Scopes the lookup directly by user: `repository.findByJobIdAndUserId(jobId, loggedInUser.getId())`.
> 2. Explicitly verifies ownership: `if (!entity.getUserId().equals(loggedInUser.getId())) throw new AccessDeniedException()`.

---

### Q6: Why did you configure `csrf().disable()` in Spring Security?
> **Answer**:  
> CSRF (Cross-Site Request Forgery) attacks exploit ambient browser credentials—specifically session cookies that are automatically attached by the browser on cross-origin requests.  
> In our architecture, the client stores the JWT in client storage and explicitly passes it in the `Authorization: Bearer <token>` HTTP header. Browsers never automatically attach custom authorization headers on cross-site requests, making traditional CSRF impossible. Therefore, disabling CSRF protection eliminates unnecessary CSRF token processing overhead.

---

### Q7: How does Spring Security's filter chain execute on incoming requests?
> **Answer**:  
> Spring Security sits as a chain of servlet filters (`SecurityFilterChain`) executed before request dispatcher reaches the controller:
> 1. Our custom `JwtAuthFilter` (extending `OncePerRequestFilter`) intercepts the request.
> 2. It checks for the `Authorization: Bearer` header.
> 3. It parses and cryptographically validates the JWT.
> 4. It extracts username and authorities (`ROLE_USER` / `ROLE_ADMIN`) and sets a `UsernamePasswordAuthenticationToken` in the thread-local `SecurityContextHolder`.
> 5. Downstream filters (like `AuthorizationFilter`) inspect the `SecurityContextHolder` against URL patterns (`requestMatchers`) and `@PreAuthorize` rules.
> 6. At the end of the request lifecycle, the thread-local context is automatically cleared to prevent thread leakages in pooled containers like Tomcat.

---

### Q8: What are the security trade-offs of storing JWTs in `localStorage` vs. `httpOnly` Cookies?
> **Answer**:  
> - **`localStorage`**:
>   - *Pros*: Immune to CSRF; simple to implement in Single Page Applications (SPAs) and mobile apps.
>   - *Cons*: Vulnerable to Cross-Site Scripting (XSS). If malicious JavaScript runs on the page, it can read `localStorage`.
> - **`httpOnly` Cookies**:
>   - *Pros*: Inaccessible to JavaScript, completely protecting against token theft via XSS.
>   - *Cons*: Vulnerable to CSRF attacks unless paired with `SameSite=Strict` cookies and CSRF tokens.
> In high-security enterprise environments, storing short-lived access tokens in memory/context with refresh tokens in `httpOnly` SameSite cookies is considered the gold standard.

---

### Q9: How does Method-Level Security (`@PreAuthorize`) work under the hood?
> **Answer**:  
> When `@EnableMethodSecurity` is enabled, Spring creates a **CGLIB dynamic proxy** around beans with `@PreAuthorize` annotations.  
> When a caller invokes a secured method (like `adminController.getSystemMetrics()`), the proxy intercepts the call before it hits the real method:
> 1. It evaluates the SpEL (Spring Expression Language) expression (e.g. `hasRole('ADMIN')`).
> 2. It queries `SecurityContextHolder.getContext().getAuthentication().getAuthorities()`.
> 3. If the required authority is present, invocation proceeds to the target method.
> 4. If absent, the proxy halts execution and throws an `AccessDeniedException` which translates to an HTTP `403 Forbidden`.

---

### Q10: How would you add Multi-Factor Authentication (MFA / TOTP) to this architecture?
> **Answer**:  
> 1. **Primary Authentication**: The user submits their email and password.
> 2. **Partial Authentication**: If MFA is enabled on the user record, the backend does *not* issue the full application JWT. Instead, it issues a temporary, short-lived token (e.g., 5-minute `MFA_PENDING` token with a limited scope).
> 3. **Second Factor Verification**: The user enters their 6-digit Time-based One-Time Password (TOTP) from an authenticator app (Google Authenticator) or receives an SMS/email OTP.
> 4. **Validation**: The backend verifies the code using the shared HMAC secret (`googleauth` or `aerogear` library) against current Unix time steps.
> 5. **Final JWT Issuance**: Upon successful verification, the backend issues the full application JWT with candidate roles.
