# ADR 0003: Authentication (OIDC + JWT)

## Context
- External identity providers and first-party auth.

## Decision
- Support OIDC (Auth0/Azure AD/Keycloak) where available.
- Issue short-lived access JWT (515m) and refresh tokens with rotation.
- Embed 	enant_id, sub, oles in JWT claims; validate on each request.

## Consequences
- Standard-based SSO compatible.
- Minimal session state in server.

## Security
- Use JWKs for signature verification.
- Refresh token rotation with reuse detection.
- MFA for privileged roles.