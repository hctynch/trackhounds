import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Dogs from './components/Dogs'
import Home from './components/Home'
import Judges from './components/Judges'
import Navbar from './components/Navbar'
import Reports from './components/Reports'
import ScoreEntry from './components/ScoreEntry'
import ScratchSheet from './components/ScratchSheet'

function App() {

  return (
    <div className='absolute top-0 left-0 bg-gray-200/80 min-h-screen min-w-screen flex justify-center items-center'>
      <Navbar />
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/dogs' element={<Dogs />} />
          <Route path='/judges' element={<Judges />} />
          <Route path='/score-entry' element={<ScoreEntry />} />
          <Route path='/scratch-sheet' element={<ScratchSheet />} />
          <Route path='/reports' element={<Reports/>} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
