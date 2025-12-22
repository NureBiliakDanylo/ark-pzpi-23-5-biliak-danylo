$dbHost = "localhost"
$dbPort = 5432
$dbUser = "postgres"
$dbPassword = "admin"
$dbName = "weather"

# 1. Check for Prerequisites
Write-Host "Checking for prerequisites..."

# Check for Node.js
$nodeExists = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeExists) {
    Write-Host "Node.js is not found. Please install it and re-run the script." -ForegroundColor Red
    exit 1
} else {
    Write-Host "Node.js found: $((node -v).Trim())" -ForegroundColor Green
}

# 2. Welcome and Instructions
Write-Host "--- Starting Deployment for ark-lab2 Server ---" -ForegroundColor Cyan
Write-Host "This script will:"
Write-Host "1. Create the .env file with your database configuration."
Write-Host "2. Install npm dependencies."
Write-Host "3. Initialize the PostgreSQL database."
Write-Host "4. Start the application server."
Write-Host ""
Write-Host "IMPORTANT: Make sure you have PostgreSQL installed and running." -ForegroundColor Yellow
Write-Host "The script is configured to use the following default database connection:"
Write-Host "User: $dbUser"
Write-Host "Database: $dbName"
Write-Host "Host: $dbHost"
Write-Host "Port: $dbPort"
$useDefaults = Read-Host -Prompt "Do you want to use these settings? (y/n)"

if ($useDefaults -eq 'n') {
    Write-Host "Please provide your PostgreSQL connection details:"
    $dbHost = Read-Host -Prompt "Host"
    $dbPort = Read-Host -Prompt "Port"
    $dbUser = Read-Host -Prompt "User"
    $dbPassword = Read-Host -Prompt "Password"
    $dbName = Read-Host -Prompt "Database Name"
}

# 3. Create .env file
Write-Host "Creating .env file..."
$databaseUrl = "postgresql://$($dbUser):$($dbPassword)@$($dbHost):$($dbPort)/$($dbName)"
Set-Content -Path ".env" -Value "DATABASE_URL=$databaseUrl"
Write-Host ".env file created successfully." -ForegroundColor Green

# 4. Install Dependencies
Write-Host "Installing npm dependencies... (This may take a moment)"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing npm dependencies. Please check the output above." -ForegroundColor Red
    exit 1
}
Write-Host "npm dependencies installed successfully." -ForegroundColor Green

# 5. Initialize Database
Write-Host "Initializing database..."
node ./init-db.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error initializing the database. Please check your database connection details in the .env file and ensure the PostgreSQL server is running." -ForegroundColor Red
    exit 1
}
Write-Host "Database initialized successfully." -ForegroundColor Green

# 6. Start Application
Write-Host "Starting the application server..."
Write-Host "You can stop the server by pressing CTRL+C."
npm start