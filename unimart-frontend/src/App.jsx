import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard'; 
import CanteenMenu from './pages/CanteenMenu'; // 🛡️ NEW: Import the Menu Page
import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import AdminRoute from './components/AdminRoutes';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          
          {/* Dashboard Route */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* 🛡️ NEW: Canteen Menu Route (Also protected!) */}
          <Route 
            path="/canteen/:id" 
            element={
              <ProtectedRoute>
                <CanteenMenu />
              </ProtectedRoute>
            } 
          />
          <Route element={<AdminRoute />}>
            {/* The secret URL you type into your browser */}
            <Route path="/hq-command" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;