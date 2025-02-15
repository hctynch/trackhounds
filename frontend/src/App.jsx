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
    <div className='w-full h-screen bg-slate-100 absolute top-0 left-0'>
      <Navbar />
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/dogs/all' element={<Dogs />} />
          <Route path='/dogs/add' element={<Dogs />} />
          <Route path='/dogs/edit' element={<Dogs />} />
          <Route path='/judges/all' element={<Judges />} />
          <Route path='/judges/add' element={<Judges />} />
          <Route path='/judges/edit' element={<Judges />} />
          <Route path='/score-entry/enter' element={<ScoreEntry />} />
          <Route path='/score-entry/view' element={<ScoreEntry />} />
          <Route path='/scratch-sheet/enter' element={<ScratchSheet />} />
          <Route path='/scratch-sheet/view' element={<ScratchSheet />} />
          <Route path='/reports' element={<Reports />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
