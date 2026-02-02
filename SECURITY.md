# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Vulnerabilities

### Fixed Vulnerabilities

#### Happy DOM VM Context Escape (CVE-2024-52809)
- **Severity**: Critical
- **Affected Versions**: happy-dom < 20.0.0
- **Fixed In**: v0.1.0 (upgraded to happy-dom 20.4.0)
- **Impact**: Development/testing only (not production)
- **Status**: ✅ Fixed

### Known Development Dependencies Issues

The following moderate severity vulnerabilities exist in development dependencies (vitest ecosystem):

- **esbuild <=0.24.2**: GHSA-67mh-4wv8-2f99
  - Affects development server only
  - Does not affect production builds
  - Will be resolved when vitest upgrades to esbuild > 0.24.2

These vulnerabilities:
- Only affect the development environment
- Do not impact production builds or runtime
- Are being tracked and will be updated when patched versions are available

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by:

1. **DO NOT** create a public GitHub issue
2. Email the maintainers with details
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and provide updates on the resolution timeline.

## Security Best Practices

When using this application:

1. **Bring Your Own Backend (BYOB)**: Configure your own Firestore instance
2. **Secure Your Firestore**: Set appropriate security rules
3. **Data Encryption**: Consider encrypting sensitive fields in local storage
4. **Keep Dependencies Updated**: Regularly update to the latest version
5. **Review Code**: Audit the codebase before deploying

## Production Security

For production deployments:
- All production dependencies are free from known high/critical vulnerabilities
- Static site generation eliminates server-side attack vectors
- IndexDB is domain-scoped and protected by same-origin policy
- No sensitive data should be stored without encryption

Last Updated: 2026-02-02
