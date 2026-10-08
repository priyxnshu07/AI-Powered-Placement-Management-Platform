# AI-Powered Placement Management Platform

An intelligent talent bridge between engineering colleges and recruiters, built with strict adherence to **SOLID principles** and powered by **Google Gemini AI**. This platform automates the placement lifecycle—from resume parsing and AI-driven job matching to interview scheduling and institutional analytics.

## 🚀 Quick Start

1. **Clone & Infrastructure:**
   ```bash
   docker-compose up -d # Starts Postgres 15 and Redis 7
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   cp .env.example .env   # add GEMINI_API_KEY to enable LLM matching (optional)
   npm install
   npm run dev # Auto-creates tables and seeds data
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   cp .env.example .env   # VITE_API_URL points at the backend
   npm install
   npm run dev # Launches at http://localhost:5173
   ```

4. **Run the tests** (needs the Postgres from step 1; uses a separate `placement_test` database):
   ```bash
   docker exec placement-postgres psql -U admin -d placement_db -c "CREATE DATABASE placement_test"
   cd backend && npm test
   ```

## 🔐 Test Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@placement.dev` | `admin123` |
| **Placement Officer** | `officer@placement.dev` | `officer123` |
| **Recruiter 1** | `rec1@techcorp.com` | `recruiter123` |
| **Recruiter 2** | `rec2@infosys.com` | `recruiter123` |
| **Student 1** | `student1@college.edu` | `student123` |
| **Student 5** | `student5@college.edu` | `student123` |

## 📐 SOLID Architecture

- **Single Responsibility (SRP):** Each module has one reason to change. The `AIMatchingService` handles orchestration, while `geminiProvider` handles only AI communication.
- **Open/Closed (OCP):** New AI models can be added by implementing the `IMatchingEngine` interface without touching the core application logic.
- **Liskov Substitution (LSP):** The system seamlessly falls back from `GeminiProvider` to `RuleBasedProvider` because both adhere to the same interface contract.
- **Interface Segregation (ISP):** User dashboards are role-specific (`StudentDashboard`, `RecruiterDashboard`), ensuring actors only depend on the interfaces they actually use.
- **Dependency Inversion (DIP):** Controllers depend on high-level repository interfaces (`IUserRepository`) rather than concrete database implementations, allowing for easy data-store migration.

## 🤖 AI Subsystem

The platform uses a **Dual-Engine Matching Strategy**:
1. **Primary (Gemini):** Uses LLM semantic analysis to match student skills and intent against job descriptions, providing human-readable matching rationales.
2. **Fallback (Rule-based):** A deterministic engine that keeps matching available when Gemini is unconfigured, slow (8s timeout), down, or returns malformed output. It scores skill overlap and CGPA eligibility.

Gemini results are cached in Redis, keyed by a hash of the exact inputs, so repeat matches skip the LLM call. If Redis is unavailable the app runs uncached rather than failing.

## 📁 Project Structure

```text
placement-platform/
├── backend/
│   ├── src/
│   │   ├── ai/            # Gemini & Rule-based providers
│   │   ├── controllers/   # Role-based API controllers
│   │   ├── interfaces/    # SOLID contract definitions
│   │   ├── middleware/    # Auth & Error handling
│   │   ├── repositories/  # Database access layer
│   │   └── services/      # Business logic (AI matching)
├── frontend/
│   ├── src/
│   │   ├── api/           # Typed API client
│   │   ├── components/    # Shared & Student UI components
│   │   ├── context/       # Auth & Global state
│   │   └── pages/         # Role-specific dashboards
└── docker-compose.yml     # Infrastructure (PG + Redis)
```

## 📖 Reading Order for Mentors

1. **Contracts:** Start at `backend/src/interfaces/` to see the SOLID architectural boundaries.
2. **AI Logic:** Review `backend/src/services/AIMatchingService.js` to see how DIP and OCP are applied to AI.
3. **Data Access:** Check `backend/src/repositories/` for SRP-compliant data operations.
4. **UI Orchestration:** View `frontend/src/router/index.tsx` for role-based protection logic.
