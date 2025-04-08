import { BiRefresh } from "react-icons/bi";
import { FaBug, FaChevronRight, FaDesktop, FaDownload, FaGithub } from "react-icons/fa";
import { IoConstructOutline, IoHelpCircleOutline, IoLaptopOutline, IoLogoDocker, IoMailOutline } from "react-icons/io5";
import { TbTools } from "react-icons/tb";

function Docs() {
  // Function to safely open external links
  const openExternalLink = (url) => {
    // For Electron environment, this will open links in external browser
    if (window.electron) {
      window.electron.send('app-request', { 
        type: 'open-external-url', 
        url 
      });
      return;
    }
    
    // Fallback for web environment - open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="ml-[276px] mr-4 flex flex-col h-[calc(100vh-1rem)] py-3 text-gray-800">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
          <p className="text-gray-500 mt-1">
            User guide and help for the TrackHounds application
          </p>
        </div>
      </div>

      {/* Main content - scrollable area */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-1 gap-6 pb-8">
          {/* Application Overview */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-l-4 border-blue-500">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <IoLaptopOutline className="mr-2 text-blue-500" size={20} />
                Application Overview
              </h2>
              <p className="text-sm text-gray-500">
                About TrackHounds and its features
              </p>
            </div>
            
            <div className="p-6">
              <p className="mb-4">
                TrackHounds is a modern scoring application designed to provide an alternative to 
                outdated scoring software currently used in Master's Foxhunts. It allows users to 
                efficiently manage hunts, track scores, and generate reports.
              </p>
              
              <h3 className="font-semibold text-gray-800 mt-6 mb-3">Main Features</h3>
              <ul className="space-y-2 pl-5 list-disc text-gray-700">
                <li>Create and manage hunts with customizable settings</li>
                <li>Register and organize dogs and judges</li>
                <li>Record and manage scores with real-time updates</li>
                <li>Track scratches and withdrawals</li>
                <li>Generate detailed reports for various aspects of the hunt</li>
                <li>Automatic updates when connected to internet</li>
              </ul>
              
              <h3 className="font-semibold text-gray-800 mt-6 mb-3">Navigation</h3>
              <p className="mb-3">The application has a sidebar menu providing access to all main features:</p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center"><FaChevronRight className="text-blue-500 mr-2" size={12} /> <strong>Home:</strong> Dashboard with hunt overview</li>
                  <li className="flex items-center"><FaChevronRight className="text-blue-500 mr-2" size={12} /> <strong>Dogs:</strong> Register and manage dogs</li>
                  <li className="flex items-center"><FaChevronRight className="text-blue-500 mr-2" size={12} /> <strong>Judges:</strong> Manage judges for the hunt</li>
                  <li className="flex items-center"><FaChevronRight className="text-blue-500 mr-2" size={12} /> <strong>Score Entry:</strong> Enter and view scores</li>
                  <li className="flex items-center"><FaChevronRight className="text-blue-500 mr-2" size={12} /> <strong>Scratch Sheet:</strong> Manage dog scratches</li>
                  <li className="flex items-center"><FaChevronRight className="text-blue-500 mr-2" size={12} /> <strong>Reports:</strong> Generate hunt reports</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Installation */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-green-50 border-l-4 border-green-500">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <IoLogoDocker className="mr-2 text-green-500" size={20} />
                Installation
              </h2>
              <p className="text-sm text-gray-500">
                How to install and set up TrackHounds
              </p>
            </div>
            
            <div className="p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Prerequisites</h3>
              
              <div className="flex items-center mb-4 p-3 bg-blue-50 rounded-lg">
                <IoLogoDocker className="text-blue-500 mr-3 flex-shrink-0" size={24} />
                <div>
                  <p className="font-medium">Docker Desktop</p>
                  <p className="text-sm text-gray-600">Required to run the application</p>
                  <button 
                    onClick={() => openExternalLink("https://www.docker.com/get-started/")}
                    className="text-blue-500 text-sm hover:underline mt-1 inline-flex items-center"
                  >
                    Download Docker <FaDesktop className="ml-1" size={12} />
                  </button>
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-800 mt-6 mb-3">Installation Steps</h3>
              
              <ol className="space-y-6 pl-6 list-decimal">
                <li>
                  <p className="font-medium">Download the Installer</p>
                  <div className="ml-5 mt-1 flex items-center">
                    <FaGithub className="mr-2 text-gray-700" />
                    <button 
                      onClick={() => openExternalLink("https://github.com/hctynch/trackhounds/releases/latest")}
                      className="text-blue-500 hover:underline inline-flex items-center"
                    >
                      Latest Release <FaDesktop className="ml-1" size={12} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 ml-5 mt-1">
                    Read the "Download Instructions" and install the correct Installer under "Assets"
                  </p>
                </li>
                
                <li>
                  <p className="font-medium">Run the Installer</p>
                  <div className="ml-5 mt-1 text-sm text-gray-600">
                    <p>Run the downloaded installer (Will likely say untrusted, click "More Info" and "Run anyway")</p>
                    <p className="mt-1">This should install TrackHounds on your Desktop and in your Apps</p>
                    <p className="mt-1">It should also open TrackHounds after installing</p>
                  </div>
                </li>
                
                <li>
                  <p className="font-medium">Close TrackHounds</p>
                  <p className="text-sm text-gray-600 ml-5">
                    When finished close TrackHounds, this will shutdown the docker container.
                    Clicking on the TrackHounds application will start everything back up ready to go.
                  </p>
                </li>
              </ol>
            </div>
          </div>
          
          {/* Updates */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-l-4 border-blue-500">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <BiRefresh className="mr-2 text-blue-500" size={20} />
                Updates
              </h2>
              <p className="text-sm text-gray-500">
                Keeping your application up to date
              </p>
            </div>
            
            <div className="p-6">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg mb-4">
                <FaDownload className="text-green-500 mr-3 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium">Automatic Updates</p>
                  <p className="text-sm text-gray-600">
                    TrackHounds will automatically check for and download updates when connected to the internet.
                    You'll be notified when an update is ready to install.
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                Manual update functionality will be available in future releases.
              </p>
            </div>
          </div>
          
          {/* Live Demo */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-indigo-50 border-l-4 border-indigo-500">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaDesktop className="mr-2 text-indigo-500" size={20} />
                Live Demo
              </h2>
              <p className="text-sm text-gray-500">
                Try TrackHounds online
              </p>
            </div>
            
            <div className="p-6">
              <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                <IoMailOutline className="text-indigo-500 mt-1 mr-3 flex-shrink-0" size={24} />
                <div>
                  <p className="font-medium">Request a Demo</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Email <button
                      onClick={() => openExternalLink("mailto:tynchhunt@gmail.com")}
                      className="text-blue-500 hover:underline"
                    >
                      tynchhunt@gmail.com
                    </button> to possibly demo the TrackHounds website and test its functionality.
                  </p>
                  <p className="text-xs text-gray-500 mt-2 italic">
                    Note: Usage is being kept relatively low to maintain free tiers on cloud providers.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Troubleshooting */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-amber-50 border-l-4 border-amber-500">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <IoConstructOutline className="mr-2 text-amber-500" size={20} />
                Troubleshooting
              </h2>
              <p className="text-sm text-gray-500">
                Solutions for common issues
              </p>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <FaBug className="mr-2 text-red-500" size={16} />
                  Docker Desktop Service Not Starting
                </h3>
                
                <ol className="space-y-1 pl-6 list-decimal">
                  <li>Press <kbd className="px-2 py-1 bg-gray-100 rounded border text-sm">Win</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded border text-sm">R</kbd> to open the Run dialog</li>
                  <li>Type <code className="px-2 py-0.5 bg-gray-100 rounded text-sm">services.msc</code> and click OK</li>
                  <li>Scroll down to Docker Desktop Service</li>
                  <li>Right-click and select Start</li>
                </ol>
                
                <div className="mt-3 ml-6">
                  <p className="text-sm font-medium text-gray-700">Optional: Set the service to start automatically:</p>
                  <ul className="text-sm pl-6 list-disc text-gray-600">
                    <li>Right-click Docker Desktop Service &rarr; Properties</li>
                    <li>Set Startup Type to Automatic</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Support & Help */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-purple-50 border-l-4 border-purple-500">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <IoHelpCircleOutline className="mr-2 text-purple-500" size={20} />
                Support & Help
              </h2>
              <p className="text-sm text-gray-500">
                How to get help and report issues
              </p>
            </div>
            
            <div className="p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Issues, Bugs, and Feature Requests</h3>
              
              <p className="mb-3">To report issues or request features:</p>
              
              <ol className="space-y-2 pl-6 list-decimal">
                <li>Go to the <button
                    onClick={() => openExternalLink("https://github.com/hctynch/trackhounds/issues")}
                    className="text-blue-500 hover:underline inline-flex items-center"
                  >
                    Issues <FaDesktop className="ml-1" size={12} />
                  </button> tab on GitHub</li>
                <li>Click <strong>New Issue</strong> in the top right</li>
                <li>Select the appropriate template (e.g., Feature Request, Bug Report)</li>
                <li>Fill in the template and click <strong>Create</strong></li>
              </ol>
            </div>
          </div>
          
          {/* Technologies */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-l-4 border-gray-500">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <TbTools className="mr-2 text-gray-500" size={20} />
                Technologies Used
              </h2>
              <p className="text-sm text-gray-500">
                Tools and frameworks used in TrackHounds
              </p>
            </div>
            
            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Docker</span>
                <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-0.5 rounded">Electron</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">React</span>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Spring Boot</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">MariaDB</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">GitHub Actions</span>
                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">JSON</span>
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">NPM</span>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">JavaScript</span>
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">Vite</span>
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">ESLint</span>
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">Axios</span>
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">CSS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Docs;