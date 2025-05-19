import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Clock, PartyPopper, Package } from 'lucide-react';
import { getUserBookings } from '../../services/bookingService';

const UserBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  const userId = user?.id;

  useEffect(() => {
    const fetchBookings = async () => {
      if (!userId) {
        setError('User not logged in');
        setLoading(false);
        return;
      }

      try {
        const response = await getUserBookings(userId);
        const bookingsData =
          response.bookings ||
          response.data ||
          response.results ||
          response.items ||
          response ||
          [];

        const finalBookings = (Array.isArray(bookingsData) ? bookingsData : []).map((booking) => ({
          id: booking.id || null,
          event: String(booking.event?.name || booking.event_type?.name || booking.event || 'N/A'),
          venue_name: String(booking.venue?.name || booking.venue_name || booking.venue || 'N/A'),
          package: String(booking.package?.name || booking.package_name?.name || booking.package || 'N/A'),
          event_date: booking.event_date || booking.date || '',
          shift_name: String(booking.shift?.name || booking.shift_name || booking.shift || 'N/A'),
          guest_count: booking.guest_count || booking.guests || 0,
          status: booking.status || 'pending',
        }));

        setBookings(finalBookings);
        setLoading(false);
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch bookings';
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchBookings();
  }, [userId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center bg-gray-100">
        <h2 className="text-2xl font-bold text-red-600">Error</h2>
        <p className="text-gray-600">{error}</p>
        <Link
          to="/"
          className="mt-4 inline-block px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-zinc-200 min-h-screen pt-24 px-4">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-10 text-center">My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="text-center py-16 bg-teal-50 rounded-lg shadow-lg">
            <img
              src="/no-bookings.png"
              alt="No Bookings"
              className="mx-auto h-64 w-64 object-cover mb-6"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/256';
              }}
            />
            <h2 className="text-3xl font-semibold text-teal-800 mb-3">No Bookings Yet!</h2>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              It looks like you haven’t booked any venues. Explore our venues and start planning your event today!
            </p>
            <Link
              to="/booking"
              className="inline-block px-8 py-4 bg-teal-600 text-white text-lg font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-md"
            >
              Book a Venue Now
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-lg border border-teal-100">
              <thead className="bg-teal-600 text-white">
                <tr>
                  <th className="py-4 px-6 text-center text-base font-bold w-1/6">Event</th>
                  <th className="py-4 px-6 text-center text-base font-bold w-1/4">Venue</th>
                  <th className="py-4 px-6 text-center text-base font-bold w-1/6">Package</th>
                  <th className="py-4 px-6 text-center text-base font-bold w-1/6">Date</th>
                  <th className="py-4 px-6 text-center text-base font-bold w-1/6">Shift</th>
                  <th className="py-4 px-6 text-center text-base font-bold w-1/6">Guests</th>
                  <th className="py-4 px-6 text-center text-base font-bold w-1/6">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, index) => (
                  <tr
                    key={booking.id}
                    className={`border-b border-teal-100 hover:bg-teal-100 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-teal-50'
                    }`}
                  >
                    <td className="py-4 px-6 text-gray-600 text-base text-center">
                      <div className="flex items-center justify-center">
                        <PartyPopper className="w-5 h-5 mr-2 text-teal-600" />
                        {booking.event}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-800 text-base text-center">{booking.venue_name}</td>
                    <td className="py-4 px-6 text-gray-600 text-base text-center">
                      <div className="flex items-center justify-center">
                        <Package className="w-5 h-5 mr-2 text-teal-600" />
                        {booking.package}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600 text-base text-center">
                      <div className="flex items-center justify-center">
                        <Calendar className="w-5 h-5 mr-2 text-teal-600" />
                        {formatDate(booking.event_date)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600 text-base text-center">
                      <div className="flex items-center justify-center">
                        <Clock className="w-5 h-5 mr-2 text-teal-600" />
                        {booking.shift_name}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600 text-base text-center">
                      <div className="flex items-center justify-center">
                        <Users className="w-5 h-5 mr-2 text-teal-600" />
                        {booking.guest_count}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : booking.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserBookingsPage;
