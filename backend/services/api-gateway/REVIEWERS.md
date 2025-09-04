# API Gateway - Code Review Guidelines

## 🎯 **Service Overview**
**Critical Level: HIGH** - Central entry point, handles routing, security, and rate limiting

## 👥 **Mandatory Reviewers**

### **Primary Security Reviewer**
- **@security-architect** - Must review all gateway changes
- **Focus**: API security, routing, middleware security

### **Domain Experts**
- **@backend-architect** - Architecture and design patterns
- **@api-specialist** - API design and microservices communication

### **Secondary Reviewers**
- **@devops-engineer** - Infrastructure and deployment
- **@performance-engineer** - Load balancing and performance

## 🔐 **Security Checklist** (MANDATORY)

### **API Security**
- [ ] Authentication middleware validation
- [ ] Authorization checks on all routes
- [ ] CORS configuration security
- [ ] Helmet.js security headers
- [ ] API key validation and rotation
- [ ] Request/response encryption
- [ ] SQL injection prevention in queries

### **Rate Limiting & DDoS Protection**
- [ ] Rate limiting per user/IP
- [ ] Burst protection mechanisms
- [ ] Distributed rate limiting (Redis)
- [ ] Abuse detection and blocking
- [ ] Request throttling configuration

### **Input Validation**
- [ ] Request schema validation
- [ ] Content-Type validation
- [ ] Request size limits
- [ ] File upload security
- [ ] Path parameter validation

## 🧪 **Testing Requirements**

### **Security Testing**
- [ ] API fuzz testing
- [ ] Rate limiting stress tests
- [ ] Authentication bypass attempts
- [ ] Input validation edge cases

### **Performance Testing**
- [ ] Load testing with 1000+ RPS
- [ ] Memory leak testing
- [ ] Connection pooling validation
- [ ] Circuit breaker testing

## 🚨 **Blocking Criteria**

**APPROVAL BLOCKED IF:**
- Any High/Critical security vulnerabilities
- Missing authentication on protected routes
- Inadequate rate limiting
- Unvalidated request inputs
- Missing security headers
- Performance degradation > 10%

## 📊 **Performance Benchmarks**

- **Request Latency**: < 200ms (95th percentile)
- **Throughput**: 1000+ RPS sustained
- **Error Rate**: < 0.1% for healthy services
- **Memory Usage**: < 512MB under normal load
- **CPU Usage**: < 70% under peak load

## 🔧 **Deployment Checklist**

- [ ] Service discovery configuration
- [ ] Load balancer health checks
- [ ] Circuit breaker settings
- [ ] Monitoring dashboard updates
- [ ] Rollback procedures tested
- [ ] CDN configuration verified

---

**Note**: Gateway changes require coordination with all downstream services
