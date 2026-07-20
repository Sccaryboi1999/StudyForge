# Security Policy

StudyForge processes user-provided study material and may connect to OpenAI and Supabase. Security reports involving file processing, authentication, authorization, private study content, prompt injection, secret exposure, or cross-user access are especially important.

## Supported version

Security fixes are applied to the latest code on the repository's default branch. Older commits and private deployments may not receive fixes automatically.

## Reporting a vulnerability

Do not disclose a vulnerability in a public issue, discussion, pull request, screenshot, or log.

1. Use the repository's private vulnerability reporting option under the **Security** tab when it is available.
2. If private reporting is unavailable, contact the repository owner privately through GitHub before sharing technical details.
3. Include a concise description, affected route or component, reproduction steps, impact, and any proposed mitigation.
4. Remove real API keys, authentication tokens, account data, and private study content from the report.

Please allow time for validation and a coordinated fix before public disclosure.

## Security expectations

- Never commit `.env.local`, OpenAI keys, Supabase service-role keys, passwords, tokens, or session data.
- Keep provider credentials and privileged operations server-side.
- Treat uploaded files, extracted text, and AI responses as untrusted.
- Validate file size, file type, request schemas, output schemas, and resource ownership.
- Do not log full study documents or secrets.
- Preserve Supabase row-level security and user ownership checks.
- Sanitize rendered user content and avoid unsafe HTML injection.

## Deployment responsibility

Operators are responsible for:

- Keeping dependencies and the Node.js runtime updated
- Configuring production rate limiting and request-size limits
- Protecting environment variables in the hosting platform
- Configuring Supabase redirect URLs and authentication providers correctly
- Monitoring logs without retaining private study material
- Applying repository security fixes to deployed instances
