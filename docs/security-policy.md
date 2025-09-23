# Security Policy

- OAuth2/OIDC + JWT, short-lived tokens, refresh rotation.
- Encrypt in transit (TLS 1.2+) and at rest for sensitive fields.
- OWASP Top 10 mitigations, input validation, rate limiting.
- Secrets via environment/KeyVault, no secrets in repo.