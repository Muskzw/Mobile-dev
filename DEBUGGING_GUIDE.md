# 🐛 Debugging: 403 Error + Unknown Client + Logo Issues

## Current Issues

### 1. ❌ 403 Forbidden on PDF Download
```
LOG  Download response status: 403
```

### 2. ❌ Unknown Client Still Showing
Clients are still displayed as "Unknown Client"

### 3. ❌ Logo Shows White Space
Company logo section is blank

---

## What I've Done

### Fix 1:Added Extensive Logging to PDF Route
Added detailed logging to track:
- Document ID
- User ID  
- Company ID
- Document company_id
- Whether they match

### Fix 2: Fixed Backend Client Data Structure
Changed SQL query to return client as nested object

### Fix 3: Added Logo Display
Added Image component and logo display with fallback

### Fix 4: Fixed expo-file-system Deprecation
Changed to legacy import

---

## Next Steps to Debug

### **Option 1: Check Backend Logs**

I've started tailing the backend logs. Now:

1. **Try to download a PDF again** (click Share → any option)
2. **Look at your console** - copy the full PDF download logs
3. **I need to see the backend console** to check:
   - What User ID is being sent
   - What Company ID is being sent
   - What Document company_id is in database
   - Why they don't match

### **Option 2: Check Database Directly**

Let's verify the data in the database:

```bash
# Run this command:
docker-compose exec db psql -U invoice_user -d invoice_db -c "SELECT id, company_id FROM documents LIMIT 5;"
```

This will show us what company_id is stored in documents.

### **Option 3: Check Auth Token**

The issue might be that the token doesn't have the correct company_id. Let's verify:

```bash
# Check what companies exist:
docker-compose exec db psql -U invoice_user -d invoice_db -c "SELECT id, name, user_id FROM companies;"
```

---

## Theories

### Theory 1: Company ID Mismatch
- Documents were created with one company_id
- Auth token has a different company_id
- Backend rejects access (403)

**Fix**: We need to check which company the user has selected in the app

### Theory 2: Auth Middleware Issue  
- requireCompany middleware might not be setting `req.companyId` correctly
- This would cause all checks to fail

**Fix**: Check middleware implementation

### Theory 3: Multiple Companies
- User might have multiple companies
- Documents created under Company A
- Currently logged in as Company B

**Fix**: Need to switch to the correct company

---

## Immediate Actions Needed

**Please run these commands and share the output:**

### 1. Check Documents Table:
```bash
docker-compose exec db psql -U invoice_user -d invoice_db -c "SELECT id, document_number, company_id, client_id FROM documents ORDER BY created_at DESC LIMIT 5;"
```

### 2. Check Companies Table:
```bash
docker-compose exec db psql -U invoice_user -d invoice_db -c "SELECT id, name, user_id FROM companies;"
```

### 3. Check Clients Table:
```bash
docker-compose exec db psql -U invoice_user -d invoice_db -c "SELECT id, name, company_id FROM clients LIMIT 5;"
```

### 4. Try PDF Download Again
- Click Share on any document
- Copy ALL console logs (both mobile and backend if visible)
- Share them with me

---

## Quick Diagnostic

**In your mobile app, can you check:**

1. Open the app
2. Go to Profile/Settings (if there's a company selector)
3. **Which company is currently selected?**
4. **Do you have multiple companies?**

The issue might be that documents were created under one company but you're viewing as a different company.

---

## Files Modified for Debugging

- ✅ `backend/src/routes/documents.ts` - Added PDF download logging
- ✅ `DocumentViewScreen.tsx` - Fixed FileSystem, added logo
- ✅ Backend restarted

---

## What to Share

Please provide:

1. **Output of the 3 database commands above**
2. **Full console logs when attempting PDF download**
3. **Current company selected in app** (if visible in UI)
4. **Screenshot of "Unknown Client" issue** (helps me see the exact problem)

Once I have this info, I can pinpoint the exact issue! 🎯
