import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Management from './pages/Management';
import Loans from './pages/Loans';
import LoanStatus from './pages/LoanStatus';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import { SisterCompaniesProvider } from './contexts/SisterCompaniesContext';
import { ClientsProvider } from './contexts/ClientsContext';
import { LoansProvider } from './contexts/LoansContext';
import { PaymentsProvider } from './contexts/PaymentsContext';
import { UsersProvider } from './contexts/UsersContext';
import './App.css';

function App() {
  return (
    <SisterCompaniesProvider>
      <ClientsProvider>
        <LoansProvider>
          <PaymentsProvider>
            <UsersProvider>
              <Router>
                <div className="app">
                  <Sidebar />
                  <main className="main-content">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/management" element={<Management />} />
                      <Route path="/loans" element={<Loans />} />
                      <Route path="/loan-status" element={<LoanStatus />} />
                      <Route path="/payments" element={<Payments />} />
                      <Route path="/reports" element={<Reports />} />
                    </Routes>
                  </main>
                </div>
              </Router>
            </UsersProvider>
          </PaymentsProvider>
        </LoansProvider>
      </ClientsProvider>
    </SisterCompaniesProvider>
  );
}

export default App; 