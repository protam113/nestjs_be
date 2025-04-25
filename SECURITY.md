# Security Policy

## Supported Versions

We provide security updates only for the versions listed below:

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | ✅ Supported        |
| 1.1.x   | ❌ Not Supported    |
| < 1.1   | ❌ Not Supported    |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly using the following methods:

- 📧 Email: security@yourdomain.com  
- 🔐 GitHub Security Advisories: [Submit here](https://github.com/your-org/your-repo/security/advisories)  
- 🛠 Private Discord channel (for core contributors/trusted devs only)

### What to Expect

1. **Initial response** within **72 hours** of your report.
2. If confirmed as a valid security issue:
   - We’ll open a private internal issue.
   - A patch will be released within **7 working days** (depending on severity).
   - Coordinated disclosure may be discussed if applicable.
3. If your report is rejected:
   - We will provide a clear explanation.
   - You may submit further evidence or request a re-evaluation.

### Responsible Disclosure Guidelines

To help us address the issue safely and responsibly:
- **Do not disclose** the vulnerability publicly until we’ve patched it or given the green light.
- **Do not test** exploits on production servers without explicit permission.
- **Be respectful and clear** when reporting—constructive reports are always appreciated.

## Scope

This security policy covers:
- NestJS backend API
- Authentication flows, WebSocket gateway
- File uploads and storage integration (e.g., AWS S3, OpenStack Swift)
- Redis, PostgreSQL, MongoDB, etc.

This policy does **not** cover:
- Frontend (e.g., Next.js)
- Static landing pages or marketing content

## Credits

Thanks to all contributors and security researchers who help us keep the system safe! 🙌

