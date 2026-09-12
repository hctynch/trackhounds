import { HashRouter, Route, Routes } from 'react-router-dom';
import AddDogs from './components/AddDogs';
import AppLifecycle from './components/AppLifecycle';
import CreateHunt from './components/CreateHunt';
import DataPage from './components/DataPage';
import Docs from './components/Docs';
import Dogs from './components/Dogs';
import EditDog from './components/EditDog';
import EditHunt from './components/EditHunt';
import Home from './components/Home';
import Judges from './components/Judges';
import Reports from './components/Reports';
import ScoreEntry from './components/ScoreEntry';
import ScratchSheet from './components/ScratchSheet';
import ViewScores from './components/ViewScores';
import AppShell from './components/layout/AppShell';
import { ToastProvider } from './components/ui/Toast';
import { HuntProvider } from './hooks/useHunt';

function App() {
  return (
    <ToastProvider>
      <AppLifecycle />
      <HashRouter>
        <HuntProvider>
          <AppShell>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/hunt/create" element={<CreateHunt />} />
              <Route path="/hunt/edit" element={<EditHunt />} />
              <Route path="/dogs/all" element={<Dogs />} />
              <Route path="/dogs/add" element={<AddDogs />} />
              <Route path="/dogs/edit" element={<EditDog />} />
              <Route path="/judges/all" element={<Judges />} />
              <Route path="/score-entry/enter" element={<ScoreEntry />} />
              <Route path="/score-entry/view" element={<ViewScores />} />
              <Route path="/scratch-sheet/view" element={<ScratchSheet />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/:reportId" element={<Reports />} />
              <Route path="/data" element={<DataPage />} />
              <Route path="/docs" element={<Docs />} />
            </Routes>
          </AppShell>
        </HuntProvider>
      </HashRouter>
    </ToastProvider>
  );
}

export default App;
