import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SignIn, SignUp } from '../components/auth';
import Dashboard from '../components/Dashboard';
import ChatContainer from '../components/chat/ChatContainer';
import ProtectedRoute from '../components/common/ProtectedRoute';
import SettingsPage from '../pages/SettingsPage';
const PlaceholderPage: React.FC<{
  title: string;
  message: string;
  backLink: string;
  backText: string;
}> = ({ title, message, backLink, backText }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}
  >
    <div
      style={{
        background: 'white',
        padding: '40px',
        borderRadius: '16px',
        textAlign: 'center',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      }}
    >
      <h2>{title}</h2>
      <p style={{ marginBottom: '20px' }}>{message}</p>
      <a href={backLink} style={{ color: '#1890ff', fontWeight: 600 }}>
        ← {backText}
      </a>
    </div>
  </div>
);

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/signin" replace />} />
    <Route path="/signin" element={<SignIn />} />
    <Route path="/signup" element={<SignUp />} />

    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />

    <Route
      path="/chat"
      element={
        <ProtectedRoute>
          <ChatContainer />
        </ProtectedRoute>
      }
    />
    <Route
      path="/chat/:chatId"
      element={
        <ProtectedRoute>
          <ChatContainer />
        </ProtectedRoute>
      }
    />

    <Route
      path="/settings"
      element={
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/forgot-password"
      element={
        <PlaceholderPage
          title="Forgot Password"
          message="This feature will be implemented soon!"
          backLink="/signin"
          backText="Back to Sign In"
        />
      }
    />

    <Route
      path="/terms"
      element={
        <PlaceholderPage
          title="Terms of Service"
          message="Terms and conditions will be displayed here."
          backLink="/signup"
          backText="Back to Sign Up"
        />
      }
    />

    <Route
      path="/privacy"
      element={
        <PlaceholderPage
          title="Privacy Policy"
          message="Privacy policy details will be displayed here."
          backLink="/signup"
          backText="Back to Sign Up"
        />
      }
    />

    <Route path="*" element={<Navigate to="/signin" replace />} />
  </Routes>
);

export default AppRoutes;
