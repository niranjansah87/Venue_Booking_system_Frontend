// AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (!userData.id || !userData.email || !userData.name) {
            console.error('Invalid user data in localStorage:', userData);
            localStorage.removeItem('user');
            setUser(null);
          } else {
            setUser(userData);
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = async (email, password, redirect = true) => {
    try {
      const response = await api.post('/api/login', { email, password });
      const { user } = response.data;
      if (!user || typeof user !== 'object') {
        throw new Error('No user data received from server');
      }
      if (!user.id || !user.email || !user.name) {
        throw new Error('User data missing required fields (id, email, name)');
      }
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      toast.success('Logged in successfully!');
      if (redirect) {
        navigate('/booking');
      }
      return user;
    } catch (error) {
      console.error('Error logging in:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please check your credentials.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    toast.success('Logged out successfully!');
  };

  const sendOtp = async (email, phone) => {
    try {
      if (!phone) {
        throw new Error('Phone number is required');
      }
      const response = await api.post('/api/admin/book/send-otp', { email, phone });
      toast.success('OTP sent to your email and phone!', { toastId: 'otp-sent' });
      return response.data;
    } catch (error) {
      console.error('Error sending OTP:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send OTP';
      toast.error(errorMessage, { toastId: 'otp-error' });
      throw new Error(errorMessage);
    }
  };

  const verifyOtp = async (otp) => {
    try {
      const response = await api.post('/api/admin/book/verify-otp', { otp });
      toast.success('OTP verified successfully!', { toastId: 'otp-verified' });
      return response.data;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      const errorMessage = error.response?.data?.message || 'Invalid OTP';
      toast.error(errorMessage, { toastId: 'otp-invalid' });
      throw new Error(errorMessage);
    }
  };

  const sendConfirmation = async (bookingId, email, phone) => {
    try {
      await api.post('/api/admin/book/send-confirmation', { bookingId, email, phone });
      toast.success('Confirmation email and SMS sent!', { toastId: 'confirmation-sent' });
    } catch (error) {
      console.error('Error sending confirmation:', error);
      toast.error(error.response?.data?.message || 'Failed to send confirmation.', {
        toastId: 'confirmation-error',
      });
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ user, login, logout, sendOtp, verifyOtp, sendConfirmation, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);