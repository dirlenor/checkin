import { Routes, Route, Navigate } from 'react-router-dom';
import Summary from '../pages/Summary';
import { checkSpecialAccess } from '../auth/authUtils';
import { useAuth } from '../auth/AuthContext';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  
  if (!user || !checkSpecialAccess(user.email)) {
    return <Navigate to="/" />;
  }
  
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* existing routes */}
      
      <Route 
        path="/summary" 
        element={
          <PrivateRoute>
            <Summary />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
} 