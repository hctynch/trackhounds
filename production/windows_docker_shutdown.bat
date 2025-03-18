@echo off
setlocal

:: Bring down Docker Compose services
docker-compose down
echo Containers Shutting Down...

:: Stop Docker Desktop and related processes
taskkill /IM "Docker Desktop.exe" /F >nul 2>&1
taskkill /IM "com.docker.backend.exe" /F >nul 2>&1

if %ERRORLEVEL% neq 0 (
    echo Failed to stop Docker processes. Please stop Docker manually.
    exit /b 1
)

echo Docker Desktop and related processes have been stopped.
endlocal
pause