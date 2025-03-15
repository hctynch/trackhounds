@echo off
setlocal

:: Define the shutdown script path
set SHUTDOWN_SCRIPT=windows_docker_shutdown.bat

:: Check if Docker is installed
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Docker is not installed. Please install Docker and try again.
    exit /b 1
)

:: Check if Docker is running
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Starting Docker service...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker to start...
    :wait_for_docker
    timeout /t 5 >nul
    docker info >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        goto wait_for_docker
    )
)

:: Load Docker images from tar files
echo Loading Docker images...
docker load -i backend.tar
docker load -i frontend.tar
docker load -i mariadb.tar

:: Run Docker Compose
echo Running Docker Compose...
docker-compose up -d

echo Docker Compose is up and running.

:: Open default web browser to localhost:3000
echo Opening web browser...
start http://localhost:3000

:: Wait for user to close the script
echo Press any key to stop Docker and exit...
pause >nul

:: Call the shutdown script
call %SHUTDOWN_SCRIPT%

endlocal