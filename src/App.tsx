import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Auth from './pages/Auth';
import Navbar from './components/Navbar';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-dark-bg text-zinc-100 font-sans selection:bg-brand-purple/30">
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="flex flex-col md:flex-row min-h-screen">
                    <Navbar />
                    <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/transactions" element={<Transactions />} />
                        <Route path="/budget" element={<Budget />} />
                        <Route path="*" element={<Navigate to="/" />} />
                      </Routes>
                    </main>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
