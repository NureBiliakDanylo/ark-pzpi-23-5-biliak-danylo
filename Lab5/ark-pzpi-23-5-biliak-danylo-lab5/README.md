# ark-lab2 Server Deployment

This document provides instructions on how to deploy the server component of the `ark-lab2` project on a Windows machine.

## Prerequisites

Before you begin, ensure you have the following software installed:

1.  **[Node.js](https://nodejs.org/)**: Required to run the JavaScript server and manage dependencies.
2.  **[PostgreSQL](https://www.postgresql.org/download/windows/)**: The database used by the application.

## Automated Deployment with PowerShell

A PowerShell script (`deploy.ps1`) is provided to automate the deployment process.

### Steps:

1.  **Run the Script**:
    *   Open a PowerShell terminal.
    *   Navigate to the root directory of the project (`C:\ark-lab2`).
    *   You may need to change the execution policy to allow the script to run. You can do this for the current session by running:
        ```powershell
        Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
        ```
    *   Execute the deployment script:
        ```powershell
        .\deploy.ps1
        ```

2.  **Follow the Prompts**:
    *   The script will first display the default database connection settings and ask if you want to use them.
    *   Enter `y` to accept the defaults and continue.
    *   Enter `n` to provide your own connection details. The script will then prompt you for the host, port, user, password, and database name.
    *   The script will then continue with the deployment process:
        *   Checking for Node.js.
        *   Creating the `.env` configuration file.
        *   Installing the required `npm` packages.
        *   Setting up the database schema.
        *   Starting the server.

The server will be running, and you can stop it at any time by pressing `CTRL+C` in the PowerShell window.

### Advanced Configuration

For a non-interactive setup, you can still pre-configure the script by editing the default values in the `CONFIGURATION` section at the top of the `deploy.ps1` file.
