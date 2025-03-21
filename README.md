# trackhounds

![Coverage](https://codecov.io/gh/hctynch/trackhounds/branch/main/graph/badge.svg)

_By: Hunt Tynch_

_Started: Feb 2025_

## Score Tracking Software

Software designed to provide a potential alternative to dated scoring software currently used in the Master's Foxhunts.

## Needed Resources

- [**Docker**](https://www.docker.com/get-started/)
- Latest Release of [**trackhounds**](https://github.com/hctynch/trackhounds/releases) (Downlaod `trackhounds-X.X.X.zip` under `Assets`)

## Usage & Help

1. Download Docker Desktop
2. Download the latest release of trackhounds
3. Follow the [instructions](https://github.com/hctynch/trackhounds/releases)
4. Email `tynchhunt@gmail.com` with issues, or use your GitHub account to create an issue under `Issues`

## User's Guide

### Install

After clicking the `trackhounds-X.X.X.zip` under `Assets` in the [latest release](https://github.com/hctynch/trackhounds/releases),
you should now see this zipped foler in your downloads:

![image](https://github.com/user-attachments/assets/96dfd539-ae3f-4053-a742-59fe63e9babe)

Right click this zipped folder and select `Extract All`,
you should then see this screen:

![image](https://github.com/user-attachments/assets/3b6da88b-2cad-4a56-95ce-17596bbcc669)

Select a location to install the application too, suggested to install to Desktop or a easily accesible location.

Next, navigate to where you extract the zipped folder to. Open the `trackhounds-X.X.X` folder (X.X.X will be the current version, e.g. 1.0.0).

![image](https://github.com/user-attachments/assets/afdffd77-2c06-41ee-a49d-2d1c3353a1dd)

Then all that is left is selecting the `windows_docker_setup.bat` file (If you have a Mac follow the instructions in the release for Mac specific instructions):

![image](https://github.com/user-attachments/assets/e4e3c8a2-048b-4cd3-bd7a-94fdde846099)

This will open a terminal which should start Docker, load the containers from the .tar files, and start up trackhounds in a web browser (**Note**: if the browser is showing an error just refresh)

![image](https://github.com/user-attachments/assets/990d691c-5914-4ba2-a196-8c34d5254def)

**NOTICE**: If Docker Desktop is not starting then the Docker Desktop Service is probably not running. To fix this press the Windows Button <kbd>&#8862; Win</kbd> + R. This will open a little window in the bottom left. Type ```services.msc```, click ```OK```. Scroll down the services and click ```Docker Desktop Service```, after selecting it click ```Start``` to start the service. **OPTIONAL**: You can force this service to start automatically when starting your computer and run in the background, but it is not required. If you want to do so right click ```Docker Desktop Service```, then click ```Properties```. You'll see an option called ```Startup Type``` set this to ```Automatic```. Now this service will start whenever you start your computer and run in the background.

![image](https://github.com/user-attachments/assets/c38d1540-4bf6-469f-b25b-09f83922d6d2)

**Notice**: The terminal says press any key to stop Docker and exit...
This is for a smooth shutdown of both docker and the application, **after using the application** I would **highly** recommend clicking the terminal window and pressing a button. If not the application will be running in the background until Docker Desktop is shutdown.

![image](https://github.com/user-attachments/assets/79b1184a-8e1e-48a8-aa71-ef6747da0b47)

### trackhounds

![image](https://github.com/user-attachments/assets/20a8e7ff-5483-423b-bec4-19e191960529)

If you have made it to this screen congratulations trackhounds is now running on your computer. After the initial install of Docker and trackhounds you no longer will need an internet connection to operate this application.

#### Navbar

![image](https://github.com/user-attachments/assets/359acdbe-dc67-4f59-bdca-8d629f007116)

Provides access to major pages in the application such as Home, Add Dogs, View Dogs, Judges, Add Score, View Scores, Scratch Sheet, and Reports.

#### Home

![image](https://github.com/user-attachments/assets/7f46494e-1901-4505-882e-3ee7c32c446f)

Provides overview information for the current Hunt, serves as a landing page. In the **_Upper Right_** there is a three dots icon this can be used for `Creating a New Hunt` and `Editing the Current Hunt`

#### Dogs

![image](https://github.com/user-attachments/assets/8ce4f3d5-abcb-45fd-baa1-f2cdb7ca7787)

Selecting All Dogs will take you to this screen where all dogs can be seen:

![image](https://github.com/user-attachments/assets/0ffebf9d-d3dd-48bf-a8e3-7853ab4ce283)

Selecting Add Dogs will take you to this screen where new dogs can be added:

![image](https://github.com/user-attachments/assets/1d26a19b-308c-4287-8f1c-c28c7aa0d6a0)

#### Judges

![image](https://github.com/user-attachments/assets/1e119844-1ce8-45c0-814f-3b3953f89fe7)

Selecting Judges will take you to a screen where you can view current judges, add judges, or edit. **Note** Currently, I am not clearing out judges when starting a new hunt. However, this can be changed if requested but I was not sure if a large number of judges might be the same for each hunt.

#### Score Entry

![image](https://github.com/user-attachments/assets/abdb0589-7a70-4a5b-8ce1-b3d84b4543a5)

Selecting Enter Score will take you to a screen where you can enter a "Score"/"Cross":

![image](https://github.com/user-attachments/assets/02b83871-a9bf-4748-bef7-eb32583dd1bd)

Selecting View Scores will take you to a screen where you can view all entered scores and delete them:

![image](https://github.com/user-attachments/assets/8dc36e99-dbf3-43db-9845-c9c90942d48c)

#### Scratch Sheet

![image](https://github.com/user-attachments/assets/6c0cb09d-a0e0-4f65-bc56-b51c82e25ddd)

Selecting Scratch Sheet will take you to a screen where you can view all entered scratches and add new ones.

#### Reports

![image](https://github.com/user-attachments/assets/8129092b-05b8-4e36-8fea-cfba20262376)

Clicking reports will allow you see all the current possible options for printable reports. I can alter or add new reports upon request, as a niceity I would request an example of how you want the report structured and any parameters you may want to filter for. The printing functionality relies on the browsers built in printing, that does mean using different browsers will alter capabilities. I suggest Google Chrome as it has options for printing on a large number of paper styles.
