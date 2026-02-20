# Rumbo - Architecture and Flow Diagrams

## System Architecture

High-level view of how all components connect.

```mermaid
graph TB
    subgraph Clients
        WEB[Web App<br/>React + Vite]
        DESKTOP[Desktop App<br/>Tauri]
        MOBILE[Mobile App<br/>React Native]
    end

    subgraph Monorepo Packages
        UI[packages/ui<br/>Shared Components]
        SHARED[packages/shared<br/>Types, Zod, Utils]
        DB[packages/db<br/>Drizzle Schema]
    end

    subgraph Backend
        API[REST API<br/>Hono + OpenAPI]
        AUTH[Auth<br/>Better Auth]
        QUEUE[Job Queue<br/>BullMQ]
    end

    subgraph Data
        PG[(PostgreSQL)]
        REDIS[(Redis)]
    end

    subgraph External Services
        R2[Cloudflare R2<br/>File Storage]
        RESEND[Resend<br/>Email]
        AI[Vercel AI SDK<br/>OpenAI / Anthropic]
    end

    WEB --> API
    DESKTOP --> API
    MOBILE --> API

    WEB -.-> UI
    WEB -.-> SHARED
    DESKTOP -.-> UI
    DESKTOP -.-> SHARED
    MOBILE -.-> SHARED

    API --> PG
    API --> REDIS
    API --> AUTH
    API --> QUEUE
    API --> R2
    API --> AI
    API -.-> DB
    API -.-> SHARED

    AUTH --> PG
    QUEUE --> REDIS
    QUEUE --> RESEND
    QUEUE --> AI
```

## Monorepo Structure

How code is organized and dependencies flow between packages.

```mermaid
graph LR
    subgraph apps
        WEB[apps/web<br/>React + Vite]
        API_APP[apps/api<br/>Hono + BullMQ]
        MOBILE_APP[apps/mobile<br/>React Native]
        DESKTOP_APP[apps/desktop<br/>Tauri]
    end

    subgraph packages
        SHARED[packages/shared<br/>Types, Zod schemas<br/>Constants, Utils]
        DB_PKG[packages/db<br/>Drizzle schema<br/>Migrations, Seed]
        UI_PKG[packages/ui<br/>React components<br/>Shadcn/ui based]
    end

    WEB --> SHARED
    WEB --> UI_PKG
    API_APP --> SHARED
    API_APP --> DB_PKG
    MOBILE_APP --> SHARED
    DESKTOP_APP --> SHARED
    DESKTOP_APP --> UI_PKG
    UI_PKG --> SHARED
    DB_PKG --> SHARED
```

## Data Model

Core entities and their relationships.

```mermaid
erDiagram
    USER ||--o{ FINANCIAL_PRODUCT : owns
    USER ||--o{ CATEGORY : creates
    USER ||--o{ BUDGET : sets
    USER ||--o{ SAVINGS_GOAL : defines

    FINANCIAL_PRODUCT ||--o{ TRANSACTION : has
    FINANCIAL_PRODUCT ||--o{ RECURRING_EXPENSE : has

    TRANSACTION }o--|| CATEGORY : belongs_to
    BUDGET }o--|| CATEGORY : tracks

    RECURRING_EXPENSE }o--|| CATEGORY : belongs_to
    RECURRING_EXPENSE ||--o{ REMINDER : generates

    CATEGORY ||--o{ SUBCATEGORY : contains

    USER {
        uuid id PK
        string email
        string name
        string auth_provider
    }

    FINANCIAL_PRODUCT {
        uuid id PK
        uuid user_id FK
        enum type
        string name
        decimal balance
        string currency
        jsonb metadata
    }

    TRANSACTION {
        uuid id PK
        uuid product_id FK
        uuid category_id FK
        uuid transfer_id
        enum type
        decimal amount
        string currency
        date date
        string notes
    }

    CATEGORY {
        uuid id PK
        uuid user_id FK
        string name
        boolean is_default
    }

    SUBCATEGORY {
        uuid id PK
        uuid category_id FK
        string name
    }

    BUDGET {
        uuid id PK
        uuid user_id FK
        uuid category_id FK
        decimal amount
        string currency
        enum period
    }

    RECURRING_EXPENSE {
        uuid id PK
        uuid product_id FK
        uuid category_id FK
        enum amount_type
        decimal amount
        string currency
        int due_day
        enum frequency
    }

    REMINDER {
        uuid id PK
        uuid recurring_expense_id FK
        int days_before
        enum channel
        boolean active
    }

    SAVINGS_GOAL {
        uuid id PK
        uuid user_id FK
        string name
        decimal target_amount
        string currency
        decimal current_amount
        date target_date
    }
```

**Financial product types**: savings, checking, credit_card, loan_free_investment, loan_mortgage, investment_cdt, investment_fund, investment_stock, cash

**Transaction types**: income, expense, transfer

Transfer implementation (double entry):
- A transfer creates two transactions with the same `transfer_id`.
- Source account: `expense` for the amount.
- Destination account: `income` for the amount.
- Reporting should exclude transfer pairs from income/expense totals unless explicitly requested.

**Recurring expense amount types**: fixed (same every period), variable (amount changes, date stays)

## Balance Convention and Currency Rules

Balance sign convention:
- **Asset accounts** (savings, checking, cash, investments): `balance` is the user's owned value. Positive means they have money/assets.
- **Liability accounts** (credit cards, loans): `balance` is the amount owed. Positive means debt.

How transactions affect balances:
- **Asset accounts**: `income` increases balance, `expense` decreases balance.
- **Liability accounts**: `income` decreases balance (payments reduce debt), `expense` increases balance (charges increase debt).

Currency rules (MVP):
- Every financial product has a `currency` (COP or USD).
- Transactions must match the product currency.
- Budgets and savings goals are single-currency.
- Transfers are only allowed between accounts with the same currency.

## Financial Product Onboarding Flow

This flow is non-trivial due to optional statement scanning, AI categorization, and the balance source-of-truth rule.

```mermaid
flowchart TD
    START([Add Financial Product]) --> TYPE[Select product type<br/>Savings, Credit Card, Loan, etc.]
    TYPE --> BASIC[Enter basic info<br/>Name, balance, currency]
    BASIC --> METADATA{Product type<br/>specific fields?}

    METADATA -->|Credit Card| CC[Credit limit, billing cycle,<br/>closing date, payment date]
    METADATA -->|Loan| LOAN[Term, interest rate,<br/>monthly payment, remaining balance]
    METADATA -->|Investment| INV[Type, return rate,<br/>start date, maturity date]
    METADATA -->|Savings/Checking/Cash| SIMPLE[No extra fields]

    CC --> STATEMENT
    LOAN --> STATEMENT
    INV --> STATEMENT
    SIMPLE --> STATEMENT

    STATEMENT{Upload bank<br/>statement?}
    STATEMENT -->|Yes| UPLOAD[Upload PDF/CSV]
    STATEMENT -->|No| SAVE

    UPLOAD --> AI_PARSE[AI parses statement<br/>extracts transactions]
    AI_PARSE --> AI_CATEGORIZE[AI categorizes<br/>transactions]
    AI_CATEGORIZE --> REVIEW{Unresolved<br/>transactions?}

    REVIEW -->|Yes| USER_RESOLVE[User categorizes<br/>or skips unresolved]
    REVIEW -->|No| BALANCE_CHECK

    USER_RESOLVE --> BALANCE_CHECK

    BALANCE_CHECK{Statement balance<br/>≠ user balance?}
    BALANCE_CHECK -->|Yes| INFORM[Inform user:<br/>discrepancy noted,<br/>user balance kept]
    BALANCE_CHECK -->|No| SAVE

    INFORM --> SAVE
    SAVE([Product created<br/>with real data])
```

## Recurring Expenses and Reminder Pipeline

Shows how background jobs handle recurring expense tracking and multi-channel notifications.

```mermaid
flowchart TD
    CREATE([Create Recurring Expense]) --> TYPE{Amount type}
    TYPE -->|Fixed| FIXED[Set exact amount<br/>e.g. Rent $1,500,000]
    TYPE -->|Variable| VARIABLE[Set estimated amount<br/>e.g. Water ~$80,000]

    FIXED --> SCHEDULE[Set due day<br/>and frequency]
    VARIABLE --> SCHEDULE

    SCHEDULE --> ACCOUNT[Link to account<br/>that pays]
    ACCOUNT --> CATEGORY_R[Assign category]
    CATEGORY_R --> REMINDERS[Configure reminders<br/>Days before, channels]
    REMINDERS --> SAVE([Saved])

    SAVE --> CRON[BullMQ scheduled job<br/>checks daily]

    CRON --> CHECK{Payment due<br/>within reminder<br/>window?}
    CHECK -->|Yes| NOTIFY[Send notification]
    CHECK -->|No| WAIT[Wait until next check]

    NOTIFY --> PUSH[Push notification]
    NOTIFY --> EMAIL_N[Email]
    NOTIFY --> IN_APP[In-app notification]

    PUSH --> USER_ACTION{User action}
    EMAIL_N --> USER_ACTION
    IN_APP --> USER_ACTION

    USER_ACTION -->|Fixed amount| AUTO_SUGGEST[Suggest transaction<br/>with pre-filled data]
    USER_ACTION -->|Variable amount| PROMPT[Prompt user to<br/>enter actual amount]

    AUTO_SUGGEST --> REGISTER[Register transaction]
    PROMPT --> REGISTER
```

## Backend API Structure

Internal organization of the API layer, business logic, data access, and background jobs.

```mermaid
graph TB
    subgraph API Layer
        ROUTES[Hono Routes<br/>OpenAPI defined]
        MIDDLEWARE[Middleware<br/>Auth, CORS, Logging, Rate Limit]
    end

    subgraph Business Logic
        PRODUCTS_SVC[Products Service]
        TRANSACTIONS_SVC[Transactions Service]
        BUDGETS_SVC[Budgets Service]
        RECURRING_SVC[Recurring Service]
        CALENDAR_SVC[Calendar Service]
        NOTIFICATIONS_SVC[Notifications Service]
        AI_SVC[AI Service]
        ONBOARDING_SVC[Onboarding Service]
    end

    subgraph Data Layer
        DRIZZLE[Drizzle ORM]
        CACHE[Redis Cache]
    end

    subgraph Jobs
        REMINDER_JOB[Reminder Job<br/>Check due payments daily]
        RECURRING_JOB[Recurring Job<br/>Generate recurring transactions]
        AI_JOB[AI Job<br/>Statement parsing, categorization]
        EMAIL_JOB[Email Job<br/>Send notifications]
    end

    ROUTES --> MIDDLEWARE
    MIDDLEWARE --> PRODUCTS_SVC
    MIDDLEWARE --> TRANSACTIONS_SVC
    MIDDLEWARE --> BUDGETS_SVC
    MIDDLEWARE --> RECURRING_SVC
    MIDDLEWARE --> CALENDAR_SVC
    MIDDLEWARE --> NOTIFICATIONS_SVC
    MIDDLEWARE --> AI_SVC
    MIDDLEWARE --> ONBOARDING_SVC

    PRODUCTS_SVC --> DRIZZLE
    TRANSACTIONS_SVC --> DRIZZLE
    BUDGETS_SVC --> DRIZZLE
    RECURRING_SVC --> DRIZZLE
    CALENDAR_SVC --> DRIZZLE
    NOTIFICATIONS_SVC --> DRIZZLE
    AI_SVC --> DRIZZLE
    ONBOARDING_SVC --> DRIZZLE
    ONBOARDING_SVC --> AI_SVC

    DRIZZLE --> PG[(PostgreSQL)]
    CACHE --> REDIS[(Redis)]

    RECURRING_SVC --> REMINDER_JOB
    RECURRING_SVC --> RECURRING_JOB
    AI_SVC --> AI_JOB
    NOTIFICATIONS_SVC --> EMAIL_JOB

    REMINDER_JOB --> REDIS
    RECURRING_JOB --> REDIS
    AI_JOB --> REDIS
    EMAIL_JOB --> REDIS
```

## Deployment Architecture

```mermaid
graph TB
    subgraph User Devices
        BROWSER[Web Browser]
        PHONE[Mobile]
        PC[Desktop]
    end

    subgraph Cloudflare
        PAGES[Cloudflare Pages<br/>Web frontend]
        WORKERS[Cloudflare Workers<br/>Hono API]
        R2_STORAGE[Cloudflare R2<br/>File storage]
    end

    subgraph Managed Services
        NEON[(Neon PostgreSQL<br/>Serverless)]
        UPSTASH[(Upstash Redis<br/>Serverless)]
    end

    subgraph External
        RESEND_SVC[Resend<br/>Email delivery]
        AI_PROVIDERS[AI Providers<br/>OpenAI / Anthropic]
    end

    BROWSER --> PAGES
    BROWSER --> WORKERS
    PHONE --> WORKERS
    PC --> WORKERS
    WORKERS --> NEON
    WORKERS --> UPSTASH
    WORKERS --> R2_STORAGE
    WORKERS --> AI_PROVIDERS
    WORKERS --> RESEND_SVC
```

## Statement Scanning Flow (Extra Feature)

Async flow showing how bank statement import works across multiple services.

```mermaid
sequenceDiagram
    actor User
    participant Client as Client App
    participant API as Hono API
    participant Queue as BullMQ
    participant AI as Vercel AI SDK
    participant DB as PostgreSQL
    participant R2 as Cloudflare R2

    User->>Client: Upload bank statement (PDF/CSV)
    Client->>API: POST /products/:id/import-statement
    API->>R2: Store original file
    API->>Queue: Enqueue parsing job
    API-->>Client: 202 Accepted (job queued)

    Queue->>R2: Fetch file
    Queue->>AI: Parse statement content
    AI-->>Queue: Extracted transactions

    Queue->>AI: Categorize each transaction
    AI-->>Queue: Categorized transactions

    Queue->>DB: Save transactions (status: pending_review)
    Queue-->>Client: Notify: parsing complete

    Client-->>User: Show parsed transactions
    User->>Client: Review, resolve uncategorized, confirm
    Client->>API: POST /products/:id/confirm-import
    API->>DB: Update transactions (status: confirmed)
    API->>DB: Recalculate analytics
    API-->>Client: Import complete
```
