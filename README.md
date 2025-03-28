# trackhounds

_By: Hunt Tynch_

![Started](https://img.shields.io/github/created-at/hctynch/trackhounds?label=Started%20in&color=0080ff)
![Release](https://img.shields.io/github/release-date/hctynch/trackhounds?display_date=published_at&style=flat&color=0080ff)
![Coverage](https://codecov.io/gh/hctynch/trackhounds/branch/main/graph/badge.svg)
![Commit](https://img.shields.io/github/last-commit/hctynch/trackhounds?style=flat&logo=git&logoColor=white&color=0080ff)
![Language](https://img.shields.io/github/languages/top/hctynch/trackhounds?style=flat&color=0080ff)
![Languages](https://img.shields.io/github/languages/count/hctynch/trackhounds?style=flat&color=0080ff)
![Downloads](https://img.shields.io/github/downloads/hctynch/trackhounds/total?color=0080ff)

---

## **_Tools and Technologies_**

![Docker](https://img.shields.io/badge/Docker-2496ED.svg?style=flat&logo=Docker&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB.svg?style=flat&logo=React&logoColor=black)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-6DB33F.svg?style=flat&logo=Spring-Boot&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-003545.svg?style=flat&logo=MariaDB&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF.svg?style=flat&logo=GitHub-Actions&logoColor=white)
![JSON](https://img.shields.io/badge/JSON-000000.svg?style=flat&logo=JSON&logoColor=white)
![NPM](https://img.shields.io/badge/npm-CB3837.svg?style=flat&logo=npm&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=flat&logo=JavaScript&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF.svg?style=flat&logo=Vite&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3.svg?style=flat&logo=ESLint&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4.svg?style=flat&logo=Axios&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-663399.svg?style=flat&logo=CSS&logoColor=white)

---

## Score Tracking Software

TrackHounds is a modern scoring application designed to provide an alternative to outdated scoring software currently used in Master's Foxhunts. It allows users to efficiently manage hunts, track scores, and generate reports.

---

## Needed Resources

- [**Docker**](https://www.docker.com/get-started/) (Required to run the application)
- Latest Release of [**trackhounds**](https://github.com/hctynch/trackhounds/releases) (Download `trackhounds-X.X.X.zip` under `Assets`)

---

## Usage & Help

### Issues, Bugs, and Feature Requests

To report issues or request features:

1. Go to the [Issues](https://github.com/hctynch/trackhounds/issues) tab.
2. Click `New Issue` in the top right.
3. Select the appropriate template (e.g., Feature Request, Bug Report).
4. Fill in the template and click `Create`.

---

## User's Guide

### Install

1. **Download the Release**

   - Go to the [latest release](https://github.com/hctynch/trackhounds/releases).
   - Under `Assets`, download the `trackhounds-X.X.X.zip` file.

2. **Extract the Files**

   - Locate the downloaded `.zip` file in your `Downloads` folder.
   - Right-click the file and select `Extract All`.
   - Choose a location to extract the files (e.g., Desktop).

3. **Run the Setup Script**

   - Navigate to the extracted folder (e.g., `trackhounds-X.X.X`).
   - Double-click the `windows_docker_setup.bat` file to start the setup process.  
     **Note for Mac Users**: Follow the Mac-specific instructions in the release notes.

4. **Start the Application**
   - The setup script will:
     - Start Docker Desktop.
     - Load the necessary containers.
     - Launch TrackHounds in your default web browser.
   - If the browser shows an error, refresh the page.

---

### Troubleshooting

#### Docker Desktop Service Not Starting

1. Press <kbd>Win</kbd> + <kbd>R</kbd> to open the Run dialog.
2. Type `services.msc` and click `OK`.
3. Scroll down to `Docker Desktop Service`.
4. Right-click and select `Start`.  
   **Optional**: Set the service to start automatically:
   - Right-click `Docker Desktop Service` > `Properties`.
   - Set `Startup Type` to `Automatic`.

#### Application Running in Background

- After using the application, click the terminal window and press any key to stop Docker and shut down the application.

---

### Application Overview

#### Navbar

Provides access to major pages:

- Home
- Add Dogs
- View Dogs
- Judges
- Add Score
- View Scores
- Scratch Sheet
- Reports

#### Home

Displays an overview of the current hunt. Use the three-dot menu in the upper-right corner to:

- Create a new hunt.
- Edit the current hunt.

#### Dogs

- **All Dogs**: View all registered dogs.
- **Add Dogs**: Add new dogs to the hunt.

#### Judges

Manage judges for the hunt:

- View current judges.
- Add or edit judges.

#### Score Entry

- **Enter Score**: Add scores for dogs.
- **View Scores**: View and delete entered scores.

#### Scratch Sheet

View and manage scratches:

- Add new scratches.
- View all entered scratches.

#### Reports

Generate printable reports:

- Overall Speed & Drive Report
- Daily Speed & Drive Report
- Comprehensive Dog Scores Report  
  **Note**: Use Google Chrome for the best printing experience.
