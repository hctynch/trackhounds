#!/bin/bash

# Bring down Docker Compose services
docker-compose down
echo "Containers Shutting Down..."

# Stop Docker Desktop and related processes
pkill -f Docker
pkill -f com.docker.backend

if [ $? -ne 0 ]; then
    echo "Failed to stop Docker processes. Please stop Docker manually."
    exit 1
fi

echo "Docker Desktop and related processes have been stopped."