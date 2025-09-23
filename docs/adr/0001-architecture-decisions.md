# ADR 0001: Core Architecture Decisions

- Stack: NestJS (Backend), Next.js (Frontend), PostgreSQL, Redis, RabbitMQ.
- Multi-tenancy: Shared DB with tenant_id + RLS where applicable.
- APIs: REST + GraphQL.
- Infra: Kubernetes, GitHub Actions, Observability stack.
- Rationale: balance between productivity, scalability, and cost.