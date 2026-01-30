
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import FillRecordSelection from './pages/FillRecordSelection';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import RFCodingForm from './pages/RFCodingForm';
import MainPCBCodingForm from './pages/MainPCBCodingForm';
import ProcessObservationForm from './pages/ProcessObservationForm';
import OperatorTrackingForm from './pages/OperatorTrackingForm';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';
import ForgotPassword from './pages/ForgotPassword';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// DOCUMENT MODULE PAGES
import ProcessCheckSheet from './pages/ProcessCheckSheet';
import RFPatrollingSheet from './pages/RFPatrollingSheet';
import MainPCBPatrollingSheet from './pages/MainPCBPatrollingSheet';
import ReferenceDocuments from './pages/ReferenceDocuments';
import RFCodingCheckpointForm from './pages/RFCodingCheckpointForm';

import { User, UserRole } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('kimbal_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('kimbal_user', JSON.stringify(user));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('kimbal_user');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-2xl font-bold text-blue-600 animate-pulse uppercase tracking-widest">Kimbal Technology...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {currentUser && <Navbar user={currentUser} onLogout={logout} />}
        <div className="flex flex-1 overflow-hidden">
          {currentUser && <Sidebar user={currentUser} />}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <Routes>
              <Route path="/" element={<LandingPage user={currentUser} />} />
              
              <Route path="/fill-record" element={!currentUser ? <FillRecordSelection /> : <Navigate to="/dashboard" />} />
              <Route path="/module/rf" element={!currentUser ? <RFCodingForm /> : <Navigate to="/dashboard" />} />
              <Route path="/module/pcb-1ph" element={!currentUser ? <MainPCBCodingForm moduleType="PCB_1PH" user={null} title="Main PCB 1 Phase" /> : <Navigate to="/dashboard" />} />
              <Route path="/module/pcb-3ph" element={!currentUser ? <MainPCBCodingForm moduleType="PCB_3PH" user={null} title="Main PCB 3 Phase" /> : <Navigate to="/dashboard" />} />
              <Route path="/module/ltct" element={!currentUser ? <MainPCBCodingForm moduleType="LTCT" user={null} title="LTCT Coding Area" /> : <Navigate to="/dashboard" />} />
              <Route path="/module/operator-tracking" element={!currentUser ? <OperatorTrackingForm /> : <Navigate to="/dashboard" />} />
              <Route path="/observation" element={!currentUser ? <ProcessObservationForm /> : <Navigate to="/dashboard" />} />

              {/* CODING AREA DOCUMENTS ROUTES - Accessible to both public and logged in users */}
              <Route path="/module/rf-docs/process" element={<ProcessCheckSheet />} />
              <Route path="/module/rf-docs/rf-coding-check" element={<RFCodingCheckpointForm />} />
              <Route path="/module/rf-docs/rf-patrolling" element={<RFPatrollingSheet />} />
              <Route path="/module/rf-docs/main-pcb-patrolling" element={<MainPCBPatrollingSheet />} />
              <Route path="/module/rf-docs/reference" element={<ReferenceDocuments />} />

              <Route path="/login" element={!currentUser ? <LoginPage onLogin={login} /> : <Navigate to="/dashboard" />} />
              <Route path="/register" element={!currentUser ? <RegisterPage /> : <Navigate to="/dashboard" />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              <Route path="/dashboard" element={currentUser ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/reports" element={currentUser ? <Reports /> : <Navigate to="/login" />} />
              <Route path="/users" element={currentUser ? <UserManagement /> : <Navigate to="/login" />} />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
