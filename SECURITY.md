# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of LLM Token Calculator seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **GitHub Security Advisories**: Use the "Report a vulnerability" button in the Security tab of this repository
2. **Email**: Contact the maintainers directly through GitHub

### What to Include

Please include the following information in your report:

- Type of issue (e.g., XSS, data exposure, dependency vulnerability)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Updates**: We will keep you informed of our progress toward fixing the vulnerability
- **Timeline**: We aim to address critical vulnerabilities within 7 days
- **Credit**: We will credit you in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices

### For Users

1. **Keep dependencies updated**: Run `pnpm update` regularly
2. **Use environment variables**: Never commit API keys or secrets
3. **Review third-party integrations**: Be cautious with external data sources

### For Contributors

1. **Never commit secrets**: Use environment variables for sensitive data
2. **Validate inputs**: Always sanitize user inputs
3. **Use secure dependencies**: Check for known vulnerabilities before adding new packages
4. **Follow least privilege**: Request only necessary permissions

## Known Security Considerations

### Data Privacy

- This application processes user-provided text to count tokens
- Text is processed client-side when possible
- No user data is stored or transmitted to external servers (except for model pricing API calls)

### External API Calls

- Model pricing data is fetched from trusted sources (LiteLLM GitHub repository)
- API responses are validated before use
- Failed API calls fall back to bundled data

### Third-Party Dependencies

We regularly audit our dependencies using:
- `pnpm audit`
- GitHub Dependabot alerts
- Snyk vulnerability scanning

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find any similar problems
3. Prepare fixes for all supported versions
4. Release patches as soon as possible

## Comments on this Policy

If you have suggestions on how this process could be improved, please submit a pull request or open an issue.
