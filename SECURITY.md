# Security

## Public release rule

Super Drain's core browser workflow must not require committed credentials.

Do not commit:
- API keys
- passwords
- access tokens
- private service credentials
- private URLs that grant access
- local machine secrets

Optional integrations must be explicitly configured outside the repository.

## Reporting

If you discover a security issue, please report it privately through GitHub's security reporting facility when enabled for this repository. Do not publish credentials or working exploit details in a public issue.

If private reporting is not enabled, open a minimal public issue without including secrets and request a private contact path.