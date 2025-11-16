# Quick Start Guide

## Step 1: Create PostgreSQL Database

You have 3 options:

### Option A: Use pgAdmin (Easiest - GUI)
1. Open pgAdmin (usually installed with PostgreSQL)
2. Connect to your PostgreSQL server
3. Right-click on "Databases" → "Create" → "Database"
4. Name it: `quotation_maker`
5. Click "Save"

### Option B: Use PowerShell Script
```powershell
.\setup-database.ps1
```

### Option C: Manual SQL Command
If you have psql or pgAdmin:
```sql
CREATE DATABASE quotation_maker;
```

## Step 2: Install Dependencies

Run these commands in order:

```powershell
# Install backend dependencies
cd backend
npm install

# Install web dependencies
cd ..\web
npm install

# Install mobile dependencies (optional for now)
cd ..\mobile
npm install
```

## Step 3: Configure Environment

The `.env` file is already created in `backend/.env`. 

**IMPORTANT:** Update these values:
- `DB_PASSWORD` - Your PostgreSQL password
- `OPENAI_API_KEY` - Your OpenAI API key (optional, but needed for AI features)
- `SMTP_USER` and `SMTP_PASSWORD` - Your email credentials (optional, for email sending)

## Step 4: Start the Application

### Terminal 1 - Backend:
```powershell
cd backend
npm run dev
```

### Terminal 2 - Web Frontend:
```powershell
cd web
npm run dev
```

The web app will open at: http://localhost:3000

## Troubleshooting

### Database Connection Error
- Make sure PostgreSQL is running
- Check that the database `quotation_maker` exists
- Verify password in `backend/.env` matches your PostgreSQL password

### Port Already in Use
- Backend uses port 5000
- Web uses port 3000
- Change ports in `.env` and `vite.config.ts` if needed

### Missing Dependencies
- Delete `node_modules` folders
- Run `npm install` again

