# 1. Check for Prerequisites
Write-Host "Checking for PlatformIO Core (CLI)..."

$pioExists = Get-Command pio -ErrorAction SilentlyContinue
if (-not $pioExists) {
    Write-Host "Error: 'pio' command not found." -ForegroundColor Red
    Write-Host "PlatformIO Core (CLI) is required to deploy to a physical IoT device." -ForegroundColor Red
    Write-Host "Please install it by following the instructions here: https://docs.platformio.org/en/latest/core/installation.html" -ForegroundColor Yellow
    Write-Host "(Typically, you can install it with Python: 'pip install platformio')" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "PlatformIO Core found." -ForegroundColor Green
}

# 2. Welcome and Instructions
Write-Host "--- Starting Deployment for iot-client ---" -ForegroundColor Cyan
Write-Host "This script will compile the source code and upload the firmware to a connected ESP32 device."
Write-Host ""
Write-Host "IMPORTANT: Please connect your ESP32 device to your computer via USB." -ForegroundColor Yellow
Read-Host -Prompt "Press Enter to continue, or CTRL+C to cancel"

# 3. Change to the iot-client directory
Push-Location -Path ".\iot-client"

# 4. Build and Upload
Write-Host "Attempting to compile and upload firmware..." -ForegroundColor Cyan
Write-Host "PlatformIO will try to auto-detect the COM port. If it fails, you may need to specify it."
Write-Host "See documentation here: https://docs.platformio.org/en/latest/core/userguide/cmd_run.html#cmd-run-option-upload-port"

pio run --target upload

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error during compilation or upload. Please check the PlatformIO output above." -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "Firmware uploaded successfully!" -ForegroundColor Green

# 5. Return to the original directory
Pop-Location

Write-Host "--- IoT Client Deployment Finished ---" -ForegroundColor Cyan
