# AeroKeep Flutter App Implementation Specification & Prompt

You are tasked with building a premium, production-ready Flutter mobile application called **AeroKeep** (a Predictive Vehicle Maintenance Platform). The application will replace/complement the existing React.js frontend dashboard and integrate seamlessly with the existing Node.js + Express + MongoDB REST API backend.

---

## 🛠️ Tech Stack & Dependencies

The Flutter app should be built with modern Dart/Flutter best practices, using a robust, clean, and testable architecture.

*   **State Management:** `flutter_riverpod` (using code generation via `riverpod_generator` if preferred, or standard Riverpod providers).
*   **Routing:** `go_router` for declarative navigation and nested shell routes (supporting a persistent Bottom Navigation Bar).
*   **Network Client:** `dio` for robust HTTP requests, handling cookies/headers, custom interceptors for automatic JWT refresh tokens, and global error handling.
*   **Secure Storage:** `flutter_secure_storage` to store JWT access tokens, refresh tokens, and user metadata securely.
*   **Charts & Visuals:** `fl_chart` or `community_charts_flutter` for high-performance, fluid analytics dashboards.
*   **Icons:** `lucide_icons` or standard `font_awesome_flutter` (to match the web dashboard’s visual language).
*   **Local Notifications:** `flutter_local_notifications` for notifying users of overdue service components or appointment alerts.

---

## 🎨 Design & Aesthetic Guidelines

AeroKeep must feel **premium, modern, and fluid**, matching the desktop glassmorphic design language.

### 1. Colors & Theme
*   **Typography:** Google Fonts: `Outfit` (for headings/scores) and `Inter` (for body copy/details).
*   **Core Brand Color:** Violet/Purple (`#8b5cf6` or `#7c3aed`).
*   **Light Theme:**
    *   Background: Clean slate/blue-gray gradient (`#F8FAFC` to `#F1F5F9`).
    *   Cards/Panels: Semi-transparent white (`rgba(255, 255, 255, 0.8)`) with subtle grey borders (`#E2E8F0`) and soft shadows.
    *   Text: Deep slate (`#0F172A`).
*   **Dark Theme:**
    *   Background: Very dark blue/slate (`#090D16`).
    *   Cards/Panels: Dark translucent slate (`#0F172A` / `#1E293B`) with thin borders (`#1E293B`).
    *   Text: Bright slate/silver (`#F8FAFC` / `#E2E8F0`).

### 2. UI Elements
*   **Glassmorphism:** Use `BackdropFilter` with `ImageFilter.blur(sigmaX: 10, sigmaY: 10)` to achieve beautiful glass-card styling.
*   **Micro-Animations:** Use `AnimatedContainer`, `Hero` transitions, and custom page transitions (`go_router` custom transition builders) for a tactile, responsive feel.
*   **Status Indicators:**
    *   **Healthy:** Emerald Green (`#10B981`)
    *   **Due Soon:** Amber/Orange (`#F59E0B`)
    *   **Overdue:** Crimson Red (`#EF4444`)

---

## 🧱 Application Architecture (Clean Architecture / Feature-First)

Organize the codebase by feature rather than layer to keep code modular and readable:

```text
lib/
├── config/
│   ├── theme.dart            # Dark/Light theme styles, fonts, and borders
│   ├── routes.dart           # GoRouter configuration & route guards
│   └── constants.dart        # API URLs, local storage keys, intervals
├── core/
│   ├── network/
│   │   ├── dio_client.dart   # Dio client with JWT Refresh interceptor
│   │   └── api_endpoints.dart
│   └── widgets/              # Global widgets (GlassCard, CustomButton, Shimmer)
├── features/
│   ├── auth/                 # Login, Register, Forgot/Reset Password
│   ├── dashboard/            # Health score gauge, system summaries, charts
│   ├── vehicles/             # Add/Edit/Delete & Detail views (Telemetry)
│   ├── service_logs/         # Log historical repairs and general maintenance
│   ├── appointments/         # Book, Reschedule, or Cancel service slots
│   ├── notifications/        # System alerts, custom notifications
│   ├── analytics/            # Dynamic charts (cost, lifecycle, trends)
│   └── profile/              # User settings, change password, dark mode switch
└── main.dart                 # App setup, Riverpod initialization
```

---

## ⚡ Backend REST API Integration Requirements

The client needs to interact with the existing REST APIs.
> [!IMPORTANT]
> When running the backend on `localhost:5000`:
> *   **Android Emulator:** Connect to the backend using `http://10.0.2.2:5000`
> *   **iOS Simulator:** Connect to the backend using `http://127.0.0.1:5000`
> Ensure the base URL is configurable (e.g., via environment variables or a configuration page).

### Endpoint Reference Sheet:

#### 1. Authentication (`/api/auth`)
*   `POST /register` - Register a standard user (name, email, password).
*   `POST /login` - Login with credentials, return JWT Access Token and User object.
*   `POST /refresh` - Refresh the access token when expired.
*   `POST /logout` - Revoke current user session.
*   `GET /me` - Get current logged-in user profile.
*   `PUT /me` - Update current user profile.
*   `PUT /changepassword` - Change account password.
*   `POST /forgotpassword` - Request a password reset email token.
*   `PUT /resetpassword/:resettoken` - Reset password using token.

#### 2. Vehicles (`/api/vehicles`)
*   `GET /` - Fetch all vehicles belonging to the user.
*   `GET /:id` - Get specific vehicle details, including composite health score and prediction data.
*   `POST /` - Add a new vehicle (registration number, manufacturer, model, year, fuelType, purchaseDate, currentOdometer, vehicleType).
*   `PUT /:id` - Update vehicle profile or mileage.
*   `DELETE /:id` - Delete a vehicle record.
*   `POST /:id/telemetry` - Update vehicle odometer/telemetry data directly.

#### 3. Service Records (`/api/services`)
*   `GET /` - List all service logs.
*   `GET /vehicle/:vehicleId` - Fetch all service logs for a specific vehicle.
*   `POST /` - Log a new service record (vehicleId, serviceDate, odometerReading, serviceCategory, serviceDescription, cost, serviceCenter).
*   `PUT /:id` - Update an existing service record.
*   `DELETE /:id` - Delete a service record.

#### 4. Appointments (`/api/appointments`)
*   `GET /` - Fetch active appointments.
*   `POST /` - Schedule a service slot (vehicleId, serviceCategory, appointmentDate).
*   `PUT /:id/reschedule` - Update appointment date/time.
*   `PUT /:id/cancel` - Cancel appointment.
*   `PUT /:id/status` (Admin only) - Update status (Pending, Approved, Rejected, Completed).

#### 5. Notifications (`/api/notifications`)
*   `GET /` - Fetch notifications.
*   `PUT /read-all` - Mark all notifications as read.
*   `PUT /:id/read` - Mark a single notification as read.
*   `DELETE /:id` - Delete a notification.

#### 6. Analytics (`/api/analytics`)
*   `GET /dashboard` - Fetch aggregated analytics (monthly cost, category cost breakdowns, upcoming alerts).

#### 7. Admin Features (`/api/admin`)
*   `GET /users` - List all platform users.
*   `PUT /users/:id/role` - Toggle user roles between Admin and User.
*   `DELETE /users/:id` - Remove users from the system.
*   `GET /stats` - Admin-only system overview dashboard statistics.

---

## 📱 Detailed Screen Spec & Requirements

### 1. Welcome & Auth Screens (Login / Register / Forgot & Reset Password)
*   **Design:** Deep, glowing violet/dark background overlayed with clean text inputs.
*   **Validation:** Inline client-side validations for email formatting and password strength.
*   **State:** After login, save the JWT Access Token in secure storage, load User Profile state, and route the user to the Main Shell.

### 2. Main Shell (Dynamic Dashboard & Bottom Navigation)
*   Provides a persistent Bottom Navigation Bar with options: **Dashboard**, **Vehicles**, **Appointments**, **Analytics**, and **Profile**.
*   **Dashboard View:**
    *   **User Header:** Greet user, show notifications icon with a badge showing unread notifications count.
    *   **Overall Health Score Widget:** A circular radial gauge (from `fl_chart` or custom painter) showing composite health score (0–100) based on all vehicles.
    *   **Quick Summary Grid:** Small cards showing number of active vehicles, overdue items, scheduled appointments, and pending repairs.
    *   **Dynamic Prediction Alerts:** Scrollable banner list displaying any components marked **Overdue** or **Due Soon** for the active vehicles.

### 3. Vehicles Directory & Add/Edit Form
*   **Vehicles List Screen:**
    *   Grid or list of vehicles. Each vehicle card should show vehicle logo/type icon, year, odometer, and its overall Health Score gauge.
    *   Floating Action Button to "Add Vehicle" showing a clean multi-step form or a sleek scrollable sheet.
*   **Vehicle Details Screen:**
    *   **Top Hero Panel:** Vehicle nickname, model/make, fuel type, and large circular health score indicator.
    *   **Diagnostics Section:** Vertical list of the 6 monitored components (Engine Oil, Brake System, Battery, Coolant, Air Filter, Tires).
        *   Each item shows a linear progress bar indicating wear/usage based on predictions.
        *   Colors change dynamically (Green $\rightarrow$ Orange $\rightarrow$ Red).
        *   Shows remaining km / remaining days and status badge.
    *   **Quick Telemetry Form:** Quick-input field to update the current odometer reading immediately, which triggers a background calculation of prediction metrics.
    *   **Recent Service History Log:** A secondary list tab inside details showing logs specific to this vehicle.

### 4. Service Logs / History Screen
*   List of past maintenance records showing: cost, category, description, service center, odometer reading, and date.
*   Filter by vehicle or category.
*   "Log Service" form with searchable categories and a date/time picker.

### 5. Appointments Manager
*   **Calendar or List Toggle:** Shows scheduled vehicle maintenance slots.
*   **Add Appointment Sheet:** Allows users to pick one of their vehicles, select a maintenance category, select a date and time, and book the slot.
*   **Cancel & Reschedule:** Interactive action options inside each appointment details modal/bottom sheet.

### 6. Fleet Analytics Dashboard
*   **Visualizations:**
    *   **Line Chart:** Total maintenance cost over the last 6 months.
    *   **Pie/Donut Chart:** Costs grouped by service category (e.g., Engine Oil vs Tires vs Brakes).
    *   **Bar Chart:** Average mileage progression rate per vehicle.
*   Dynamic filtering by specific vehicle or date range.

### 7. Settings & Profile
*   Display user information and options to edit name/email, reset account password.
*   **Theme Toggle:** Real-time theme provider switch between Dark Mode and Light Mode.
*   **Logout Button:** Clears all secure storage tokens and resets Riverpod states, redirecting back to the login screen.

### 8. Admin View (Conditional Route)
*   If the user has `isAdmin` flag set to `true`:
    *   Provide a toggle to switch to the **Admin Dashboard**.
    *   **Admin Dashboard View:**
        *   Aggregated system metrics: total active platform users, registered fleet count, and appointment stats.
        *   **Manage Users Tab:** List of registered users, option to delete user or change their role.
        *   **Manage Appointments Tab:** Manage appointments across all platform users (Approve, Reject, or Complete them with one click).

---

## 🔒 Security & Performance Requirements

1.  **Secure Storage:** Tokens must never be stored in plaintext. Use secure system keychain services (Keychain on iOS, Keystore on Android).
2.  **JWT Refresh Mechanism:** Implement a Dio Interceptor that handles `401 Unauthorized` responses by hitting `/api/auth/refresh` behind the scenes, updating the stored token, and retrying the failed request seamlessly without interrupting the user.
3.  **State Cleanliness:** On user logout, ensure all providers are invalidated to prevent data leaking between different logged-in accounts.
4.  **Error States & Shimmers:** Display skeleton/shimmer loaders during initial data fetching, and present clear offline warnings or retry buttons if HTTP calls fail.
