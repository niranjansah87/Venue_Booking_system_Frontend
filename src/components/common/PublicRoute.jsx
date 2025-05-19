import React from 'react';
import { Navigate } from 'react-router-dom';

function PublicRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('user')); // Get user from localStorage

  // Check if the user is already logged in, and redirect to the dashboard if logged in
  if (user) {
    return <Navigate to="/aonecafe/admin/dashboard" replace />; 
  }

  return children; // Return the public content if user is not logged in
}

export default PublicRoute;
