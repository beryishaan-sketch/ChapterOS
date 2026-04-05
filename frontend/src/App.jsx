import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import InstallPrompt from './components/InstallPrompt';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Recruitment from './pages/Recruitment';
import Events from './pages/Events';
import GuestList from './pages/GuestList';
import Dues from './pages/Dues';
import Members from './pages/Members';
import Attendance from './pages/Attendance';
import Settings from './pages/Settings';
import Billing from './pages/Billing';
import Import from './pages/Import';
import Announcements from './pages/Announcements';
import Leaderboard from './pages/Leaderboard';
import Analytics from './pages/Analytics';
import Polls from './pages/Polls';
import CheckIn from './pages/CheckIn';
import Sponsors from './pages/Sponsors';
import Budget from './pages/Budget';
import RiskManagement from './pages/RiskManagement';
import Profile from './pages/Profile';
import Documents from './pages/Documents';
import More from './pages/More';
import Academics from './pages/Academics';
import Reports from './pages/Reports';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import SetPassword from './pages/SetPassword';
import BidVoting from './pages/BidVoting';
import Channels from './pages/Channels';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen gradient-navy flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-white/60 text-sm font-medium">Loading ChapterOS…</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
      </Route>
      <Route path="/recruitment" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Recruitment />} />
      </Route>
      <Route path="/events" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Events />} />
      </Route>
      <Route path="/events/:id/guests" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<GuestList />} />
      </Route>
      <Route path="/guests" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<GuestList />} />
      </Route>
      <Route path="/dues" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dues />} />
      </Route>
      <Route path="/members" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Members />} />
      </Route>
      <Route path="/attendance" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Attendance />} />
      </Route>
      <Route path="/settings" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Settings />} />
      </Route>
      <Route path="/billing" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Billing />} />
      </Route>
      <Route path="/import" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Import />} />
      </Route>
      <Route path="/announcements" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Announcements /> } />
      </Route>
      <Route path="/leaderboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Leaderboard /> } />
      </Route>
      <Route path="/analytics" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Analytics /> } />
      </Route>
      <Route path="/polls" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Polls /> } />
      </Route>
      <Route path="/checkin" element={<CheckIn />} />
      <Route path="/sponsors" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Sponsors />} />
      </Route>
      <Route path="/budget" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Budget />} />
      </Route>
      <Route path="/risk" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<RiskManagement />} />
      </Route>
      <Route path="/profile" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Profile />} />
      </Route>
      <Route path="/documents" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Documents />} />
      </Route>
      <Route path="/academics" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Academics />} />
      </Route>
      <Route path="/reports" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Reports />} />
      </Route>
      <Route path="/bid-voting" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<BidVoting />} />
      </Route>
      <Route path="/more" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<More />} />
      </Route>
      <Route path="/channels" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Channels />} />
      </Route>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    <InstallPrompt />
    </>
  );
}

export default App;
