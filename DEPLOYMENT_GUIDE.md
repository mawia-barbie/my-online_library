# Deployment & Production Checklist

## Pre-Deployment Testing

### Environment Setup

- [ ] Backend running on `http://127.0.0.1:8000`
- [ ] Frontend running on `http://localhost:5173` (or configured port)
- [ ] Database connected and migrations applied
- [ ] Environment variables configured

### Core Functionality Testing

#### Guest Mode

- [ ] Can access `/` without errors
- [ ] Books load in grid format
- [ ] Can scroll through books
- [ ] Cannot see "Add Book" button
- [ ] Clicking books/interactions shows auth prompt
- [ ] "Log in" and "Get Started" buttons visible

#### Authentication

- [ ] Registration form works
- [ ] Login form works
- [ ] Invalid credentials show error
- [ ] Valid credentials auto-redirect to `/feed`
- [ ] Token saved to localStorage

#### Authenticated Mode

- [ ] `/feed` displays books
- [ ] "Add Book" button visible and clickable
- [ ] Can add new book successfully
- [ ] Book appears in feed immediately
- [ ] User info visible in navbar
- [ ] "Logout" button visible

#### Session Persistence

- [ ] Login and refresh page → Still logged in
- [ ] Token present in localStorage
- [ ] Token removed on logout
- [ ] Cannot access `/feed` without token (redirects to login)

#### Navigation

- [ ] All links work correctly
- [ ] Profile links work
- [ ] Logo redirects to home
- [ ] Back button works

### Debug Logging

- [ ] Open DevTools console
- [ ] Auth flow logs visible (🚀, ✅, ❌, etc.)
- [ ] No JavaScript errors
- [ ] Network tab shows API calls correctly

### Error Handling

- [ ] Backend down → Graceful error message
- [ ] Invalid token → Redirect to login
- [ ] Missing required fields → Show validation error
- [ ] Network error → Retry or error message

---

## Production Deployment Steps

### 1. Backend Configuration

```bash
# Create .env file
ENVIRONMENT=production
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@host:5432/bookapp
CORS_ORIGINS=["https://yourdomain.com"]
```

**Security Checklist:**

- [ ] Never hardcode secrets
- [ ] Use environment variables
- [ ] Enable HTTPS only
- [ ] Set CORS to specific domains
- [ ] Add rate limiting
- [ ] Enable CSRF protection

### 2. Frontend Configuration

```javascript
// .env.production
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=Book Exchange
```

**Changes needed:**

- [ ] Replace `http://127.0.0.1:8000` with `https://api.yourdomain.com`
- [ ] Update all API calls to use env variable
- [ ] Set secure cookie flags if using cookies instead of localStorage

### 3. Build Process

```bash
# Build frontend
cd bookapp
npm run build

# Verify build
npm run preview

# Output should be in dist/
```

**Build Checklist:**

- [ ] No build errors
- [ ] No warnings
- [ ] `dist/` folder created
- [ ] index.html present in dist/
- [ ] All assets bundled

### 4. Deployment to Server

#### Option A: Traditional Server (Apache/Nginx)

```nginx
# nginx.conf example
server {
  listen 443 ssl;
  server_name yourdomain.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  # Frontend
  location / {
    root /var/www/bookapp/dist;
    try_files $uri $uri/ /index.html;
  }

  # Backend proxy
  location /api {
    proxy_pass http://backend:8000;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

#### Option B: Docker

```dockerfile
# Dockerfile
FROM node:18 AS build
WORKDIR /app
COPY bookapp .
RUN npm install && npm run build

FROM node:18
WORKDIR /app
COPY --from=build /app/dist ./dist
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

#### Option C: Cloud Platform (Vercel, Netlify, etc.)

- [ ] Connect GitHub repo
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `dist`
- [ ] Set environment variables
- [ ] Deploy preview

### 5. SSL/TLS Configuration

```bash
# Generate certificates with Let's Encrypt
certbot certonly --standalone -d yourdomain.com

# Or if behind reverse proxy
certbot certonly --webroot -d yourdomain.com
```

**Security Checklist:**

- [ ] HTTPS enabled
- [ ] SSL certificate valid and not expired
- [ ] Certificate auto-renewal configured
- [ ] Redirect HTTP → HTTPS

### 6. Database Migration

```bash
# Backup existing database
pg_dump -U user -d bookapp > backup.sql

# Run migrations
alembic upgrade head

# Verify tables created
psql -U user -d bookapp -c "\dt"
```

### 7. Environment Variables

**Backend (.env)**

```
ENVIRONMENT=production
SECRET_KEY=generate-with-secrets.token_urlsafe(32)
DATABASE_URL=postgresql://user:pass@host:5432/bookapp
CORS_ORIGINS=["https://yourdomain.com"]
EMAIL_FROM=noreply@yourdomain.com
SMTP_PASSWORD=your-app-password
```

**Frontend (.env.production)**

```
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=Book Exchange
```

---

## Post-Deployment Verification

### API Endpoints

```bash
# Test backend health
curl -X GET https://api.yourdomain.com/health

# Test registration
curl -X POST https://api.yourdomain.com/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password","nickname":"Test"}'

# Test login
curl -X POST https://api.yourdomain.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test authenticated endpoint
curl -X GET https://api.yourdomain.com/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### Frontend Checks

- [ ] Load `https://yourdomain.com` → No console errors
- [ ] Guest flow works → Can see books
- [ ] Registration works → Token created
- [ ] Authenticated flow works → Can add book
- [ ] Session persists → Refresh page, still logged in

### Performance Monitoring

- [ ] Page load time < 3 seconds
- [ ] First Contentful Paint (FCP) < 1.8s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] API response times < 500ms

### Security Headers

```bash
# Test security headers
curl -I https://yourdomain.com

# Should include:
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Content-Security-Policy: ...
```

---

## Monitoring & Maintenance

### Error Logging

- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure alerts for 5xx errors
- [ ] Monitor 4xx error rates

### Performance Monitoring

- [ ] Track API response times
- [ ] Monitor database query performance
- [ ] Set up database backups (daily)
- [ ] Monitor storage usage

### Health Checks

```bash
# Add to cron (check every 5 minutes)
*/5 * * * * curl -f https://yourdomain.com/health || alert_team

# Add to monitoring service
- URL: https://yourdomain.com
- Expected status: 200
- Alert on: timeout or 5xx
```

### Log Rotation

```bash
# Configure logrotate for backend logs
/var/log/bookapp/*.log {
  daily
  rotate 14
  compress
  delaycompress
  notifempty
  create 0640 www-data www-data
  sharedscripts
  postrotate
    systemctl reload bookapp
  endscript
}
```

---

## Scaling Considerations

### When to Scale

| Metric                     | Action                       |
| -------------------------- | ---------------------------- |
| > 100 concurrent users     | Add load balancer            |
| > 50% CPU usage            | Increase instance size       |
| > 80% database connections | Add connection pooling       |
| > 100ms API response       | Optimize queries/add caching |

### Scaling Architecture

```
┌─────────────────────────────────────┐
│      Load Balancer (nginx)          │
│           (or HAProxy)              │
├─────────────┬───────────────────────┤
│             │                       │
▼             ▼                       ▼
Backend 1  Backend 2              Backend N
(8000)     (8000)                (8000)
│             │                       │
└─────────────┼───────────────────────┘
              │
              ▼
      ┌──────────────────┐
      │  Read Replica    │
      │  Database        │
      └──────────────────┘
              │
              ▼
      ┌──────────────────┐
      │  Primary DB      │
      │  (Replication)   │
      └──────────────────┘
              │
              ▼
      ┌──────────────────┐
      │  Redis Cache     │
      │  (Sessions)      │
      └──────────────────┘
              │
              ▼
      ┌──────────────────┐
      │  CDN             │
      │  (Static assets) │
      └──────────────────┘
```

---

## Rollback Procedure

If deployment has issues:

```bash
# 1. Identify issue
kubectl logs -f deployment/bookapp-frontend

# 2. Revert to previous version
git revert HEAD~1
npm run build

# 3. Redeploy
kubectl apply -f deployment.yaml

# 4. Verify
kubectl rollout status deployment/bookapp-frontend

# 5. Document what went wrong
# Add to incident log and post-mortem
```

---

## Maintenance Schedule

### Daily

- [ ] Check error logs
- [ ] Monitor uptime
- [ ] Review critical alerts

### Weekly

- [ ] Review performance metrics
- [ ] Check for security updates
- [ ] Test backup restoration

### Monthly

- [ ] Update dependencies
- [ ] Review and optimize slow queries
- [ ] Security audit
- [ ] Capacity planning review

### Quarterly

- [ ] Load testing
- [ ] Disaster recovery drill
- [ ] Security penetration testing
- [ ] Major version updates

---

## Success Metrics

After deployment, track:

| Metric             | Target              |
| ------------------ | ------------------- |
| Uptime             | > 99.5%             |
| Page Load          | < 3s                |
| API Response       | < 500ms             |
| Error Rate         | < 0.1%              |
| User Growth        | > 10% MoM           |
| Registration Rate  | > 5% of visitors    |
| Daily Active Users | > 10% of registered |

---

## Support & Documentation

- [ ] Create user documentation
- [ ] Set up support email/ticketing
- [ ] Create admin dashboard/tools
- [ ] Write runbooks for common issues
- [ ] Set up status page (statuspage.io)

---

## Final Checklist Before Going Live

- [ ] All tests passing (frontend & backend)
- [ ] Security audit completed
- [ ] Performance optimized
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Team trained on deployment process
- [ ] Rollback procedure documented
- [ ] Support team ready
- [ ] DNS configured
- [ ] SSL certificate installed
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Error tracking set up
- [ ] Database backups automated
- [ ] Team on-call schedule created

---

**Ready to deploy! 🚀**
