import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientRepairHistory from './pages/ClientRepairHistory';
import RepairsInProgress from './pages/RepairsInProgress';
import RepairsGroupedView from './pages/RepairsGroupedView';
import ApiTest from './pages/ApiTest';

import AddIntervention from './pages/AddIntervention';
import SlotsPage from './pages/SlotsPage';
import MobileAppPage from './pages/MobileAppPage';
import './App-dark.css';

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
              <Route path="/clients/:clientId/repair-history" element={<ClientRepairHistory />} />
              <Route path="/repairs" element={<RepairsInProgress />} />
              <Route path="/slots" element={<SlotsPage />} />
              <Route path="/repairs-grouped" element={<RepairsGroupedView />} />
              <Route path="/add-intervention" element={<AddIntervention />} />
              <Route path="/mobile-app" element={<MobileAppPage />} />
              <Route path="/test" element={<ApiTest />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ChakraProvider>
  );
}

export default App;
