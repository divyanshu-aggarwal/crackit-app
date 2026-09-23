#!/usr/bin/env bash
# ==============================================================================
# CrackIt - Local Development Environment Quick Starter & Status Checker
# ==============================================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}          CrackIt Full-Stack Health & Starter        ${NC}"
echo -e "${BLUE}=====================================================${NC}\n"

# Load local environment if present
if [ -f "$ROOT_DIR/.env" ]; then
    set -a
    source "$ROOT_DIR/.env" 2>/dev/null
    set +a
fi

# 1. Check MySQL
echo -e "${YELLOW}[1/5] Checking MySQL Database...${NC}"
DB_PASS="${SPRING_DATASOURCE_PASSWORD:-}"
if [ -n "$DB_PASS" ]; then
    CHECK_CMD="mysqladmin ping -u root -p$DB_PASS"
else
    CHECK_CMD="mysqladmin ping -u root"
fi

if $CHECK_CMD &>/dev/null; then
    echo -e "  ${GREEN}✓ MySQL is RUNNING on port 3306 (database: job_assistant)${NC}"
else
    echo -e "  ${RED}✗ MySQL is NOT running.${NC}"
    echo -e "    Please run: ${YELLOW}sudo service mysql start${NC}"
fi

# 2. Check Kafka Docker
echo -e "\n${YELLOW}[2/5] Checking Kafka & Kafka UI Docker containers...${NC}"
if docker ps --format '{{.Names}}' | grep -q "crackit-kafka"; then
    echo -e "  ${GREEN}✓ Kafka KRaft broker is RUNNING on localhost:9092${NC}"
else
    echo -e "  ${YELLOW}! Starting Kafka via docker compose...${NC}"
    docker compose -f "$ROOT_DIR/docker/docker-compose.kafka.yml" up -d
fi

if docker ps --format '{{.Names}}' | grep -q "crackit-kafka-ui"; then
    echo -e "  ${GREEN}✓ Kafka UI is RUNNING on http://localhost:8085${NC}"
fi

# 3. Check Python AI Service
echo -e "\n${YELLOW}[3/5] Python FastAPI AI Service status (Port 8000)...${NC}"
if curl -s http://localhost:8000/ &>/dev/null; then
    echo -e "  ${GREEN}✓ AI Service is RUNNING on http://localhost:8000${NC}"
else
    echo -e "  ${YELLOW}- Not running. Start command:${NC}"
    echo -e "    ${BLUE}cd $ROOT_DIR/crackit-ai-service && source venv/bin/activate && uvicorn app.main:app --port 8000 --reload${NC}"
fi

# 4. Check Spring Boot Backend
echo -e "\n${YELLOW}[4/5] Spring Boot Backend status (Port 5981)...${NC}"
if curl -s http://localhost:5981/actuator/health &>/dev/null || curl -s http://localhost:5981/api/auth &>/dev/null; then
    echo -e "  ${GREEN}✓ Spring Boot is RUNNING on http://localhost:5981${NC}"
else
    echo -e "  ${YELLOW}- Not running. Start command:${NC}"
    echo -e "    ${BLUE}cd $ROOT_DIR/crackit && mvn spring-boot:run${NC}"
fi

# 5. Check React Vite Frontend
echo -e "\n${YELLOW}[5/5] React Frontend status (Port 5173)...${NC}"
if curl -s http://localhost:5173/ &>/dev/null; then
    echo -e "  ${GREEN}✓ React UI is RUNNING on http://localhost:5173${NC}"
else
    echo -e "  ${YELLOW}- Not running. Start command:${NC}"
    echo -e "    ${BLUE}cd $ROOT_DIR/crackit-ui && npm run dev${NC}"
fi

echo -e "\n${BLUE}=====================================================${NC}"
echo -e "${GREEN}All services and commands summarized above!${NC}"
echo -e "${BLUE}=====================================================${NC}\n"
