# Quick Fix: Create Database

## ✅ PostgreSQL is Running!
Your PostgreSQL service is active. You just need to create the database.

## Easiest Solution: Use pgAdmin

1. **Open pgAdmin 4** from your Start Menu
   - Search for "pgAdmin" in Windows

2. **Connect to Server**
   - It will ask for your PostgreSQL password (the one you set during installation)
   - Enter it and connect

3. **Create Database**
   - In the left panel, right-click on "Databases"
   - Click "Create" → "Database..."
   - **Name:** `quotation_maker`
   - Click "Save"

**That's it!** The database is created. The app will create all tables automatically when you start it.

---

## Alternative: Update Password in .env

If you know your PostgreSQL password:

1. Open `backend/.env` file
2. Find this line:
   ```
   DB_PASSWORD=postgres
   ```
3. Replace `postgres` with your actual PostgreSQL password
4. Save the file

Then the app will connect automatically when you start it.

---

## Don't Know Your Password?

### Option 1: Reset PostgreSQL Password
1. Open pgAdmin
2. Right-click on your PostgreSQL server → "Properties"
3. Go to "Connection" tab
4. You can see or change the password there

### Option 2: Use Windows Authentication
If you installed PostgreSQL with Windows authentication, you might not need a password. Try updating `.env`:
```
DB_USER=your_windows_username
DB_PASSWORD=
```

---

## After Database is Created

Once the database exists, you can start the app:

**Terminal 1:**
```powershell
cd backend
npm run dev
```

**Terminal 2:**
```powershell
cd web
npm run dev
```

The backend will automatically create all necessary tables on first run!

