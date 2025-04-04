import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import AddDogs from './components/AddDogs';
import CreateHunt from './components/CreateHunt';
import Dogs from './components/Dogs';
import EditDog from './components/EditDog';
import EditHunt from './components/EditHunt';
import Home from './components/Home';
import Judges from './components/Judges';
import Login from './components/Login';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Reports from './components/Reports';
import ScoreEntry from './components/ScoreEntry';
import ScratchSheet from './components/ScratchSheet';
import ViewScores from './components/ViewScores';

// Main Content that depends on authentication
function AppContent() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className='w-full h-screen bg-slate-100 absolute top-0 left-0 overflow-auto'>
      <BrowserRouter>
        {/* Navbar should be outside the Routes, always visible when user is logged in */}
        {user && <Navbar />}
        
        <Routes>
          {/* REMOVE this conflicting route */}
          {/* <Route path="/" element={user ? <Navbar /> : null} /> */}
          
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          
          {/* This is your home route */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          
          {/* Other protected routes */}
          <Route path='/hunt/create' element={<ProtectedRoute><CreateHunt /></ProtectedRoute>} />
          <Route path='/hunt/edit' element={
            <ProtectedRoute>
              <EditHunt />
            </ProtectedRoute>
          } />
          <Route path='/dogs/all' element={
            <ProtectedRoute>
              <Dogs />
            </ProtectedRoute>
          } />
          <Route path='/dogs/add' element={
            <ProtectedRoute>
              <AddDogs />
            </ProtectedRoute>
          } />
          <Route path='/dogs/edit' element={
            <ProtectedRoute>
              <EditDog />
            </ProtectedRoute>
          } />
          <Route path='/judges/all' element={
            <ProtectedRoute>
              <Judges />
            </ProtectedRoute>
          } />
          <Route path='/score-entry/enter' element={
            <ProtectedRoute>
              <ScoreEntry />
            </ProtectedRoute>
          } />
          <Route path='/score-entry/view' element={
            <ProtectedRoute>
              <ViewScores />
            </ProtectedRoute>
          } />
          <Route path='/scratch-sheet/view' element={
            <ProtectedRoute>
              <ScratchSheet />
            </ProtectedRoute>
          } />
          <Route path='/reports' element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="*" element={
            user ? <Navigate to="/" replace /> : <Navigate to="/login" replace />
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

// Wrapper component that provides the AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
