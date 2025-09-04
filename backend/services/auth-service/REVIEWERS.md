# Auth Service - Code Review Guidelines

## 🎯 **Service Overview**
**Critical Level: HIGH** - Handles user authentication, authorization, and security

## 👥 **Mandatory Reviewers**

### **Primary Security Reviewer**
- **@security-architect** - Must review all auth-related changes
- **Focus**: Security vulnerabilities, compliance, authentication flows

### **Domain Experts**
- **@backend-architect** - Architecture and design patterns
- **@identity-specialist** - Authentication protocols and standards

### **Secondary Reviewers**
- **@devops-engineer** - Infrastructure and deployment
- **@qa-engineer** - Test coverage and quality

## 🔐 **Security Checklist** (MANDATORY)

### **Authentication & Authorization**
- [ ] JWT token validation and refresh logic
- [ ] Password hashing with bcrypt/argon2
- [ ] Rate limiting on login endpoints
- [ ] Session management and timeout
- [ ] Multi-factor authentication flow
- [ ] OAuth/OIDC integration security
- [ ] Role-based access control (RBAC)
- [ ] Permission validation on all endpoints

### **Data Protection**
- [ ] PII data encryption at rest
- [ ] Secure password reset tokens
- [ ] Audit logging for sensitive operations
- [ ] GDPR compliance for user data
- [ ] Data retention policies
- [ ] Secure deletion of user data

### **Input Validation & Sanitization**
- [ ] SQL injection prevention
- [ ] XSS protection in all inputs
- [ ] Input length and format validation
- [ ] Email format validation
- [ ] Phone number validation
- [ ] Strong password requirements

## 🧪 **Testing Requirements**

### **Security Testing**
- [ ] Penetration testing for auth endpoints
- [ ] Fuzz testing for input validation
- [ ] Race condition testing for concurrent logins
- [ ] Session fixation attack prevention

### **Functional Testing**
- [ ] Unit tests for all auth logic (>90% coverage)
- [ ] Integration tests for auth flows
- [ ] E2E tests for complete user journeys
- [ ] Load testing for auth endpoints

## 🚨 **Blocking Criteria**

**APPROVAL BLOCKED IF:**
- Any High/Critical security vulnerabilities
- Test coverage below 90%
- Missing audit logging
- Insecure password handling
- Unvalidated user inputs
- Missing rate limiting
- Non-compliant data handling

## 📊 **Performance Benchmarks**

- **Login Response Time**: < 500ms (95th percentile)
- **Token Validation**: < 100ms
- **Concurrent Users**: Support 10,000+ active sessions
- **Failed Login Rate**: Monitor and alert > 5% failure rate

## 🔧 **Deployment Checklist**

- [ ] Database migrations tested
- [ ] Redis cache configuration verified
- [ ] Environment variables secured
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented
- [ ] Incident response procedures updated

---

**Note**: All changes to auth-service require explicit approval from @security-architect
