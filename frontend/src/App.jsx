import { useEffect } from 'react'
import { HashRouter, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import AddDogs from './components/AddDogs'
import CreateHunt from './components/CreateHunt'
import DockerStatus from './components/DockerStatus'
import Docs from './components/Docs'
import Dogs from './components/Dogs'
import EditDog from './components/EditDog'
import EditHunt from './components/EditHunt'
import Home from './components/Home'
import Judges from './components/Judges'
import Navbar from './components/Navbar'
import Reports from './components/Reports'
import ScoreEntry from './components/ScoreEntry'
import ScratchSheet from './components/ScratchSheet'
import UpdateNotification from './components/UpdateNotification'
import ViewScores from './components/ViewScores'

// Create a new component to handle navigation
function NavigationHandler() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if we're in Electron
    if (window.electron) {
      // Listen for navigation requests from the main process
      window.electron.receive('app-navigation', (data) => {
        console.log('Navigation requested:', data.route);
        if (data.route) {
          navigate(data.route);
        }
      });
    }
    
    return () => {
      // Clean up listener if needed
    };
  }, [navigate]);
  
  return null; // This component doesn't render anything
}

function App() {
  return (
    <div className='w-full h-screen bg-slate-100 absolute top-0 left-0 overflow-auto'>
      <DockerStatus />
      <HashRouter>
        <NavigationHandler />
        <Navbar />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/hunt/create' element={<CreateHunt />} />
          <Route path='/hunt/edit' element={<EditHunt />} />
          <Route path='/dogs/all' element={<Dogs />} />
          <Route path='/dogs/add' element={<AddDogs />} />
          <Route path='/dogs/edit' element={<EditDog />} />
          <Route path='/judges/all' element={<Judges />} />
          <Route path='/score-entry/enter' element={<ScoreEntry />} />
          <Route path='/score-entry/view' element={<ViewScores />} />
          <Route path='/scratch-sheet/view' element={<ScratchSheet />} />
          <Route path='/reports' element={<Reports />} />
          <Route path='/docs' element={<Docs />} />
        </Routes>
      </HashRouter>
      <UpdateNotification />
    </div>
  )
}

export default App
