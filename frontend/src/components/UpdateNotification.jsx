import { useEffect, useState } from 'react';
import { FaArrowCircleDown, FaInfoCircle } from 'react-icons/fa';
import { isElectron } from '../config';

const UpdateNotification = () => {
  const [updateStatus, setUpdateStatus] = useState({
    checking: false,
    available: false,
    downloaded: false,
    version: null
  });
  const [updateProgress, setUpdateProgress] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!isElectron) return;
    
    // Listen for update status changes
    window.electron.receive('update-status', (status) => {
      console.log('Update status:', status);
      setUpdateStatus(status);
      
      // Show notification when update is ready
      if (status.downloaded) {
        setShowNotification(true);
      }
    });
    
    // Listen for update ready event
    window.electron.receive('update-ready', (data) => {
      console.log('Update ready:', data);
      setShowNotification(true);
      setUpdateStatus(prev => ({
        ...prev,
        downloaded: true,
        version: data.version
      }));
    });
    
    // Listen for update progress
    window.electron.receive('update-progress', (progressObj) => {
      setUpdateProgress(progressObj.percent || 0);
    });
    
    // Check for updates on mount (optional)
    checkForUpdates();
    
    return () => {
      // Clean up listeners if needed
    };
  }, []);
  
  const checkForUpdates = async () => {
    if (!isElectron) return;
    
    setUpdateStatus(prev => ({ ...prev, checking: true }));
    
    try {
      // Use the new invoke method for sync call
      const result = await window.electron.invoke('check-for-updates-sync');
      console.log('Check updates result:', result);
      
      if (result.success) {
        setUpdateStatus(prev => ({
          ...prev,
          checking: false,
          available: result.updateAvailable,
          downloaded: result.updateDownloaded,
          version: result.version
        }));
      } else {
        setUpdateStatus(prev => ({
          ...prev,
          checking: false,
          error: result.message
        }));
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      setUpdateStatus(prev => ({
        ...prev,
        checking: false,
        error: error.message
      }));
    }
  };
  
  const installUpdate = () => {
    if (!isElectron) return;
    
    console.log('Installing update...');
    window.electron.send('install-update');
  };
  
  const closeNotification = () => {
    setShowNotification(false);
  };
  
  if (!isElectron || !showNotification || !updateStatus.downloaded) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg border border-blue-200 z-50 overflow-hidden">
      <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <FaInfoCircle className="text-blue-500" />
          <h3 className="font-medium text-blue-700">Update Available</h3>
        </div>
        <button 
          onClick={closeNotification}
          className="text-gray-400 hover:text-gray-600"
        >
          &times;
        </button>
      </div>
      
      <div className="p-4">
        <p className="text-gray-600 mb-3">
          Version {updateStatus.version} has been downloaded and is ready to install.
        </p>
        
        <div className="flex justify-end space-x-2">
          <button
            onClick={closeNotification}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50"
          >
            Later
          </button>
          
          <button
            onClick={installUpdate}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 flex items-center"
          >
            <FaArrowCircleDown className="mr-1.5" />
            Install Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
