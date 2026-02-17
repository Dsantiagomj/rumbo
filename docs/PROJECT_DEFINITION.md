# Rumbo - Project Definition

Rumbo is a personal finance management application designed for the Colombian context as its starting point. It provides complete control over income, expenses, and all financial products, helping users understand where their money goes, plan ahead, and stay on track toward their financial goals.

## Problem Statement

People lack visibility into their personal finances. Without a clear picture of income, expenses, and financial obligations, they face three recurring problems:

1. **Uncontrolled spending**: Unnecessary purchases, forgotten subscriptions, and impulse buys go unnoticed because there is no tracking in place.
2. **Inability to plan**: Without data, there is no way to know how much can be saved, invested, or spent without risk.
3. **Financial surprises**: Forgotten due dates, unexpected charges, and unplanned expenses cause stress and financial damage.

Existing tools fail to solve this. Generic international apps do not understand the Colombian financial context (products, currency, categories). Apps that do exist are either too complex (features the user does not need) or too simple (cannot handle multiple accounts, credit cards, loans, and investments). Most critically, the friction of manual transaction entry causes users to abandon these tools within weeks.

Rumbo solves this by providing a finance tracker that is contextually relevant, comprehensive enough to handle real financial complexity, and focused on reducing the friction of daily use through automation aids (shortcuts, OCR, smart reminders).

## Target Users

### Primary User Profile

Any adult in Colombia who manages personal finances and wants control over their money. No age restriction. The typical user:

- Has multiple financial products (6-10: savings accounts, credit cards, loans, investments)
- Has mixed income sources (employment + freelance/side projects)
- Does not currently track finances in any structured way
- Has tried other apps but abandoned them due to lack of context, excessive complexity, or the friction of manual entry
- Wants to know if they are on track toward financial freedom, not just their current balance

### Future Expansion

- Multi-user support for partners and families sharing finances
- Potential expansion beyond the Colombian market (the Colombian context is the starting point, not necessarily the limit)

## Goals and Objectives

1. **Complete financial visibility**: The user knows exactly where their money goes at all times across all their financial products.
2. **Informed decision making**: The user has enough data to decide whether they can spend, save, or invest with confidence.
3. **No financial surprises**: The user knows what payments are coming, when they are due, and is reminded in advance to prepare.
4. **Financial progress tracking**: The user can see whether they are on track toward their financial goals (not just their current balance, but their trajectory).

## Success Metrics

1. **Daily engagement**: The user registers transactions consistently without it feeling like a burden.
2. **Data accuracy**: Account balances in Rumbo reflect reality and match the user's actual bank balances.
3. **Behavioral improvement**: Over time, the user reduces unnecessary spending and increases savings as a result of having visibility and data.
4. **Retention**: The user continues using Rumbo beyond the first month (solving the abandonment problem of competing apps).

## What Rumbo is NOT

- **Not open banking.** Rumbo does not connect to bank APIs to read transactions automatically. All financial data is entered by the user or imported via statement scanning.
- **Not accounting software.** Rumbo is not designed for business accounting, invoicing, tax filing, or payroll. It is strictly a personal finance tool.
- **Not a payment processor.** Rumbo does not move real money. It is not a digital wallet, a payment gateway, or a banking app. It tracks finances, it does not execute transactions.

## Platform and Locale

- **Platform**: Web, mobile, and desktop equally (responsive PWA + desktop app)
- **Language**: Colombian Spanish (es-CO)
- **Currencies**: COP (primary) + USD

## Core Features

Core features are those that provide immediate value from the first session. Without these, the app does not fulfill its basic purpose.

### Financial Products

Support for all Colombian financial products with no limit on quantity:

- Savings accounts (Cuentas de ahorro)
- Checking accounts (Cuentas corriente)
- Credit cards (Tarjetas de credito)
- Free investment loans (Creditos de libre inversion)
- Mortgage loans (Creditos hipotecarios)
- Investments (CDTs, funds, stocks)

Each product type has its own behavior: credit cards have billing cycles and credit limits, loans have terms, rates, and installments, investments have returns, etc.

### Transactions

Three types tracked:

- **Income**: Money coming in (salary, freelance, transfers from others, etc.)
- **Expenses**: Money going out (purchases, payments, fees, etc.)
- **Transfers**: Movements between the user's own accounts

All transactions are manual in the base experience. Every transaction is associated with an account, a category, an amount, and a date.

### Categories and Subcategories

Two-level categorization system:

- **Predefined categories** for the Colombian context (Alimentacion, Transporte, Servicios, Salud, Entretenimiento, Vivienda, etc.)
- **Subcategories** for granular analysis (e.g., Comida > Mercado, Restaurantes, Domicilios)
- **Custom categories and subcategories** can be created by the user

### Budgets

Spending limits per category with real-time tracking:

- User sets a budget amount per category (monthly, weekly, or yearly)
- The app shows how much has been spent vs the limit

### Recurring Expenses

Two types of recurring expenses:

- **Fixed amount**: Rent, subscriptions (Netflix, Spotify, gym). The amount is the same every period.
- **Variable amount with fixed date**: Utility bills (water, electricity, gas). The amount varies each month but the payment date is roughly the same.

Recurring expenses are registered once and repeat automatically each period.

### Financial Calendar

Calendar view of the user's financial obligations:

- Visual display of when payments are due
- Smart anticipatory reminders (e.g., "Rent is due in 5 days, make sure you have the funds")
- Overview of upcoming recurring expenses for the month
- Integration with both fixed and variable recurring expenses

### Reminders and Notifications

Multi-channel notification system, all configurable by the user:

- Push notifications (mobile/browser)
- Email reminders
- In-app notifications

Reminders cover both payment due dates and transaction registration prompts (e.g., "You haven't registered any transactions today").

### Dashboard

Customizable, widget-based dashboard (similar to AWS Console). The user decides what to see, in what order, and can add or remove widgets as they prefer.

Available widgets include:

- Upcoming payments and due dates
- Monthly spending summary vs budgets
- Financial goal progress
- Total balance (general and broken down by account/product)
- Recent transactions
- Recurring expenses overview
- Calendar snapshot

The default layout prioritizes progress and awareness, but the user has full control to rearrange, add, or remove any widget.

### Smart Account Onboarding

When creating a new financial product, the user can jumpstart their account with real data:

1. User enters basic data: name, type, current balance
2. User has the **option** to upload or scan a bank statement
3. AI categorizes the transactions from the statement into existing categories
4. Transactions that could not be categorized are presented to the user for manual resolution (or can be left uncategorized)
5. Result: the account starts with real historical data for immediate analysis

**Rules during onboarding:**

- The user-provided balance is the **source of truth**. If the user says the balance is $10 and the statement says $50, the balance is $10.
- Time gaps between the statement end date and the account creation date are informational, not blocking. The system informs the user: "There are X days without transactions. Analysis is based on available data."
- The user can add past transactions to fill the gap but it is not required and does not block anything.

**After onboarding:**

- All transactions added (past or present) modify the balance normally as expected: income increases it, expenses decrease it, transfers move funds between accounts.
- If historical transactions cause a discrepancy with the stated balance, the system informs the user but does not block any functionality.

## Extra Features (Later Phases)

### Reports and Charts

Visual analysis of financial data:

- Spending trends over time
- Monthly comparisons
- Spending distribution by category and subcategory

### Savings Goals

Financial objectives with progress tracking:

- Define a goal with a target amount (e.g., "Vacation - $2,000,000 COP")
- Track progress over time
- Visual indicators of how close the user is to their goal

### Consumption Intelligence (OCR + AI)

A consumption analysis engine that goes beyond simple receipt scanning:

- **Quick transaction registration**: User uploads a receipt (e.g., from Olimpica), the system identifies the category (groceries + household), extracts the amount, confirms with the user, and registers the transaction
- **Pattern identification**: "You buy milk every 15 days"
- **Predictions**: "Based on your pattern, you will run out of milk in X days"
- **Recommendations**: "Instead of buying milk at store Y, buy at store Z where there is a discount today"

Receipt and bill scanning feeds data into this intelligence layer, enabling increasingly accurate pattern detection over time.

### AI Financial Advisor

Chat interface for personalized financial guidance:

- User asks questions about their finances
- AI analyzes the user's actual financial data (transactions, budgets, spending patterns)
- Provides personalized recommendations and insights

### Shared Expenses (Groups and Trips)

Splitwise-style shared expense tracking built into Rumbo:

- Create groups for trips, shared living, events, or any shared expense scenario
- Register shared expenses and specify who paid and how costs are split among participants
- Automatic balance calculation: who owes whom and how much
- Settlement tracking: mark debts as paid
- Shared expenses integrate with the user's personal transaction history

### Automation Aids

Tools to reduce the friction of manual transaction entry:

- **iOS Shortcuts / Apple Wallet integration**: After paying with iPhone via Apple Pay, use a shortcut to quickly register the transaction in the associated account
- **Transaction registration reminders**: Periodic prompts to register pending transactions
- **OCR quick-capture**: Scan a receipt or invoice to pre-fill transaction details for quick confirmation

## User Scenarios

### Daily Use

The user registers transactions in a mix of moments: some immediately after a purchase, others at the end of the day. The app accommodates both patterns without enforcing a specific routine.

### Opening the App

The user sees their personalized dashboard with the widgets they chose to display, in the order they arranged them. The default layout emphasizes upcoming payments and financial progress, but users who prefer to see their total balance first can configure that. Every user's home screen reflects what matters most to them.

### New Account Setup

A user opens a new credit card. They add it to Rumbo with the credit limit and current balance. They optionally upload their first statement. The AI categorizes the transactions. The user resolves a few that were unclear. The credit card now shows real spending history from day one.

### Recurring Bill Management

The user registers their rent ($1,500,000 COP, due on the 5th of every month) and their water bill (variable amount, due around the 20th). Five days before rent is due, they get a push notification: "Rent is due in 5 days. Make sure you have the funds in your Bancolombia account." For the water bill, they get a reminder on the due date to update the amount and confirm the payment.

## Assumptions

1. **Manual registration is viable with automation aids.** Users are willing to register transactions manually as long as the process is fast and supported by tools that reduce friction (shortcuts, OCR, reminders).
2. **Predefined categories cover the majority of typical Colombian expenses.** The default category set is sufficient for most users, with custom categories handling edge cases.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| User abandons due to friction of manual entry | High - renders the app useless | Minimize registration to fewest possible steps. Provide automation aids (shortcuts, OCR, reminders). Make it faster to register in Rumbo than to forget. |
| Over-engineering before launch | High - app never ships | Focus strictly on core features first. Extras are explicitly deferred to later phases. Ship a usable product before adding intelligence layers. |

## Constraints

1. **No access to Colombian bank APIs.** There is no open banking infrastructure in Colombia. All financial data must be entered by the user or imported via statement scanning.
2. **Bank statements have no standard format.** Each Colombian bank produces statements in different formats (PDF layouts, CSV structures, date formats). The statement scanning feature must handle this variability.

## Prioritization Framework

Features are classified as **core** or **extra** based on a single criterion: **immediate value**.

- **Core features** are those the user needs from the very first session to get value from the app. Without them, Rumbo does not fulfill its basic purpose of providing financial visibility and control.
- **Extra features** enhance the experience but require either accumulated historical data (reports, AI advisor), external integrations (OCR, shortcuts), or social features (shared expenses) that are not necessary for individual daily use.

## Design Principles

1. **Nothing blocks, nothing forces, the user is in control.** The app adapts to the user, not the other way around. No feature should ever prevent the user from using the app.

2. **Manual input always takes priority.** User-provided data is the source of truth over any analyzed, imported, or calculated data.

3. **Discrepancies are informational, not blocking.** When data does not match (e.g., calculated balance vs stated balance), the app informs the user but never restricts functionality.

4. **Colombian context as starting point.** Categories, financial products, locale, currency defaults, and UX patterns are designed for the Colombian user first, with potential for expansion.

5. **Progress over balance.** The app emphasizes whether the user is on track toward their financial goals, not just how much money they have right now.

6. **Minimum friction for daily use.** Every interaction should require the fewest possible steps. If something can be automated or pre-filled, it should be.
