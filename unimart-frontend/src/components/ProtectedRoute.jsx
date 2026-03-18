import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token, user } = useContext(AuthContext);

  // If there is no token or user data, kick them back to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the protected component
  return children;
};

export default ProtectedRoute;