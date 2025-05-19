import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, adminOnly = false }) {
  const user = JSON.parse(localStorage.getItem('user')); // Get user from localStorage

  // Check if the user is authenticated and if the route requires admin only
  if (!user || (adminOnly && user.role !== 'admin')) {
    return <Navigate to="/aonecafe/admin/login" replace />; 
  }

  return children; // Return the protected content if authenticated
}

export default ProtectedRoute;
