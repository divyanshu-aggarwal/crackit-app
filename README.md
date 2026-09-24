# CrackIt 🚀
### AI-Powered Intelligent Job Application & Career Acceleration Platform

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Apache Kafka](https://img.shields.io/badge/Kafka-KRaft_3.7-231F20?logo=apachekafka&logoColor=white)](https://kafka.apache.org/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)

---

## 📖 Overview

**CrackIt** is a full-stack, enterprise-grade job search accelerator and application management system. It bridges the gap between candidate qualifications and recruiter expectations by combining:
- Automated multi-source **job discovery**
- **AI-driven job description (JD) matching** and gap analysis
- **Targeted resume tailoring**
- **Real-time AI mock interview preparation** powered by Apache Kafka event streaming
- An intuitive **Kanban-style job application tracker**

---

## 🌟 Key Features

### 1. 🤖 Intelligent JD Analysis & Match Scoring
- Analyzes candidate profiles against target job descriptions using Google Gemini LLM.
- Generates match percentages, missing technical skills, keyword recommendations, and customized strengths/weaknesses breakdowns.

### 2. 📄 Targeted Resume Tailoring
- Generates tailored bullet points mapped directly to specific job requirements.
- Highlights transferable achievements and formats export-ready resume content.

### 3. 🎙️ AI Interview Preparation & Live Mock Chat
- Asynchronously generates comprehensive interview preparation roadmaps (topics, behavioral & technical questions, sample answers) via **Apache Kafka event-driven pipelines**.
- Interactive chat assistant to simulate technical interviews with instant feedback.

### 4. 🔍 Multi-Source Job Discovery
- Aggregates live job postings across top platforms using **Adzuna** and **JSearch** APIs.
- Filter by remote/hybrid status, experience level, salary range, and company.

### 5. 📊 Application Pipeline & Tracker
- Manage job applications across statuses: `Saved`, `Applied`, `Interviewing`, `Offered`, `Rejected`.
- Track timeline notes, interview dates, recruiter contacts, and compensation packages.

### 6. 📱 Responsive Modern UI
- Pixel-perfect, responsive UI built with React 19, Tailwind CSS v4, Lucide icons, and Tabler icons.
- Optimized for mobile and desktop screens.

---

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────┐
│               Frontend (React 19 + Vite)               │
│                   Port: 5173 / 3000                    │
└──────────────────────────┬─────────────────────────────┘
                           │ REST / JSON (JWT Auth)
                           ▼
┌────────────────────────────────────────────────────────┐
│             Core Backend (Spring Boot 3.5)             │
│                       Port: 8080                       │
│  - Authentication & JWT Security                       │
│  - Job Discovery & Scraping Aggregators                │
│  - Application Tracker & Master Resume Services        │
│  - Career Prep Roadmap & Target Compatibility Engine   │
│  - Distributed Rate Limiter & Quota Enforcement        │
│  - Idempotent Webhook Payment Processing               │
└────────────┬─────────────────────────────┬─────────────┘
             │                             │
    Event Streaming               Direct HTTP Proxy
             │                             │
             ▼                             ▼
┌─────────────────────────┐   ┌──────────────────────────┐
│   Apache Kafka (KRaft)  │   │  AI Service (FastAPI)    │
│        Port: 9092       │   │        Port: 8000        │
│   Topics:               │   │  - Google Gemini 2.5     │
│   - interview-prep-req  │   │  - PDF/DOCX Parsing      │
│   - interview-prep-resp │   │  - Resume Tailoring      │
│   - roadmap-events      │   │  - Career Roadmap Engine │
└────────────┬────────────┘   └──────────────────────────┘
             │
             ▼
┌─────────────────────────┐   ┌──────────────────────────┐
│  TiDB Cloud Serverless  │   │  Upstash Redis In-Memory │
│  (Distributed HTAP)     │   │  (Sliding Window Log &   │
│        Port: 4000       │   │   Cache-Aside Pattern)   │
└─────────────────────────┘   └──────────────────────────┘
```

---

## 📚 Architecture & System Design Deep Dives

Detailed architectural blueprints and Staff/Principal system design guides documenting CrackIt's production design choices:

* **[🏛️ Master End-to-End System Design Blueprint](SYSTEM_DESIGN_BLUEPRINT.md)**: Unified Staff/Principal blueprint covering global topology, sync vs. async boundaries, distributed guarantees, \$0/month zero-cost engineering, and the top 10 interview questions with model answers.
* **[🛡️ Distributed Rate Limiting Guide](DISTRIBUTED_RATE_LIMITING_GUIDE.md)**: Redis Sliding Window Log with atomic Lua script, Spring AOP `@RateLimit` annotations, and fail-open resilience.
* **[🤖 AI Integration Architecture Guide](AI_INTEGRATION_ARCHITECTURE_GUIDE.md)**: Google X-Y-Z formula, anti-anchoring metric diversity, and discipline-adaptive prompt rubrics.
* **[🗺️ Career Prep Roadmap Architecture](CAREER_ROADMAP_ARCHITECTURE_GUIDE.md)**: Dynamic multi-week milestones, target company cultural/skill compatibility matrices, and cold-start onboarding.
* **[💳 Payment Gateway & Idempotency Guide](PAYMENT_GATEWAY_ARCHITECTURE_GUIDE.md)**: Razorpay checkout integration, cryptographic HMAC-SHA256 signature verification, and atomic state deduplication.
* **[⚡ Redis Cache Architecture Guide](REDIS_CACHE_ARCHITECTURE_GUIDE.md)**: Cache-Aside pattern, TTL jitter against cache stampedes, and negative caching.
* **[📨 Kafka Event Streaming Guide](KAFKA_ARCHITECTURE_GUIDE.md)**: Event-driven architecture, producer idempotence, consumer offset management, and dead-letter queues.
* **[🔐 Authentication & Security Guide](AUTH_ARCHITECTURE_GUIDE.md)**: Stateless JWT authentication, RBAC, Google OAuth2 integration, and token revocation.

---

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router 7, Axios, Lucide React, Tabler Icons |
| **Backend Core** | Spring Boot 3.5 (Java 17), Spring Security 6 (JWT + Google OAuth2), Spring Data JPA, Hibernate, Maven |
| **AI Microservice** | Python 3.12, FastAPI, Uvicorn, Google GenAI SDK (`google-genai`), PyMuPDF, WeasyPrint |
| **Message Broker** | Apache Kafka (KRaft mode), Kafka UI |
| **Database** | MySQL 8.0 |
| **DevOps / Infra** | Docker, Docker Compose, Bash automation scripts |

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- **Java 17+** & **Maven**
- **Node.js 18+** & **npm**
- **Python 3.10+**
- **MySQL 8.0**
- **Docker & Docker Compose** (for Apache Kafka)

---

### Installation & Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/divyanshu-aggarwal/crackit-app.git
cd crackit-app
```

#### 2. Environment Configuration
Copy the sample environment file and configure your credentials:
```bash
cp .env.example .env
```

Edit `.env` with your API keys:
```env
# Database
SPRING_DATASOURCE_PASSWORD=your_mysql_password

# External Job Discovery APIs
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
JSEARCH_API_KEY=your_rapidapi_jsearch_key

# Google Gemini AI API
GEMINI_API_KEY=your_gemini_api_key

# Security
JWT_SECRET=your_super_secret_jwt_key
```

#### 3. Start Supporting Infrastructure (Kafka)
```bash
docker compose -f docker/docker-compose.kafka.yml up -d
```
- Kafka broker runs on `localhost:9092`.
- Kafka UI is accessible at `http://localhost:8085`.

#### 4. Run the Python AI Microservice
```bash
cd crackit-ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

#### 5. Run the Spring Boot Backend
```bash
cd crackit
mvn spring-boot:run
```
Backend runs on `http://localhost:8080`.

#### 6. Run the Frontend
```bash
cd crackit-ui
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## ⚡ Quick Start Script
Alternatively, inspect and run the unified dev script:
```bash
./start-dev.sh
```

---

## 🔒 Security & Privacy

- All sensitive keys (API tokens, database credentials, JWT secrets) are loaded dynamically through environment variables and local untracked config files.
- Zero credentials or secrets are committed to version control.

---

## 👤 Author

**Divyanshu Agarwal**
- GitHub: [@divyanshu-aggarwal](https://github.com/divyanshu-aggarwal)
- Email: divyanshu5981.iimt@gmail.com

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
