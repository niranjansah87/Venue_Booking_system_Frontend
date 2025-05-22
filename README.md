# A One Cafe - Venue Booking System

## Project Overview

A One Cafe is a web application designed to streamline venue booking for events. Users can select event details, check availability, choose packages and menu items, calculate fares, and finalize bookings with OTP-based authentication. Built with Vite, React, Express, Node.js, MySQL, and Sequelize ORM, it offers a robust and scalable solution.

## Project Statement

The application enables users to create a booking by following these steps:

1. **Select Event Date**: Choose the event date.
2. **Select Event Type**: Pick an event type from the `events` table (`id`, `name`, `created_at`, `updated_at`).
3. **Enter Number of Guests**: Specify the number of attendees.
4. **Select Venue**: Choose a venue from the `venues` table (`id`, `name`, `image`, `capacity`, `created_at`, `updated_at`). The form displays the venue's name, image, and capacity.
5. **Select Shift**: Select a shift from the `shifts` table (`id`, `name`, `created_at`, `updated_at`).
6. **Check Availability**:
   - Logic: Checks confirmed bookings in the `bookings` table. If no confirmed bookings exist for the selected date, venue, and shift, the system indicates availability. If a booking exists, the user is prompted to select a different date, venue, or shift.
7. **Select Package**: Displays available packages from the `packages` table (`id`, `name`, `base_price`, `created_at`, `updated_at`), showing name and base price.
8. **Select Menu Items**:
   - Displays menus linked to the package from the `menus` table (`id`, `package_id`, `name`, `items`, `free_limit`, `created_at`, `updated_at`).
   - `items` is a JSON array of menu items with prices.
   - `free_limit` determines free items. Extra items beyond the limit incur additional costs.
   - Implemented using checkboxes.
9. **Check Fare**: Displays the total fare.
10. **Fare Calculation**:
    - Formula: `(package base_price + extra fare for items exceeding free_limit) * guest_count`.
11. **User Details and OTP Verification**:
    - Collects user's name and phone number.
    - Sends an OTP to the user's phone.
    - After OTP verification, creates a user account and saves booking details to the `bookings` table with `pending` status.
    - Admins can update booking status and manage details.

## Screenshots and Demo

- **Screenshot**:
  <img src="./readme/1.png" alt="A One Cafe Booking Interface" width="600" />

- **Video Demo**:
  <video width="600" controls>
    <source src="./readme/readme.mp4" type="video/mp4" />
    Your browser does not support the video tag.
  </video>

## Technologies Used

- **Frontend**: Vite, React
- **Backend**: Express, Node.js
- **Database**: MySQL with Sequelize ORM
- **Other**: OTP verification (e.g., Twilio or similar), JSON for menu items

## Database Schema

The application uses the following MySQL tables:

1. **events**
   ```sql
   CREATE TABLE events (
       id INT PRIMARY KEY AUTO_INCREMENT,
       name VARCHAR(255) NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );


venues
CREATE TABLE venues (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    image VARCHAR(255),
    capacity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


shifts
CREATE TABLE shifts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


packages
CREATE TABLE packages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


menus
CREATE TABLE menus (
    id INT PRIMARY KEY AUTO_INCREMENT,
    package_id INT,
    name VARCHAR(255) NOT NULL,
    items JSON NOT NULL,
    free_limit INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES packages(id)
);


bookings
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    event_id INT,
    venue_id INT,
    shift_id INT,
    package_id INT,
    guest_count INT NOT NULL,
    event_date DATE NOT NULL,
    total_fare DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (venue_id) REFERENCES venues(id),
    FOREIGN KEY (shift_id) REFERENCES shifts(id),
    FOREIGN KEY (package_id) REFERENCES packages(id)
);


users
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);



Setup Instructions
Prerequisites

Node.js (v16 or higher)
MySQL (v8 or higher)
Git

Installation

Clone the Repository
git clone https://github.com/yourusername/a-one-cafe.git
cd a-one-cafe


Install Dependencies

Backend:cd backend
npm install


Frontend:cd ../frontend
npm install




Configure Environment Variables

Backend .env:DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=a_one_cafe
PORT=5000
OTP_SERVICE_API_KEY=your_otp_service_key


Frontend .env:VITE_API_URL=http://localhost:5000/api




Set Up the Database

Create database:CREATE DATABASE a_one_cafe;


Run migrations (if using Sequelize):cd backend
npx sequelize-cli db:migrate


Or import the SQL schemas above.


Run the Application

Backend:cd backend
npm start


Frontend:cd frontend
npm run dev


Access at http://localhost:5173.



Features

Booking Flow: Step-by-step interface for event details, venues, shifts, packages, and menus.
Availability Check: Prevents double-booking by validating confirmed bookings.
Fare Calculation: Computes total fare based on package, extra menu items, and guest count.
OTP Authentication: Secures user account creation with phone-based OTP.
Admin Management: Admins can update booking statuses and manage details.
Responsive Design: Works on desktop and mobile.

Usage

Go to the booking page.
Follow the steps: select event date, type, guest count, venue, shift; check availability; choose package and menu; review fare; enter name and phone, verify OTP, and submit.
Admins can manage bookings via the admin dashboard.

Contributing

Fork the repository.
Create a feature branch (git checkout -b feature/your-feature).
Commit changes (git commit -m 'Add your feature').
Push to the branch (git push origin feature/your-feature).
Open a pull request.

License
MIT License. See LICENSE.
Contact
For support, contact your.email@example.com or open a GitHub issue.```
