# 🚀 Deployment Guide - Ready to Launch!

## 📋 **Pre-Deployment Checklist**

### ✅ Completed:
- [x] All features working
- [x] Database migrations run
- [x] Email service (Resend) integrated
- [x] Privacy Policy & Terms added
- [x] UI/UX polished for dark mode
- [x] PDF generator working
- [x] Password reset tested

---

## 🎯 **Deployment Plan**

We'll deploy in 3 stages:
1. **Backend** (API server)
2. **Mobile App** (iOS & Android)
3. **Testing & Launch**

---

## 1️⃣ **Backend Deployment** (Choose One)

### **Option A: Railway** (RECOMMENDED - Easiest!)

**Why Railway:**
- ✅ Free tier available
- ✅ Automatic deployments from Git
- ✅ PostgreSQL database included
- ✅ HTTPS by default
- ✅ 5-minute setup

**Steps:**
```bash
# 1. Sign up at https://railway.app/
# Use GitHub to sign up (instant access)

# 2. Install Railway CLI
npm install -g @railway/cli

# 3. Login
railway login

# 4. Initialize project
cd backend
railway init

# 5. Add PostgreSQL database
railway add --database postgres

# 6. Set environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -hex 32)
railway variables set RESEND_API_KEY=re_your_key_here
railway variables set EMAIL_FROM=onboarding@resend.dev

# 7. Deploy!
railway up

# 8. Run migrations
railway run psql -c "$(cat migrations/add_business_fields.sql)"
railway run psql -c "$(cat migrations/add_password_reset_fields.sql)"

# 9. Get your API URL
railway open
# Copy the URL (e.g., https://yourapp.up.railway.app)
```

---

### **Option B: Render** (Also Great!)

**Steps:**
```bash
# 1. Sign up at https://render.com/
# 2. Click "New +" → "Web Service"
# 3. Connect your GitHub repo
# 4. Configure:
   - Build Command: cd backend && npm install
   - Start Command: cd backend && npm start
   - Add PostgreSQL database
   - Add environment variables

# 5. Deploy!
```

---

### **Option C: Heroku** (Traditional)

```bash
# 1. Install Heroku CLI
npm install -g heroku

# 2. Login
heroku login

# 3. Create app
cd backend
heroku create your-app-name

# 4. Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# 5. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -hex 32)
heroku config:set RESEND_API_KEY=re_your_key
heroku config:set EMAIL_FROM=onboarding@resend.dev

# 6. Deploy
git push heroku main

# 7. Run migrations
heroku run bash
psql $DATABASE_URL < migrations/add_business_fields.sql
psql $DATABASE_URL < migrations/add_password_reset_fields.sql
```

---

## 2️⃣ **Mobile App Deployment**

### **For iOS (TestFlight)**

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo
cd mobile
eas login

# 3. Configure EAS
eas build:configure

# 4. Update app.json
# Set your app name, version, bundle identifier

# 5. Update API URL
# Edit mobile/src/api/client.ts
# Change baseURL to your production API URL

# 6. Build for iOS
eas build --platform ios

# 7. Submit to TestFlight
eas submit --platform ios

# You'll need:
# - Apple Developer Account ($99/year)
# - App Store Connect setup
```

---

### **For Android (Google Play Internal Testing)**

```bash
# 1. Build APK/AAB
eas build --platform android

# 2. Download the AAB file

# 3. Go to Google Play Console
# https://play.google.com/console

# 4. Create new app

# 5. Upload to Internal Testing

# 6. Invite testers
# Add email addresses for beta testing
```

---

## 3️⃣ **Update Mobile App Config**

Before building, update the API URL

:

**File:** `mobile/src/api/client.ts`

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// PRODUCTION API URL (update this!)
const BASE_URL = 'https://your-app.up.railway.app/api';
// Or: 'https://your-app.onrender.com/api'
// Or: 'https://your-app.herokuapp.com/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ... rest of the file
```

---

## 🔒 **Production Environment Variables**

### **Backend (.env):**
```env
# Server
NODE_ENV=production
PORT=5000

# Database (will be set by hosting provider)
DATABASE_URL=postgresql://...

# Security
JWT_SECRET=your_super_secret_key_minimum_32_characters
JWT_EXPIRE=7d

# Email
RESEND_API_KEY=re_your_actual_key
EMAIL_FROM=noreply@yourapp.com

# Optional
OPENAI_API_KEY=sk-... # If using AI features
```

---

## 📱 **App Store Information You'll Need**

### **iOS (App Store Connect)**
```
App Name: Quotation Maker (or your chosen name)
Primary Language: English
Bundle ID: com.yourcompany.quotationmaker
SKU: quotationmaker001
Category: Business
Age Rating: 4+

Description:
Create professional invoices and quotations on the go. 
Perfect for freelancers, small businesses, and entrepreneurs.

Features:
• Create unlimited invoices & quotations
• Professional PDF templates
• Client & product management
• Dark mode support
• Secure cloud sync
• Email invoices directly to clients

Keywords:
invoice, quotation, billing, business, freelance, pdf, receipt
```

### **Android (Google Play Console)**
```
Same as above +
Content Rating: Everyone
Privacy Policy URL: https://yourapp.com/privacy
App APK/AAB file
Screenshots (at least 2)
Feature graphic (1024 x 500)
App icon (512 x 512)
```

---

## 📸 **Screenshots Needed**

Take screenshots of these screens:
1. Dashboard
2. Document Creation
3. PDF Preview
4. Client Management
5. Dark Mode View

**Size Requirements:**
- iOS: 1242 x 2688 (iPhone 13 Pro Max)
- Android: 1080 x 1920 or higher

---

## 🧪 **Testing Before Launch**

### **1. Test on TestFlight/Internal Testing:**
```
Invite 5-10 beta testers
Test these flows:
- [ ] Registration
- [ ] Login
- [ ] Password reset
- [ ] Create invoice
- [ ] Download PDF
- [ ] Email invoice
- [ ] Edit client
- [ ] Dark mode switch
- [ ] All CRUD operations
```

### **2. Load Testing:**
```bash
# Install artillery
npm install -g artillery

# Create test.yml
artillery quick --count 10 --num 50 https://your-api.com/health

# Should handle at least 50 concurrent users
```

---

## 🚨 **Important: Must Do Before Launch**

### **1. Security:**
```bash
# Generate strong JWT secret
openssl rand -hex 32

# Update in production .env
# NEVER use the default dev secret!
```

### **2. Database Backups:**
```bash
# Railway: Automatic backups included
# Heroku: 
heroku pg:backups:schedule DATABASE_URL --at '02:00 America/Los_Angeles'

# Render: Enable in dashboard
```

### **3. Monitoring:**
```bash
# Sign up for Sentry (free tier)
https://sentry.io/

# Add to backend:
npm install @sentry/node

# Initialize in server.ts
```

---

## 📊 **Post-Deployment Checklist**

### **Day 1:**
- [ ] Verify backend is accessible
- [ ] Test all API endpoints
- [ ] Check database connections
- [ ] Test email sending
- [ ] Monitor error logs

### **Week 1:**
- [ ] Collect beta tester feedback
- [ ] Fix critical bugs
- [ ] Monitor server performance
- [ ] Check database size

### **Before Public Launch:**
- [ ] App store review submitted
- [ ] Marketing materials ready
- [ ] Support email set up
- [ ] Privacy policy published
- [ ] Terms of service published

---

## 🎯 **Quick Deploy Summary**

### **Fastest Path to Production:**

```bash
# 1. Backend (Railway - 5 min)
railway login
cd backend && railway init
railway add --database postgres
railway up
# Copy API URL

# 2. Mobile App (10 min)
cd mobile
# Update API URL in src/api/client.ts
eas build --platform android
# Download APK and test

# 3. Submit to Stores (varies)
eas submit --platform android
eas submit --platform ios
```

---

## 💰 **Cost Estimate**

### **Monthly Costs:**
```
Backend (Railway Free Tier): $0
OR
Backend (Railway Pro): $5/month
Database: Included
Resend Email: $0 (3,000 emails/month)

Apple Developer: $99/year ($8.25/month)
Google Play: $25 one-time

Total: ~$8-15/month
```

---

## 🆘 **Need Help?**

### **Common Issues:**

**Backend won't start:**
```bash
# Check logs
railway logs

# Check environment variables
railway variables

# Verify database connection
railway run node -e "console.log(process.env.DATABASE_URL)"
```

**Mobile app can't connect:**
```bash
# Check API URL in mobile/src/api/client.ts
# Make sure it ends with /api
# Test API in browser: https://your-api.com/health
```

**Build fails:**
```bash
# Clear cache
eas build:clear-cache

# Update dependencies
npm update

# Try again
eas build --platform android --clear-cache
```

---

## ✅ **You're Ready to Deploy!**

Choose your deployment method:
- **Recommended**: Railway (backend) + EAS (mobile)
- **Alternative**: Render (backend) + EAS (mobile)
- **Traditional**: Heroku (backend) + EAS (mobile)

**Estimated Time to Production:**
- Backend: 10-15 minutes
- Mobile Build: 15-20 minutes
- Store Approval: 1-3 days (iOS), 1-7 days (Android)

Let me know which option you want to proceed with! 🚀
