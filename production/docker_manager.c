#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
#include <windows.h>
#else
#include <unistd.h>
#endif

// Function to check if Docker is installed
int check_docker_installed()
{
#ifdef _WIN32
    int result = system("docker --version >nul 2>&1");
#else
    int result = system("docker --version >/dev/null 2>&1");
#endif
    return result == 0;
}

// Function to start Docker service
int start_docker_service()
{
#ifdef _WIN32
    int result = system("net start com.docker.service >nul 2>&1");
    return result == 0;
#else
    int result = system("open /Applications/Docker.app");
    if (result != 0)
    {
        return 0;
    }
    // Wait for Docker to start
    printf("Waiting for Docker to start...\n");
    while (system("docker info >/dev/null 2>&1") != 0)
    {
        sleep(1);
    }
    return 1;
#endif
}

// Function to load Docker images from tar files
int load_docker_images()
{
    int result = system("docker load -i backend.tar && docker load -i frontend.tar && docker load -i mariadb.tar");
    return result == 0;
}

// Function to run Docker Compose
int run_docker_compose()
{
    int result = system("docker-compose -f docker-compose.yml up -d");
    return result == 0;
}

int main()
{
    printf("Checking if Docker is installed...\n");
    if (!check_docker_installed())
    {
        printf("Docker is not installed. Please install Docker and try again.\n");
        return 1;
    }

    printf("Starting Docker service...\n");
    if (!start_docker_service())
    {
        printf("Failed to start Docker service. Please start Docker manually and try again.\n");
        return 1;
    }

    printf("Loading Docker images...\n");
    if (!load_docker_images())
    {
        printf("Failed to load Docker images. Please check the tar files and try again.\n");
        return 1;
    }

    printf("Running Docker Compose...\n");
    if (!run_docker_compose())
    {
        printf("Failed to run Docker Compose. Please check the docker-compose.yml file and try again.\n");
        return 1;
    }

    printf("Docker Compose is up and running.\n");
    return 0;
}