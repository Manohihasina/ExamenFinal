import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import RepairsInProgress from './pages/RepairsInProgress';
import RepairsGroupedView from './pages/RepairsGroupedView';
import ApiTest from './pages/ApiTest';
import DebugPage from './pages/DebugPage';
import AddIntervention from './pages/AddIntervention';
import './App.css';

function App() {
  return (
    <ChakraProvider>
      <Router>
        <div className="app">
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/repairs" element={<RepairsInProgress />} />
              <Route path="/repairs-grouped" element={<RepairsGroupedView />} />
              <Route path="/add-intervention" element={<AddIntervention />} />
              <Route path="/test" element={<ApiTest />} />
              <Route path="/debug" element={<DebugPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ChakraProvider>
  );
}

export default App;
