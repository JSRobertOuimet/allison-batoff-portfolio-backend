# Security Configuration Guide

## Overview

This document outlines the security enhancements implemented in the Allison Batoff Portfolio application and provides configuration guidance.

## Security Features Implemented

### 1. Enhanced Authentication

- **Session-based authentication** with secure tokens
- **Rate limiting** on login attempts (5 attempts per 15 minutes)
- **Password validation** with minimum requirements
- **Session management** with expiration and inactivity timeouts
- **Secure cookie configuration** with proper flags

### 2. Security Headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` (HTTPS only)
- `Permissions-Policy` restrictions

### 3. Input Validation & Sanitization

- Automatic sanitization of request bodies and query parameters
- XSS protection through character filtering
- Event handler removal
- JavaScript protocol filtering

### 4. Rate Limiting

- Global rate limiting (100 requests per 15 minutes per IP)
- Login-specific rate limiting (5 attempts per 15 minutes)
- Automatic cleanup of expired rate limit entries

### 5. CORS Configuration

- Environment-specific origin restrictions
- Proper method and header configuration
- Development vs production settings

## Environment Variables Required

Create a `.env` file in the backend root with the following variables:

```env
# Application Keys (generate 4 random 32-byte base64 strings)
APP_KEYS=key1,key2,key3,key4

# Database Configuration
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=allison_portfolio
DATABASE_USERNAME=your_db_user
DATABASE_PASSWORD=your_secure_db_password

# Security
SECRET_PASSWORD=your_very_secure_password_here

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development

# Server Configuration
HOST=0.0.0.0
PORT=1337
```

## Security Best Practices

### Password Requirements

- Minimum 8 characters
- Avoid common passwords (password, 123456, admin, etc.)
- Use a mix of letters, numbers, and symbols
- Consider using a password manager

### Production Deployment

1. **Use HTTPS**: Always use HTTPS in production
2. **Environment Variables**: Never commit `.env` files
3. **Database Security**: Use strong database passwords
4. **Regular Updates**: Keep dependencies updated
5. **Monitoring**: Implement logging and monitoring
6. **Backup**: Regular database backups

### Additional Recommendations

#### For Production

1. **Use Redis** for session storage instead of in-memory storage
2. **Implement CSRF tokens** for additional protection
3. **Add request logging** and monitoring
4. **Use a reverse proxy** (nginx) with additional security headers
5. **Implement database connection pooling**
6. **Add health check endpoints**

#### Database Security

1. Use strong, unique passwords
2. Limit database user permissions
3. Enable SSL connections
4. Regular security updates

#### Server Security

1. Keep the OS updated
2. Use a firewall
3. Disable unnecessary services
4. Regular security audits

## Session Management

The application now uses secure session tokens instead of simple boolean cookies:

- **Token Generation**: Cryptographically secure random tokens
- **Session Duration**: 24 hours maximum
- **Inactivity Timeout**: 2 hours of inactivity
- **Secure Storage**: HTTP-only cookies with proper flags
- **Automatic Cleanup**: Expired sessions are automatically removed

## Rate Limiting

Two levels of rate limiting are implemented:

1. **Global Rate Limiting**: 100 requests per 15 minutes per IP
2. **Login Rate Limiting**: 5 login attempts per 15 minutes per IP

## Monitoring & Logging

Consider implementing:

- Request logging
- Error tracking (Sentry)
- Performance monitoring
- Security event logging

## Testing Security

1. **Penetration Testing**: Regular security assessments
2. **Dependency Scanning**: Check for vulnerable packages
3. **Code Review**: Regular security-focused code reviews
4. **Automated Testing**: Security-focused test suites

## Incident Response

1. **Monitoring**: Set up alerts for suspicious activity
2. **Logging**: Comprehensive logging for forensic analysis
3. **Backup**: Regular backups for recovery
4. **Documentation**: Keep security procedures documented

## Updates

This security configuration should be reviewed and updated regularly as new threats emerge and best practices evolve.
