import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import DateSelection from './steps/DateSelection';
import EventTypeSelection from './steps/EventTypeSelection';
import GuestCount from './steps/GuestCount';
import VenueSelection from './steps/VenueSelection';
import ShiftSelection from './steps/ShiftSelection';
import PackageSelection from './steps/PackageSelection';
import MenuSelection from './steps/MenuSelection';
import FareSummary from './steps/FareSummary';
import OtpVerification from './steps/OtpVerification';
import BookingConfirmation from './steps/BookingConfirmation';
import api from '../../services/api';
import { showToast } from '../../utils/toastUtils';
import { CheckCircle } from 'lucide-react';

const steps = [
  {
    id: 'event-details',
    title: 'Event Details',
    components: [DateSelection, EventTypeSelection, GuestCount, VenueSelection, ShiftSelection],
  },
  {
    id: 'package-menu',
    title: 'Package & Menu',
    components: [PackageSelection, MenuSelection],
  },
  {
    id: 'fare',
    title: 'Fare Summary',
    components: [FareSummary],
  },
  {
    id: 'verification-confirmation',
    title: 'Verification & Confirmation',
    components: [OtpVerification, BookingConfirmation],
  },
];

const OTP_STEP_ID = 'verification-confirmation';

const BookingWizard = () => {
  const navigate = useNavigate();
  const { user, sendOtp, verifyOtp, sendConfirmation } = useAuth();

  // Memoize components
  const MemoizedComponents = useMemo(
    () =>
      steps.reduce((acc, step) => {
        step.components.forEach((Component) => {
          acc[Component.name] = memo(Component);
        });
        return acc;
      }, {}),
    []
  );

  const getInitialUserData = useCallback(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser.id || !parsedUser.email || !parsedUser.name) {
          throw new Error('Invalid user data in localStorage');
        }
        return {
          id: parsedUser.id || null,
          name: parsedUser.name || '',
          email: parsedUser.email || '',
          phone: parsedUser.phone || '',
        };
      } catch (error) {
        localStorage.removeItem('user');
        return { id: null, name: '', email: '', phone: '' };
      }
    }
    return { id: null, name: '', email: '', phone: '' };
  }, []);

  const initialUserData = useMemo(() => getInitialUserData(), [getInitialUserData]);

  const [currentStep, setCurrentStep] = useState(0);
  const [bookingData, setBookingData] = useState({
    date: null,
    event_id: null,
    guestCount: 50,
    venueId: null,
    shiftId: null,
    packageId: null,
    selectedMenus: {},
    baseFare: 0,
    extraCharges: 0,
    totalFare: 0,
    name: user?.name || initialUserData.name,
    email: user?.email || initialUserData.email,
    phone: user?.phone || initialUserData.phone,
  });
  const [isAvailable, setIsAvailable] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Memoize bookingData
  const memoizedBookingData = useMemo(() => ({ ...bookingData }), [bookingData]);

  // Check if current step is complete
  const isStepComplete = useCallback(() => {
    const stepId = steps[currentStep].id;
    if (stepId === 'event-details') {
      return (
        bookingData.date &&
        bookingData.event_id &&
        bookingData.guestCount &&
        bookingData.shiftId &&
        bookingData.venueId &&
        isAvailable
      );
    }
    if (stepId === 'package-menu') {
      return bookingData.packageId && Object.keys(bookingData.selectedMenus).length > 0;
    }
    if (stepId === 'fare') {
      return bookingData.totalFare > 0;
    }
    if (stepId === 'verification-confirmation') {
      return isComplete;
    }
    return false;
  }, [currentStep, bookingData, isAvailable, isComplete]);

  // Sync bookingData with user changes
  useEffect(() => {
    if (user) {
      setBookingData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    } else {
      setBookingData((prev) => ({
        ...prev,
        email: initialUserData.email,
        phone: initialUserData.phone,
      }));
    }
  }, [user, initialUserData]);

  const updateBookingData = useCallback((key, value) => {
    setBookingData((prev) => {
      const newData = { ...prev, [key]: value };
      if (key === 'venueId' || key === 'shiftId') {
        setIsAvailable(false);
      }
      if (['packageId', 'selectedMenus', 'guestCount'].includes(key)) {
        return { ...newData, baseFare: 0, extraCharges: 0, totalFare: 0 };
      }
      return newData;
    });
  }, []);

  const checkAvailability = useCallback(async () => {
    const { date, venueId, shiftId, event_id, guestCount } = bookingData;
    if (!date || !venueId || !shiftId || !event_id || !guestCount) {
      showToast('Please select all required fields.', { type: 'error' });
      return;
    }
    setIsCheckingAvailability(true);
    try {
      const formattedDate = date.toISOString().split('T')[0];
      await api.post('/api/admin/bookings/check-availability', {
        event_id,
        venue_id: venueId,
        shift_id: shiftId,
        event_date: formattedDate,
        guest_count: guestCount,
      });
      setIsAvailable(true);
      showToast('Slot is available!', { type: 'success' });
    } catch (error) {
      showToast(error.response?.data?.message || 'Selected slot is not available.', {
        type: 'error',
      });
      throw error;
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [bookingData]);

  const calculateFare = useCallback(async () => {
    const { packageId, selectedMenus, guestCount } = bookingData;
    if (!packageId || !guestCount) {
      showToast('Please select a package and guest count.', { type: 'error' });
      return;
    }
    setIsCalculating(true);
    try {
      const response = await api.post('/api/admin/bookings/calculate-fare', {
        package_id: packageId,
        selected_menus: selectedMenus,
        guest_count: guestCount,
      });
      const { base_fare, extra_charges, total_fare } = response.data;
      setBookingData((prev) => ({
        ...prev,
        baseFare: base_fare,
        extraCharges: extra_charges,
        totalFare: total_fare,
      }));
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to calculate fare.', { type: 'error' });
      throw error;
    } finally {
      setIsCalculating(false);
    }
  }, [bookingData]);

  const handleVerifyOtp = useCallback(
    async (otp) => {
      setSubmitting(true);
      try {
        await verifyOtp(otp);
        const requiredFields = [
          'date',
          'event_id',
          'venueId',
          'shiftId',
          'packageId',
          'guestCount',
          'name',
          'email',
          'phone',
        ];
        const missingFields = requiredFields.filter(
          (field) => !bookingData[field] || bookingData[field] === null
        );
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
        if (!user?.id) {
          throw new Error('User ID not found. Please log in again.');
        }
        const payload = {
          user_id: user.id,
          event_id: bookingData.event_id,
          venue_id: bookingData.venueId,
          shift_id: bookingData.shiftId,
          package_id: bookingData.packageId,
          guest_count: bookingData.guestCount,
          event_date: bookingData.date.toISOString().split('T')[0],
          selected_menus: bookingData.selectedMenus,
          customer_name: bookingData.name,
          customer_email: bookingData.email,
          customer_phone: bookingData.phone,
          base_fare: bookingData.baseFare,
          extra_charges: bookingData.extraCharges,
          total_fare: bookingData.totalFare,
        };
        const response = await api.post('/api/admin/bookings/store', payload);
        setBookingId(response.data.bookingId);
        await sendConfirmation(response.data.bookingId, bookingData.email);
        setIsComplete(true);
        setCurrentStep(currentStep);
      } catch (error) {
        const errorMessage =
          error.response?.data?.errors?.map((err) => err.msg).join(', ') ||
          error.response?.data?.message ||
          error.message ||
          'Failed to store booking.';
        showToast(errorMessage, { type: 'error' });
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [verifyOtp, user, bookingData, sendConfirmation, currentStep]
  );

  const sendOtpCallback = useCallback(
    async (email) => {
      return await sendOtp(email);
    },
    [sendOtp]
  );

  const handleNext = useCallback(() => {
    if (!isStepComplete()) {
      showToast('Please complete all required fields.', { type: 'error' });
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, isStepComplete]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/');
    }
  }, [currentStep, navigate]);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-heading font-bold text-gray-900 mb-10 text-center">Plan Your Event</h1>

      <div className="mb-12">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <div key={step.id} className="flex-1 text-center">
              <div
                className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  index <= currentStep ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              <p
                className={`mt-3 text-sm font-medium ${
                  index <= currentStep ? 'text-primary-600' : 'text-gray-500'
                }`}
              >
                {step.title}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 relative">
          <div className="absolute top-1/2 w-full h-1 bg-gray-200 transform -translate-y-1/2"></div>
          <div
            className="absolute top-1/2 h-1 bg-primary-600 transition-all duration-300 transform -translate-y-1/2"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      <motion.div
        key={`step-${currentStep}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-xl shadow-lg p-8"
      >
        {steps[currentStep].id === 'event-details' && (
          <div className="flex flex-col gap-8">
            {steps[currentStep].components.map((Component) => {
              const ComponentMemo = MemoizedComponents[Component.name];
              return (
                <motion.div
                  key={Component.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <ComponentMemo
                    date={memoizedBookingData.date}
                    event_id={memoizedBookingData.event_id}
                    guestCount={memoizedBookingData.guestCount}
                    venueId={memoizedBookingData.venueId}
                    shiftId={memoizedBookingData.shiftId}
                    updateBookingData={updateBookingData}
                    isAvailable={isAvailable}
                    checkAvailability={checkAvailability}
                    isCheckingAvailability={isCheckingAvailability}
                  />
                  {Component.name === 'DateSelection' && bookingData.date && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-4 right-4"
                    >
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </motion.div>
                  )}
                  {Component.name === 'EventTypeSelection' && bookingData.event_id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-4 right-4"
                    >
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </motion.div>
                  )}
                  {Component.name === 'GuestCount' && bookingData.guestCount && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-4 right-4"
                    >
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </motion.div>
                  )}
                  {Component.name === 'VenueSelection' && bookingData.venueId && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-4 right-4"
                    >
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </motion.div>
                  )}
                  {Component.name === 'ShiftSelection' && bookingData.shiftId && isAvailable && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-4 right-4"
                    >
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
        {steps[currentStep].id === 'package-menu' && (
          <div className="flex flex-col gap-8">
            {steps[currentStep].components.map((Component) => {
              const ComponentMemo = MemoizedComponents[Component.name];
              return (
                <motion.div
                  key={Component.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <ComponentMemo
                    packageId={memoizedBookingData.packageId}
                    selectedMenus={memoizedBookingData.selectedMenus}
                    updateBookingData={updateBookingData}
                  />
                  {Component.name === 'PackageSelection' && bookingData.packageId && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-4 right-4"
                    >
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </motion.div>
                  )}
                  {Component.name === 'MenuSelection' && Object.keys(bookingData.selectedMenus).length > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-4 right-4"
                    >
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
        {steps[currentStep].id === 'fare' && (
          <div>
            {steps[currentStep].components.map((Component) => {
              const ComponentMemo = MemoizedComponents[Component.name];
              return (
                <ComponentMemo
                  key={Component.name}
                  baseFare={memoizedBookingData.baseFare}
                  extraCharges={memoizedBookingData.extraCharges}
                  totalFare={memoizedBookingData.totalFare}
                  calculateFare={calculateFare}
                  isCalculating={isCalculating}
                />
              );
            })}
          </div>
        )}
       {steps[currentStep].id === 'verification-confirmation' && (
  <div>
    {isComplete ? (() => {
      const ConfirmationComponent = MemoizedComponents[BookingConfirmation.name];
      return (
        <ConfirmationComponent
          bookingId={bookingId}
          date={memoizedBookingData.date}
          guestCount={memoizedBookingData.guestCount}
          totalFare={memoizedBookingData.totalFare}
          email={memoizedBookingData.email}
        />
      );
    })() : (() => {
      const OtpComponent = MemoizedComponents[OtpVerification.name];
      return (
        <OtpComponent
          email={memoizedBookingData.email}
          verifyOtp={handleVerifyOtp}
          submitting={submitting}
          updateBookingData={updateBookingData}
          sendOtp={sendOtpCallback}
        />
      );
    })()}
  </div>
)}

      </motion.div>

      {currentStep < steps.length - 1 && (
        <div className="mt-10 flex justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
          >
            Back
          </motion.button>
          {isStepComplete() && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium"
            >
              Next
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(BookingWizard);