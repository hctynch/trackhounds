import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { BiRefresh } from "react-icons/bi";
import { FaBug, FaChevronRight, FaDatabase, FaDesktop, FaDownload, FaGithub } from "react-icons/fa";
import { IoConstructOutline, IoHelpCircleOutline, IoInformationCircleOutline, IoLaptopOutline, IoMailOutline } from "react-icons/io5";
import { TbTools } from "react-icons/tb";
import { getAppInfo } from "../config";

const RELEASES_URL = "https://github.com/hctynch/trackhounds/releases/latest";
const ISSUES_URL = "https://github.com/hctynch/trackhounds/issues";

function ExternalLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 hover:underline inline-flex items-center"
    >
      {children} <FaDesktop className="ml-1" size={12} />
    </a>
  );
}

ExternalLink.propTypes = {
  href: PropTypes.string.isRequired,
  children: PropTypes.node,
};

function Docs() {
  const [appInfo, setAppInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getAppInfo().then((info) => {
      if (!cancelled) setAppInfo(info);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const dataDir = appInfo?.dataDir || "%LOCALAPPDATA%\\TrackHounds";

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
        {appInfo && (
          <span className="text-sm text-gray-500 bg-white shadow-sm rounded-xl px-4 py-2">
            Version {appInfo.version}
          </span>
        )}
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
                outdated scoring software currently used in Master&apos;s Foxhunts. It allows users to
                efficiently manage hunts, track scores, and generate reports. Everything runs on this
                computer: no internet connection, account, or other software is needed.
              </p>

              <h3 className="font-semibold text-gray-800 mt-6 mb-3">Main Features</h3>
              <ul className="space-y-2 pl-5 list-disc text-gray-700">
                <li>Create and manage hunts with customizable settings</li>
                <li>Register and organize dogs and judges</li>
                <li>Record and manage scores with real-time updates</li>
                <li>Track scratches and withdrawals</li>
                <li>Generate and print detailed reports for various aspects of the hunt</li>
                <li>Works completely offline; all data stays on this computer</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mt-6 mb-3">Navigation</h3>
              <p className="mb-3">The application has a sidebar menu providing access to all main features:</p>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center"><FaChevronRight className="text-blue-500 mr-2" size={12} /> <strong>Home:</strong>&nbsp;Dashboard with hunt overview</li>
                  <li className="flex items-center"><FaChevronRight className="text-blue-500 mr-2" size={12} /> <strong>Dogs:</strong>&nbsp;Register and manage dogs</li>
                  <li className="flex items-center"><FaChevronRight className="text-blue-500 mr-2" size={12} /> <strong>Judges:</strong>&nbsp;Manage judges for the hunt</li>
                  <li className="flex items-center"><FaChevronRight className="text-blue-500 mr-2" size={12} /> <strong>Score Entry:</strong>&nbsp;Enter and view scores</li>
                  <li className="flex items-center"><FaChevronRight className="text-blue-500 mr-2" size={12} /> <strong>Scratch Sheet:</strong>&nbsp;Manage dog scratches</li>
                  <li className="flex items-center"><FaChevronRight className="text-blue-500 mr-2" size={12} /> <strong>Reports:</strong>&nbsp;Generate and print hunt reports</li>
                </ul>
              </div>
            </div>
          </div>

          {/* This installation */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-teal-50 border-l-4 border-teal-500">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <IoInformationCircleOutline className="mr-2 text-teal-500" size={20} />
                This Installation
              </h2>
              <p className="text-sm text-gray-500">
                Where TrackHounds keeps its data on this computer
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Version</p>
                  <p className="font-medium break-all">{appInfo?.version ?? "Loading..."}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Address</p>
                  <p className="font-medium break-all">{typeof window !== "undefined" ? window.location.origin : ""}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Data folder</p>
                  <p className="font-medium break-all font-mono text-sm">{dataDir}</p>
                </div>
              </div>
              <div className="flex items-start p-3 bg-amber-50 rounded-lg">
                <FaDatabase className="text-amber-500 mt-1 mr-3 flex-shrink-0" size={18} />
                <div className="text-sm text-gray-700">
                  <p className="font-medium">Backups</p>
                  <p>
                    All hunt data is stored in the file <code className="px-1 bg-white rounded">trackhounds.db</code> inside
                    the data folder. To back up a hunt, close TrackHounds and copy that file somewhere safe (a USB
                    stick, another folder). To restore it, copy the file back before starting TrackHounds.
                  </p>
                  <p className="mt-1">
                    The tray icon menu (next to the clock) has an <strong>Open data folder</strong> shortcut.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Installation */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-green-50 border-l-4 border-green-500">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaDownload className="mr-2 text-green-500" size={18} />
                Installation
              </h2>
              <p className="text-sm text-gray-500">
                How to install and set up TrackHounds on a Windows computer
              </p>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Prerequisites</h3>
              <p className="text-sm text-gray-600 mb-4">
                None. The installer contains everything TrackHounds needs (including its own Java runtime and
                database). Docker is no longer required.
              </p>

              <h3 className="font-semibold text-gray-800 mt-6 mb-3">Installation Steps</h3>

              <ol className="space-y-6 pl-6 list-decimal">
                <li>
                  <p className="font-medium">Download the Installer</p>
                  <div className="ml-5 mt-1 flex items-center">
                    <FaGithub className="mr-2 text-gray-700" />
                    <ExternalLink href={RELEASES_URL}>Latest Release</ExternalLink>
                  </div>
                  <p className="text-sm text-gray-600 ml-5 mt-1">
                    Under &quot;Assets&quot; download <code className="px-1 bg-gray-100 rounded">TrackHounds-&lt;version&gt;.exe</code>.
                    A portable <code className="px-1 bg-gray-100 rounded">.zip</code> that needs no installation is also provided.
                  </p>
                </li>

                <li>
                  <p className="font-medium">Run the Installer</p>
                  <div className="ml-5 mt-1 text-sm text-gray-600">
                    <p>Windows may show a &quot;Windows protected your PC&quot; message because the installer is not
                      code-signed. Click <strong>More info</strong> and then <strong>Run anyway</strong>.</p>
                    <p className="mt-1">TrackHounds is installed for the current user only, so no administrator password is required.</p>
                    <p className="mt-1">A shortcut is added to the Desktop and the Start menu.</p>
                  </div>
                </li>

                <li>
                  <p className="font-medium">Start and Stop TrackHounds</p>
                  <p className="text-sm text-gray-600 ml-5">
                    Open TrackHounds from the shortcut. The application window opens automatically and a TrackHounds
                    icon appears in the system tray (next to the clock). Closing the window stops TrackHounds; your
                    data is saved continuously, so nothing is lost.
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
                  <p className="font-medium">Manual Updates</p>
                  <p className="text-sm text-gray-600">
                    Download the newest installer from the <ExternalLink href={RELEASES_URL}>releases page</ExternalLink> and
                    run it. It replaces the previous version in place; your hunt data is kept.
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                TrackHounds never connects to the internet on its own, so updates are always your decision.
              </p>
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

            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <FaBug className="mr-2 text-red-500" size={16} />
                  The window did not open
                </h3>
                <ul className="pl-6 list-disc text-sm text-gray-700 space-y-1">
                  <li>Look for the TrackHounds icon in the system tray (click the small arrow next to the clock) and choose <strong>Open TrackHounds</strong>.</li>
                  <li>TrackHounds uses Microsoft Edge (part of Windows) to show its window. If Edge is missing, the page opens in your default browser instead.</li>
                  <li>You can also open the address shown under <strong>This Installation</strong> in any browser on this computer.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <FaBug className="mr-2 text-red-500" size={16} />
                  TrackHounds does not start
                </h3>
                <ul className="pl-6 list-disc text-sm text-gray-700 space-y-1">
                  <li>If it is already running, the existing window is brought up instead of starting a second copy.</li>
                  <li>Check the log files in the <code className="px-1 bg-gray-100 rounded">logs</code> folder inside the data folder and attach the newest one when reporting a problem.</li>
                  <li>Re-running the installer repairs a damaged installation without touching your data.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <FaBug className="mr-2 text-red-500" size={16} />
                  Starting over with an empty database
                </h3>
                <p className="text-sm text-gray-700 pl-6">
                  Close TrackHounds, then rename or delete <code className="px-1 bg-gray-100 rounded">trackhounds.db</code> in the
                  data folder. A new empty database is created the next time TrackHounds starts. (Creating a new hunt
                  inside the application also clears the previous hunt.)
                </p>
              </div>
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
                Try TrackHounds before installing it
              </p>
            </div>

            <div className="p-6">
              <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                <IoMailOutline className="text-indigo-500 mt-1 mr-3 flex-shrink-0" size={24} />
                <div>
                  <p className="font-medium">Request a Demo</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Email <a href="mailto:tynchhunt@gmail.com" className="text-blue-500 hover:underline">tynchhunt@gmail.com</a> to
                    arrange a demo of TrackHounds.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Support & Help */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-purple-50 border-l-4 border-purple-500">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <IoHelpCircleOutline className="mr-2 text-purple-500" size={20} />
                Support &amp; Help
              </h2>
              <p className="text-sm text-gray-500">
                How to get help and report issues
              </p>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Issues, Bugs, and Feature Requests</h3>

              <p className="mb-3">To report issues or request features:</p>

              <ol className="space-y-2 pl-6 list-decimal">
                <li>Go to the <ExternalLink href={ISSUES_URL}>Issues</ExternalLink> tab on GitHub</li>
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
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded">Java</span>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Spring Boot</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">SQLite</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">React</span>
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">Vite</span>
                <span className="bg-cyan-100 text-cyan-800 text-xs font-medium px-2.5 py-0.5 rounded">Tailwind CSS</span>
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">Axios</span>
                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">jpackage</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">GitHub Actions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Docs;
