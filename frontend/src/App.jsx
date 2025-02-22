import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import AddDogs from './components/AddDogs'
import CreateHunt from './components/CreateHunt'
import Dogs from './components/Dogs'
import EditDog from './components/EditDog'
import EditHunt from './components/EditHunt'
import Home from './components/Home'
import Judges from './components/Judges'
import Navbar from './components/Navbar'
import Reports from './components/Reports'
import ScoreEntry from './components/ScoreEntry'
import ScratchSheet from './components/ScratchSheet'

function App() {

  return (
    <div className='w-full h-screen bg-slate-100 absolute top-0 left-0 overflow-auto'>
      <Navbar />
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/hunt/create' element={<CreateHunt />} />
          <Route path='/hunt/edit' element={<EditHunt />} />
          <Route path='/dogs/all' element={<Dogs />} />
          <Route path='/dogs/add' element={<AddDogs />} />
          <Route path='/dogs/edit' element={<EditDog />} />
          <Route path='/judges/all' element={<Judges />} />
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
