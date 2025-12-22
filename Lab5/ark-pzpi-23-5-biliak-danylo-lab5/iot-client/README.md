# IoT Client for ESP32

This folder contains the source code for the IoT client, designed to run on an ESP32 microcontroller.

## Project Structure

*   `src/`: Contains the main C++/Arduino source code.
*   `platformio.ini`: The configuration file for the PlatformIO build system. It defines the board, framework, and library dependencies.
*   `wokwi.toml`: Configuration for running this project in the Wokwi online ESP32 simulator.

## Deployment to a Physical ESP32 Device

Deploying the code to a physical ESP32 board is called "flashing" or "uploading". This process compiles the source code into a binary firmware file and writes it to the microcontroller's memory.

### Prerequisites

1.  **Hardware**: An ESP32 development board.
2.  **USB Cable**: To connect the ESP32 to your computer.
3.  **CH340/CP210x Drivers**: Most ESP32 boards use one of these USB-to-UART bridge chips. If your computer doesn't recognize the device, you may need to install the appropriate driver.
4.  **PlatformIO Core (CLI)**: This is the command-line tool that builds and uploads the firmware. It is required for the deployment script.
    *   You can install it via Python: `pip install platformio`
    *   For more detailed instructions, see the [official PlatformIO documentation](https://docs.platformio.org/en/latest/core/installation.html).

### Automated Deployment Script

A PowerShell script is provided in the project's root directory to automate the deployment process.

1.  **Connect Your Device**:
    *   Connect your ESP32 board to your computer using a USB cable.

2.  **Run the Script**:
    *   Open a PowerShell terminal in the project's root directory.
    *   You may need to set the PowerShell execution policy for the script to run:
        ```powershell
        Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
        ```
    *   Execute the deployment script:
        ```powershell
        .\deploy_iot.ps1
        ```

3.  **Follow the Prompts**:
    *   The script will first check if `pio` (PlatformIO Core) is installed.
    *   It will then ask you to confirm that your device is connected.
    *   PlatformIO will then automatically compile the code and attempt to upload it to your ESP32. It usually auto-detects the correct COM port.

If the upload is successful, the ESP32 will restart and begin running the new firmware. You can monitor its output using a serial monitor. You can use the one built into PlatformIO: `pio device monitor`.
