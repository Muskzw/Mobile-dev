# Database Setup Script for Windows
# This script helps create the PostgreSQL database

Write-Host "=== PostgreSQL Database Setup ===" -ForegroundColor Cyan
Write-Host ""

# Try to find PostgreSQL installation
$pgPaths = @(
    "C:\Program Files\PostgreSQL\*\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe",
    "$env:ProgramFiles\PostgreSQL\*\bin\psql.exe",
    "$env:ProgramFiles(x86)\PostgreSQL\*\bin\psql.exe"
)

$psqlPath = $null
foreach ($path in $pgPaths) {
    $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $psqlPath = $found.FullName
        Write-Host "Found PostgreSQL at: $psqlPath" -ForegroundColor Green
        break
    }
}

if (-not $psqlPath) {
    Write-Host "PostgreSQL not found in common locations." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please choose one of these options:" -ForegroundColor Cyan
    Write-Host "1. Install PostgreSQL from https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "2. Use pgAdmin (GUI tool) to create database 'quotation_maker'" -ForegroundColor White
    Write-Host "3. If PostgreSQL is installed, add it to PATH:" -ForegroundColor White
    Write-Host "   - Find your PostgreSQL bin folder (usually C:\Program Files\PostgreSQL\XX\bin)" -ForegroundColor Gray
    Write-Host "   - Add it to System Environment Variables PATH" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or run this SQL command in pgAdmin or psql:" -ForegroundColor Yellow
    Write-Host "CREATE DATABASE quotation_maker;" -ForegroundColor White
    exit
}

# Get database credentials
Write-Host ""
$dbUser = Read-Host "Enter PostgreSQL username (default: postgres)"
if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "postgres" }

$dbPassword = Read-Host "Enter PostgreSQL password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

# Set environment variables for psql
$env:PGPASSWORD = $dbPasswordPlain
$env:PGUSER = $dbUser

# Try to create database
Write-Host ""
Write-Host "Creating database 'quotation_maker'..." -ForegroundColor Cyan

$createDbCommand = "CREATE DATABASE quotation_maker;"
$result = & $psqlPath -U $dbUser -h localhost -p 5432 -d postgres -c $createDbCommand 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database 'quotation_maker' created successfully!" -ForegroundColor Green
} else {
    if ($result -match "already exists") {
        Write-Host "Database 'quotation_maker' already exists." -ForegroundColor Yellow
    } else {
        Write-Host "Error creating database:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        Write-Host ""
        Write-Host "You can manually create it using:" -ForegroundColor Yellow
        Write-Host "  psql -U $dbUser -c `"CREATE DATABASE quotation_maker;`"" -ForegroundColor White
    }
}

# Clean up
$env:PGPASSWORD = $null
$env:PGUSER = $null

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan

