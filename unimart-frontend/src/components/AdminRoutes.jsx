import { Navigate, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; 

const AdminRoute = () => {
  // 1. We use useContext and pass in your exported AuthContext
  const { user } = useContext(AuthContext);

  // 2. We removed the 'loading' check because your context reads instantly from localStorage.

  // 3. If there is no user, OR the user is not an 'admin', kick them out silently
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />; 
  }

  // 4. If they are an admin, let them see the hidden page!
  return <Outlet />;
};

export default AdminRoute;