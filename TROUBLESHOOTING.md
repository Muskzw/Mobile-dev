# Troubleshooting Guide

## Fixed Issues ✅

### TypeScript Compilation Error
**Error:** `Could not find a declaration file for module 'cors'`

**Fixed:** Installed missing type definitions:
```powershell
npm install --save-dev @types/cors
```

## Current Status

### ✅ Completed
- Backend dependencies installed
- Web dependencies installed  
- Missing TypeScript types installed
- PostgreSQL service is running

### ⚠️ Pending
- Database `quotation_maker` needs to be created
- Server may fail to start until database exists

## Next Steps

### 1. Create Database (REQUIRED)

**Option A: Using pgAdmin (Recommended)**
1. Open pgAdmin 4
2. Connect to PostgreSQL server
3. Right-click "Databases" → "Create" → "Database"
4. Name: `quotation_maker`
5. Click "Save"

**Option B: Using SQL**
In pgAdmin Query Tool, run:
```sql
CREATE DATABASE quotation_maker;
```

### 2. Update Database Password in .env

Open `backend/.env` and update:
```
DB_PASSWORD=your_actual_postgres_password
```

### 3. Start Backend Server

```powershell
cd backend
npm run dev
```

**Expected output:**
```
🚀 Server running on port 5000
Database initialized
```

### 4. Start Web Frontend (in new terminal)

```powershell
cd web
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
```

## Common Errors & Solutions

### Error: "password authentication failed"
**Solution:** Update `DB_PASSWORD` in `backend/.env` with your actual PostgreSQL password

### Error: "database does not exist"
**Solution:** Create the database using pgAdmin (see step 1 above)

### Error: "Connection refused" or "ECONNREFUSED"
**Solution:** 
- Verify PostgreSQL service is running: `Get-Service postgresql*`
- Check port 5432 is not blocked
- Verify `DB_HOST` and `DB_PORT` in `.env`

### Error: "Port 5000 already in use"
**Solution:**
- Change `PORT` in `backend/.env` to another port (e.g., 5001)
- Update `FRONTEND_URL` in `.env` if needed
- Update `vite.config.ts` proxy target if port changed

### Error: TypeScript compilation errors
**Solution:** Install missing type definitions:
```powershell
npm install --save-dev @types/[package-name]
```

## Verify Everything Works

1. **Backend Health Check:**
   ```powershell
   curl http://localhost:5000/api/health
   ```
   Should return: `{"status":"ok","message":"API is running"}`

2. **Web App:**
   - Open http://localhost:3000
   - Should see login page

3. **Database:**
   - Check pgAdmin - should see `quotation_maker` database
   - Should see tables created automatically (users, companies, etc.)

## Still Having Issues?

1. Check all error messages in terminal
2. Verify PostgreSQL is running
3. Check `.env` file has correct values
4. Make sure database `quotation_maker` exists
5. Check firewall isn't blocking ports 5000 or 3000

