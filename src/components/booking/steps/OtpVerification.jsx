import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mail, Loader, User, Lock, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../../contexts/AuthContext';
import { showToast } from '../../../utils/toastUtils';
import { Link } from 'react-router-dom';

const OtpVerification = ({ verifyOtp, submitting, updateBookingData, bookingData = {} }) => {
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [error, setError] = useState(null);
  const [emailExists, setEmailExists] = useState(false);
  const { user, sendOtp, loginUser } = useAuth();
  const hasSentOtp = useRef(false);
  const hasCreatedBooking = useRef(false);
  const hasShownToast = useRef(false);
  const mountCount = useRef(0);
  const phoneRef = useRef(null);
  const hasInitializedBookingData = useRef(false); // Prevent multiple initializations

  // Signup form
  const {
    register,
    handleSubmit,
    formState: { errors: signupErrors },
    watch,
    reset,
  } = useForm();
  const signupPassword = watch('password');

  // Local email state for non-logged-in users after signup
  const [localEmail, setLocalEmail] = useState('');

  // Initialize bookingData only once
  useEffect(() => {
    if (
      !hasInitializedBookingData.current &&
      (!bookingData || Object.keys(bookingData).length === 0)
    ) {
      console.log('Initializing bookingData');
      updateBookingData('init', {
        email: user?.email || '',
        phone: user?.phone || '',
        customer_phone: user?.phone || '',
        user_id: user?.id || null,
        event_date: '2025-06-01', // Replace with actual data
        event_id: 1, // Replace with actual data
        guest_count: 50, // Replace with actual data
        venue_id: 1, // Replace with actual data
        shift_id: 1, // Replace with actual data
        package_id: 1, // Replace with actual data
        selected_menus: {}, // Replace with actual data
        base_fare: 1000, // Replace with actual data
        extra_charges: 0, // Replace with actual data
        total_fare: 1000, // Replace with actual data
      });
      hasInitializedBookingData.current = true;
    }
  }, [bookingData, updateBookingData, user]);

  // Debug user state
  useEffect(() => {
    console.log('OtpVerification: user state:', {
      user,
      isLoggedIn: !!user,
      localEmail,
      bookingData,
      phoneRef: phoneRef.current,
    });
  }, [user, localEmail, bookingData]);

  // Sync bookingData with user and phoneRef
  useEffect(() => {
    if (localEmail && phoneRef.current) {
      updateBookingData('email', localEmail);
      updateBookingData('phone', phoneRef.current);
      updateBookingData('customer_phone', phoneRef.current);
    } else if (user?.email && (user?.phone || phoneRef.current)) {
      updateBookingData('email', user.email);
      updateBookingData('phone', user.phone || phoneRef.current);
      updateBookingData('customer_phone', user.phone || phoneRef.current);
      updateBookingData('user_id', user.id);
    }
  }, [localEmail, user, updateBookingData]);

  // Reset localEmail when user is null
  useEffect(() => {
    if (!user && localEmail) {
      console.log('OtpVerification: Resetting localEmail as user is null');
      setLocalEmail('');
      updateBookingData('email', '');
      updateBookingData('phone', '');
      updateBookingData('customer_phone', '');
    }
  }, [user, localEmail, updateBookingData]);

  // Debounce sendOtp to prevent rapid calls
  const debounceSendOtp = useCallback((fn) => {
    let timeout;
    return (...args) => {
      if (!timeout) {
        timeout = setTimeout(() => {
          fn(...args);
          timeout = null;
        }, 100);
      }
    };
  }, []);

  const sendOtpToEmail = useCallback(
    debounceSendOtp(async (targetEmail, targetPhone) => {
      if (!targetEmail || !targetPhone || !/^\d{10}$/.test(targetPhone)) {
        console.log('Skipping OTP send: Invalid email or phone', { targetEmail, targetPhone });
        setError('A valid email and 10-digit phone number are required.');
        showToast('Invalid email or phone number.', { toastId: 'otp-error', type: 'error' });
        return;
      }
      if (isOtpSent || sendingOtp || hasSentOtp.current) {
        console.log('Skipping OTP send:', {
          targetEmail,
          targetPhone,
          isOtpSent,
          sendingOtp,
          hasSentOtp: hasSentOtp.current,
        });
        return;
      }
      try {
        setSendingOtp(true);
        console.log('Sending OTP to:', { email: targetEmail, phone: targetPhone });
        const response = await sendOtp(targetEmail, targetPhone);
        console.log('OTP send response:', response);
        hasSentOtp.current = true;
        setIsOtpSent(true);
        phoneRef.current = targetPhone;
        updateBookingData('phone', targetPhone);
        updateBookingData('customer_phone', targetPhone);
        if (!hasShownToast.current) {
          console.log('Triggering toast for OTP sent');
          showToast('OTP sent to your email and phone.', {
            toastId: 'otp-sent',
            autoClose: 5000,
            type: 'success',
          });
          hasShownToast.current = true;
        }
      } catch (error) {
        console.error('Error sending OTP:', error);
        setError('Failed to send OTP.');
        showToast('Failed to send OTP.', { toastId: 'otp-error', type: 'error' });
      } finally {
        setSendingOtp(false);
      }
    }),
    [isOtpSent, sendingOtp, sendOtp, updateBookingData]
  );

  // Send OTP on mount
  useEffect(() => {
    mountCount.current += 1;
    console.log(`OtpVerification mounted ${mountCount.current} times, email: ${localEmail || user?.email}, phone: ${bookingData?.phone || phoneRef.current}`);

    if ((user || localEmail) && !isOtpSent) {
      const phone = bookingData?.phone || user?.phone || phoneRef.current;
      if (!phone || !/^\d{10}$/.test(phone)) {
        console.error('Phone number is missing or invalid:', phone);
        setError('A valid 10-digit phone number is required.');
        return;
      }
      sendOtpToEmail(localEmail || user?.email, phone);
    }

    return () => {
      console.log('OtpVerification unmounting');
    };
  }, [sendOtpToEmail, user, localEmail, isOtpSent, bookingData]);

  // Create booking after OTP verification
  const createBooking = async (bookingData) => {
    if (hasCreatedBooking.current) {
      console.log('Skipping duplicate booking creation');
      return;
    }
    hasCreatedBooking.current = true;
    try {
      const requiredFields = [
        'user_id',
        'event_date',
        'event_id',
        'guest_count',
        'venue_id',
        'shift_id',
        'package_id',
        'selected_menus',
        'base_fare',
        'extra_charges',
        'total_fare',
        'customer_phone',
      ];
      const missingFields = requiredFields.filter((field) => !bookingData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      if (!/^\d{10}$/.test(bookingData.customer_phone)) {
        throw new Error('Phone number must be exactly 10 digits');
      }

      const payload = {
        user_id: bookingData.user_id || user?.id,
        event_date: bookingData.event_date,
        event_id: bookingData.event_id,
        guest_count: bookingData.guest_count,
        venue_id: bookingData.venue_id,
        shift_id: bookingData.shift_id,
        package_id: bookingData.package_id,
        selected_menus: bookingData.selected_menus,
        base_fare: bookingData.base_fare,
        extra_charges: bookingData.extra_charges,
        total_fare: bookingData.total_fare,
        customer_phone: bookingData.customer_phone,
      };

      console.log('Creating booking with payload:', payload);
      const response = await fetch('https://noded.harshchaudhary.com.np/api/bookings/store', { // Changed to non-admin endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Booking creation failed:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to create booking');
      }

      const result = await response.json();
      console.log('Booking created successfully:', result);
      return result;
    } catch (error) {
      console.error('Booking creation error:', error);
      throw error;
    }
  };

  // Handle signup and auto-login
  const onSignup = async (data) => {
    try {
      console.log('OtpVerification: Submitting signup:', data);
      const signupResponse = await fetch('https://noded.harshchaudhary.com.np/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone,
        }),
        credentials: 'include',
      });

      if (!signupResponse.ok) {
        const errorData = await signupResponse.json();
        if (signupResponse.status === 409 || errorData.message.includes('already registered')) {
          setEmailExists(true);
          showToast(errorData.message || 'Email or phone number already exists.', {
            toastId: 'email-exists',
            type: 'error',
          });
          return;
        }
        throw new Error(errorData.message || 'Signup failed');
      }

      console.log('OtpVerification: Signup successful');
      await loginUser(data.email, data.password, false);
      updateBookingData('name', data.name);
      updateBookingData('phone', data.phone);
      updateBookingData('customer_phone', data.phone);
      updateBookingData('email', data.email);
      phoneRef.current = data.phone;
      setLocalEmail(data.email);
      reset();
      setEmailExists(false);
      setIsOtpSent(false);
      hasSentOtp.current = false;
      hasShownToast.current = false;
      showToast('Signup and login successful!', {
        toastId: 'signup-success',
        autoClose: 5000,
        type: 'success',
      });
    } catch (error) {
      console.error('OtpVerification: Error during signup or login:', error);
      if (!emailExists) {
        showToast(error.message || 'Signup or login failed. Please try again.', {
          toastId: 'signup-error',
          type: 'error',
        });
      }
    }
  };

  const handleOtpSubmit = async () => {
    try {
      setIsCreatingBooking(true);
      console.log('Verifying OTP:', otp);
      await verifyOtp(otp);
      console.log('OTP verified successfully');
      await createBooking(bookingData);
      showToast('Booking confirmed successfully.', { toastId: 'booking-success', type: 'success' });
    } catch (error) {
      console.error('OTP or booking error:', error);
      setError(error.message || 'Failed to verify OTP or create booking.');
      showToast(error.message || 'Failed to confirm booking.', {
        toastId: 'booking-error',
        type: 'error',
      });
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const handleResendOtp = async () => {
    hasSentOtp.current = false;
    hasShownToast.current = false;
    setIsOtpSent(false);
    const phone = bookingData?.phone || user?.phone || phoneRef.current;
    if (!phone || !/^\d{10}$/.test(phone)) {
      setError('A valid 10-digit phone number is required.');
      return;
    }
    await sendOtpToEmail(localEmail || user?.email, phone);
  };

  if (sendingOtp || isCreatingBooking) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !emailExists) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Signup form
  if (!user && !localEmail) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-heading font-semibold text-gray-800 mb-6">Confirm Booking</h2>
        <p className="text-gray-600 mb-8">
          Create an account to proceed with your booking. We'll send a verification OTP to your email and phone.
        </p>

        {emailExists && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md"
          >
            <p className="text-red-600">
              This email or phone number is already registered. Please{' '}
              <Link to="/login" className="text-primary-600 hover:underline">
                log in
              </Link>{' '}
              to continue.
            </p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSignup)} className="space-y-6 max-w-md mx-auto">
          <div>
            <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="signup-name"
                type="text"
                {...register('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'Name should be at least 2 characters' },
                })}
                className={`pl-10 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  signupErrors.name
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200'
                }`}
                placeholder="Enter your full name"
              />
            </div>
            {signupErrors.name && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-sm text-red-600"
              >
                {signupErrors.name.message}
              </motion.p>
            )}
          </div>
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="signup-email"
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: 'Enter a valid email address',
                  },
                })}
                className={`pl-10 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  signupErrors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200'
                }`}
                placeholder="Enter your email"
              />
            </div>
            {signupErrors.email && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-sm text-red-600"
              >
                {signupErrors.email.message}
              </motion.p>
            )}
          </div>
          <div>
            <label htmlFor="signup-phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="signup-phone"
                type="tel"
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: { value: /^\d{10}$/, message: 'Phone number must be exactly 10 digits' },
                })}
                className={`pl-10 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  signupErrors.phone
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200'
                }`}
                placeholder="Enter your phone number"
              />
            </div>
            {signupErrors.phone && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-sm text-red-600"
              >
                {signupErrors.phone.message}
              </motion.p>
            )}
          </div>
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="signup-password"
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  pattern: {
                    value: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#_\-+])[A-Za-z\d@$!%*?&^#_\-+]{8,}$/,
                    message:
                      'Password must include one uppercase letter, one number, and one special character (@$!%*?&^#_-+).',
                  },
                })}
                className={`pl-10 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  signupErrors.password
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200'
                }`}
                placeholder="Enter your password"
              />
            </div>
            {signupErrors.password && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-sm text-red-600"
              >
                {signupErrors.password.message}
              </motion.p>
            )}
          </div>
          <div>
            <label
              htmlFor="signup-confirm-password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="signup-confirm-password"
                type="password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === signupPassword || 'Passwords do not match',
                })}
                className={`pl-10 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  signupErrors.confirmPassword
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200'
                }`}
                placeholder="Confirm your password"
              />
            </div>
            {signupErrors.confirmPassword && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-sm text-red-600"
              >
                {signupErrors.confirmPassword.message}
              </motion.p>
            )}
          </div>
          <div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    );
  }

  // OTP form
  return (
    <div className="p-6">
      <h2 className="text-2xl font-heading font-semibold text-gray-800 mb-6">Verify Your Booking</h2>
      <p className="text-gray-600 mb-8">
        We've sent an OTP to {localEmail || user?.email} and your phone. Please enter it below to confirm your booking.
      </p>
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">OTP</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            placeholder="Enter OTP"
          />
        </div>
        <button
          onClick={handleOtpSubmit}
          disabled={submitting || isCreatingBooking || !otp}
          className={`w-full py-3 rounded-md transition-colors flex items-center justify-center ${
            submitting || isCreatingBooking || !otp
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {(submitting || isCreatingBooking) ? (
            <>
              <Loader className="animate-spin h-5 w-5 mr-2" />
              Verifying...
            </>
          ) : (
            'Verify OTP'
          )}
        </button>
        <div className="mt-4 text-center">
          <button
            onClick={handleResendOtp}
            disabled={sendingOtp}
            className="text-primary-600 hover:text-primary-700 disabled:text-gray-400"
          >
            Resend OTP
          </button>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 p-5 bg-primary-50 border border-primary-100 rounded-md flex items-start"
      >
        <Mail className="h-8 w-8 text-primary-500 mr-4 flex-shrink-0 mt-1" />
        <div>
          <p className="text-lg font-medium text-primary-800">OTP Sent</p>
          <p className="text-primary-600 mt-1">
            Check your email ({localEmail || user?.email}) and phone for the OTP.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default React.memo(OtpVerification);