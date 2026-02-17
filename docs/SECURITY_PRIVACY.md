# Rumbo - Security and Privacy

## Principles

- Data minimization: only collect what is required for core functionality.
- Least privilege: users and services get the minimum access needed.
- Secure by default: encryption in transit, sane defaults, and safe fallbacks.

## Data Classification

- **PII**: email, name, and any user-provided identifiers.
- **Financial data**: account balances, transactions, budgets, and goals.
- **Files**: bank statements and receipts (sensitive by default).

## Authentication and Sessions

- Authentication is handled by Better Auth with secure session management.
- Passwords (if used) must be hashed with a strong adaptive algorithm.
- MFA is a future enhancement, not required for MVP.

## Authorization and Multi-Tenancy

- Every record is scoped by `user_id`.
- All queries and mutations must enforce tenant isolation.
- No cross-user access paths or shared data by default.

## Encryption

- **In transit**: TLS for all client-server and service-to-service traffic.
- **At rest**: rely on managed database encryption and object storage encryption.

## Secrets Management

- Secrets are stored in environment variables and never committed to the repo.
- Rotate provider keys regularly and on any suspected exposure.

## Logging and Monitoring

- Avoid logging raw PII or full financial details.
- Use structured logs with redaction of sensitive fields.
- Maintain audit logs for critical actions (login, password changes, data exports).

## File Uploads

- Validate file type and size on upload.
- Store original files in R2 and restrict access to the owner only.
- Virus scanning is recommended when it becomes operationally feasible.

## Backups and Recovery

- Enable automated backups for PostgreSQL.
- Define a recovery process and test it periodically.

## User Data Controls

- Provide data export in a portable format.
- Provide account deletion with full data removal where possible.

## Privacy and Compliance

- Follow Colombian data protection requirements and industry best practices.
- Disclose data usage, retention, and third-party processors in a clear privacy policy.
