import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes';
import { SocketProvider } from "./contexts/SocketContext";

const App: React.FC = () => (
  <AuthProvider>
    <SocketProvider>
      <Router>
        <AppRoutes />
      </Router>
    </SocketProvider>
  </AuthProvider>
);

export default App;
