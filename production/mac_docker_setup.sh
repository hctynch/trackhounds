#!/bin/bash

# Define the shutdown script path
SHUTDOWN_SCRIPT="./mac_docker_shutdown.sh"

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "Docker is not installed. Please install Docker and try again."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1
then
    echo "Starting Docker service..."
    open /Applications/Docker.app
    # Wait for Docker to start
    echo "Waiting for Docker to start..."
    while ! docker info > /dev/null 2>&1
    do
        sleep 1
    done
fi

# Load Docker images from tar files
echo "Loading Docker images..."
docker load -i backend.tar
docker load -i frontend.tar
docker load -i mariadb.tar

# Run Docker Compose
echo "Running Docker Compose..."
docker-compose up -d

echo "Docker Compose is up and running."

# Open default web browser to localhost:3000
echo "Opening web browser..."
open http://localhost:3000

# Wait for user to close the script
echo "Press any key to stop Docker and exit..."
read -n 1 -s

# Call the shutdown script
bash $SHUTDOWN_SCRIPT