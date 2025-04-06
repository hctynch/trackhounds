import { useEffect, useState } from 'react';
import { FaCircleCheck, FaCircleExclamation, FaCircleXmark, FaSpinner } from 'react-icons/fa6';
import { checkBackendConnection, checkDockerStatus, isElectron } from '../config';

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
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check Docker status if in Electron
    if (isElectron) {
      checkDockerStatus(status => {
        setDockerStatus(status);
      });
    }
    
    // Check backend connection
    const checkConnection = async () => {
      const isConnected = await checkBackendConnection();
      setBackendStatus(isConnected ? 'connected' : 'disconnected');

      // If not connected, try again in 5 seconds
      if (!isConnected) {
        setTimeout(checkConnection, 5000);
      }
    };
    
    checkConnection();
  }, []);

  // Determine overall status
    const getStatus = () => {
      console.log(backendStatus, dockerStatus);
    if (backendStatus === 'connected') {
      return { type: 'success', message: 'Connected to backend', icon: <FaCircleCheck /> };
    }
    
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
      </div>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Docker Status</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className={`mr-3 p-2 rounded-full ${dockerStatus.running ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {dockerStatus.running ? <FaCircleCheck /> : <FaCircleXmark />}
                </div>
                <div>
                  <p className="font-medium">Docker</p>
                  <p className="text-sm text-gray-500">
                    {dockerStatus.checking ? 'Starting...' : (dockerStatus.running ? 'Running' : 'Not running')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`mr-3 p-2 rounded-full ${dockerStatus.containers.database.running ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {dockerStatus.containers.database.running ? <FaCircleCheck /> : <FaCircleXmark />}
                </div>
                <div>
                  <p className="font-medium">Database</p>
                  <p className="text-sm text-gray-500">
                    {dockerStatus.checking ? 'Starting...' : (dockerStatus.containers.database.running ? 'Running' : 'Not running')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`mr-3 p-2 rounded-full ${dockerStatus.containers.backend.running ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {dockerStatus.containers.backend.running ? <FaCircleCheck /> : <FaCircleXmark />}
                </div>
                <div>
                  <p className="font-medium">Backend API</p>
                  <p className="text-sm text-gray-500">
                    {dockerStatus.checking ? 'Starting...' : (dockerStatus.containers.backend.running ? 'Running' : 'Not running')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`mr-3 p-2 rounded-full ${backendStatus === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {backendStatus === 'connected' ? <FaCircleCheck /> : (backendStatus === 'checking' ? <FaSpinner className="animate-spin" /> : <FaCircleXmark />)}
                </div>
                <div>
                  <p className="font-medium">Connection</p>
                  <p className="text-sm text-gray-500">
                    {backendStatus === 'checking' ? 'Checking connection...' : 
                     (backendStatus === 'connected' ? 'Connected to backend' : 'Cannot connect to backend')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-sm text-gray-500">
              <p>If Docker isn't starting, please check:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Docker Desktop is installed</li>
                <li>Your user has permission to run Docker</li>
                <li>Any firewall or antivirus isn't blocking the connection</li>
              </ul>
            </div>
            
            <button 
              className="mt-6 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium"
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
