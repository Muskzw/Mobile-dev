# Database Setup Instructions

## The Issue
The `createdb` command is not available because PostgreSQL tools are not in your system PATH.

## Solution Options

### Option 1: Use pgAdmin (Recommended - Easiest)

1. **Open pgAdmin** (usually installed with PostgreSQL)
   - Look for it in Start Menu: "pgAdmin 4"

2. **Connect to PostgreSQL Server**
   - Enter your PostgreSQL password when prompted

3. **Create the Database**
   - Right-click on "Databases" in the left panel
   - Select "Create" → "Database..."
   - Name: `quotation_maker`
   - Click "Save"

### Option 2: Use SQL Command in pgAdmin

1. Open pgAdmin
2. Click on "Tools" → "Query Tool"
3. Paste this SQL:
   ```sql
   CREATE DATABASE quotation_maker;
   ```
4. Click the "Execute" button (or press F5)

### Option 3: Update .env with Correct Password

If you know your PostgreSQL password:

1. Open `backend/.env` file
2. Update this line with your actual PostgreSQL password:
   ```
   DB_PASSWORD=your_actual_postgres_password
   ```
3. Then run:
   ```powershell
   cd backend
   npm run create-db
   ```

### Option 4: Add PostgreSQL to PATH

1. Find your PostgreSQL installation (usually):
   - `C:\Program Files\PostgreSQL\15\bin` (or version number)
   - `C:\Program Files\PostgreSQL\16\bin`

2. Add to System PATH:
   - Press `Win + X` → "System"
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", find "Path" and click "Edit"
   - Click "New" and add: `C:\Program Files\PostgreSQL\15\bin` (adjust version)
   - Click OK on all dialogs
   - Restart PowerShell

3. Then you can use:
   ```powershell
   createdb quotation_maker
   ```

## Verify Database Creation

After creating the database, verify it exists:

**In pgAdmin:**
- You should see `quotation_maker` in the Databases list

**Or test connection:**
```powershell
cd backend
npm run dev
```

If the database exists and password is correct, the server will start and create all tables automatically.

## Common Issues

### "password authentication failed"
- Check your PostgreSQL password in `backend/.env`
- Make sure PostgreSQL service is running
- Try resetting PostgreSQL password if needed

### "Connection refused"
- Make sure PostgreSQL service is running
- Check if port 5432 is correct in `.env`
- Verify PostgreSQL is installed and running

### "Database does not exist"
- Create it using one of the options above
- The app will create tables automatically once database exists

