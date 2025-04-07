import { useEffect, useState } from 'react';
import { FaCircleCheck, FaCircleExclamation, FaCircleXmark, FaDownload, FaSpinner } from 'react-icons/fa6';
import { checkBackendConnection, checkDockerStatus, isElectron, listenForSetupEvents } from '../config';

function DockerStatus() {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [dockerStatus, setDockerStatus] = useState({
    checking: true,
    running: false,
    containers: {
      backend: { running: false },
      database: { running: false }
    }
  });
  const [setupProgress, setSetupProgress] = useState({
    stage: 'initial',
    detail: 'Starting application',
    progress: 0
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check Docker status if in Electron
    if (isElectron) {
      checkDockerStatus(status => {
        setDockerStatus(status);
      });
      
      // Listen for detailed setup progress events
      listenForSetupEvents(data => {
        setSetupProgress(data);
      });
    }
    
    // Check backend connection
    const checkConnection = async () => {
      const isConnected = await checkBackendConnection();
      setBackendStatus(isConnected ? 'connected' : 'disconnected');

      // If connected, make sure we clear any lingering setup progress
      if (isConnected) {
        setSetupProgress(prev => ({
          ...prev,
          stage: 'complete',
          progress: 100
        }));
      }
      
      // If not connected, try again in 5 seconds
      if (!isConnected) {
        setTimeout(checkConnection, 5000);
      }
    };
    
    checkConnection();
  }, []);

  // Determine overall status based on all states
  const getStatus = () => {
    if (backendStatus === 'connected') {
      return { type: 'success', message: 'Connected to backend', icon: <FaCircleCheck /> };
    }
    
    // Handle detailed setup progress stages
    if (setupProgress.stage === 'loading-images') {
      return { 
        type: 'info', 
        message: `Loading Docker images... ${Math.round(setupProgress.progress)}%`, 
        icon: <FaSpinner className="animate-spin" /> 
      };
    }
    
    if (setupProgress.stage === 'starting-containers') {
      return { 
        type: 'info', 
        message: `Starting containers... ${Math.round(setupProgress.progress)}%`, 
        icon: <FaSpinner className="animate-spin" /> 
      };
    }
    
    if (setupProgress.stage === 'downloading-resources') {
      return { 
        type: 'info', 
        message: `Downloading resources... ${Math.round(setupProgress.progress)}%`, 
        icon: <FaDownload /> 
      };
    }
    
    if (setupProgress.stage === 'complete') {
      return { 
        type: 'info', 
        message: 'Connecting to backend...', 
        icon: <FaSpinner className="animate-spin" /> 
      };
    }
    
    if (setupProgress.stage === 'error') {
      return { 
        type: 'warning', 
        message: setupProgress.detail || 'Error during setup', 
        icon: <FaCircleExclamation /> 
      };
    }
    
    // Default Docker status handling
    if (dockerStatus.checking) {
      return { type: 'info', message: 'Starting Docker...', icon: <FaSpinner className="animate-spin" /> };
    }
    
    if (!dockerStatus.running) {
      return { type: 'error', message: 'Docker not running', icon: <FaCircleXmark /> };
    }
    
    if (!dockerStatus.containers.database.running) {
      return { type: 'warning', message: 'Database container not running', icon: <FaCircleExclamation /> };
    }
    
    if (!dockerStatus.containers.backend.running) {
      return { type: 'warning', message: 'Backend container not running', icon: <FaCircleExclamation /> };
    }
    
    return { type: 'info', message: 'Connecting to backend...', icon: <FaSpinner className="animate-spin" /> };
  };
  
  const status = getStatus();
  
  // Status colors
  const statusStyles = {
    success: 'bg-green-500 text-white',
    warning: 'bg-amber-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white'
  };
  
  if (!isElectron || backendStatus === 'connected') {
    return null;
  }

  return (
    <>
      <div 
        className={`fixed top-0 left-0 right-0 ${statusStyles[status.type]} text-white text-center py-2 z-50 flex items-center justify-center cursor-pointer`}
        onClick={() => setIsOpen(true)}
      >
        <span className="mr-2">{status.icon}</span>
        {status.message}
        
        {/* Add a subtle progress indicator if applicable */}
        {setupProgress.progress > 0 && setupProgress.progress < 100 && setupProgress.stage !== 'complete' && (
          <div className="ml-4 bg-white/20 h-1.5 w-24 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full" 
              style={{ width: `${setupProgress.progress}%` }}
            ></div>
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 border-b pb-3">Application Status</h2>
            
            <div className="space-y-4 py-2">
              {/* Setup Progress if active */}
              {setupProgress.stage !== 'complete' && setupProgress.stage !== 'initial' && (
                <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-700 mb-2 flex items-center">
                    <FaSpinner className="animate-spin mr-2" />
                    Setup in Progress
                  </h3>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-blue-600 mb-1">
                      <span>{setupProgress.detail || 'Setting up application...'}</span>
                      <span>{Math.round(setupProgress.progress)}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${setupProgress.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Docker Status */}
              <div className="flex items-center p-3 rounded-lg bg-gray-50">
                <div className={`mr-4 p-2.5 rounded-full flex items-center justify-center ${dockerStatus.running ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} style={{width: '40px', height: '40px'}}>
                  {dockerStatus.running ? <FaCircleCheck size={20} /> : <FaCircleXmark size={20} />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Docker</p>
                  <p className="text-sm text-gray-500">
                    {dockerStatus.checking ? 'Starting...' : (dockerStatus.running ? 'Running' : 'Not running')}
                  </p>
                </div>
              </div>
              
              {/* Database Status */}
              <div className="flex items-center p-3 rounded-lg bg-gray-50">
                <div className={`mr-4 p-2.5 rounded-full flex items-center justify-center ${dockerStatus.containers.database.running ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} style={{width: '40px', height: '40px'}}>
                  {dockerStatus.containers.database.running ? <FaCircleCheck size={20} /> : <FaCircleXmark size={20} />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Database</p>
                  <p className="text-sm text-gray-500">
                    {dockerStatus.checking ? 'Starting...' : (dockerStatus.containers.database.running ? 'Running' : 'Not running')}
                  </p>
                </div>
              </div>
              
              {/* Backend Status */}
              <div className="flex items-center p-3 rounded-lg bg-gray-50">
                <div className={`mr-4 p-2.5 rounded-full flex items-center justify-center ${dockerStatus.containers.backend.running ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} style={{width: '40px', height: '40px'}}>
                  {dockerStatus.containers.backend.running ? <FaCircleCheck size={20} /> : <FaCircleXmark size={20} />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Backend API</p>
                  <p className="text-sm text-gray-500">
                    {dockerStatus.checking ? 'Starting...' : (dockerStatus.containers.backend.running ? 'Running' : 'Not running')}
                  </p>
                </div>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center p-3 rounded-lg bg-gray-50">
                <div className={`mr-4 p-2.5 rounded-full flex items-center justify-center ${backendStatus === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} style={{width: '40px', height: '40px'}}>
                  {backendStatus === 'connected' ? <FaCircleCheck size={20} /> : (backendStatus === 'checking' ? <FaSpinner className="animate-spin" size={20} /> : <FaCircleXmark size={20} />)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Connection</p>
                  <p className="text-sm text-gray-500">
                    {backendStatus === 'checking' ? 'Checking connection...' : 
                     (backendStatus === 'connected' ? 'Connected to backend' : 'Cannot connect to backend')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-sm text-gray-600 bg-amber-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2 flex items-center">
                <FaCircleExclamation className="text-amber-500 mr-2" />
                Troubleshooting Tips
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Docker Desktop is installed and running</li>
                <li>Your user has permission to run Docker</li>
                <li>No firewall or antivirus is blocking connection</li>
                <li>The application has internet access</li>
              </ul>
            </div>
            
            <button 
              className="mt-6 w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default DockerStatus;
