# Rent Car Local — Backend API

A RESTful backend for a car rental management platform built with **Node.js, Express.js, and MongoDB**. The application provides server-side functionality for user authentication, car management, rental bookings, and administrative operations.

The backend is maintained separately from the React frontend, providing a modular architecture for development and maintenance.

## Project Repositories

- **Backend:** [RENT_CAR_LOCAL](https://github.com/SupainNandy/RENT_CAR_LOCAL)
- **Frontend:** [RENT_CAR_LOCAL_FRONTEND](https://github.com/SupainNandy/RENT_CAR_LOCAL_FRONTEND)

## Features

- **RESTful API:** Endpoints for communication between the frontend and backend.
- **User Authentication:** User registration, login, and authentication-protected operations.
- **Car Management:** Manage car listings and vehicle information.
- **Booking Management:** Process rental booking requests and manage booking information.
- **Admin Operations:** Manage vehicle listings and customer bookings.
- **Database Integration:** Store and manage application data using MongoDB and Mongoose.
- **Image Management:** Handle car image uploads using ImageKit.
- **Booking History:** Maintain and retrieve booking records.
- **Frontend Integration:** Provide backend services to the React frontend.

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend framework |
| MongoDB | NoSQL database |
| Mongoose | Database modeling and operations |
| JavaScript | Server-side programming |
| JWT | Authentication token management |
| ImageKit | Car image upload and management |
| Git | Version control |
| GitHub | Source code hosting |

## Architecture

The application uses separate repositories for the frontend and backend.

```text
User
  |
  v
React Frontend
RENT_CAR_LOCAL_FRONTEND
  |
  | HTTP Requests
  v
Express.js REST API
RENT_CAR_LOCAL
  |
  +---- Authentication
  |
  +---- Car Management
  |
  +---- Booking Management
  |
  +---- Admin Operations
  |
  v
MongoDB Database
```

The frontend manages the user interface and client-side interactions. The backend processes API requests, handles application logic, manages authentication, and communicates with MongoDB.

## Getting Started

### Prerequisites

Install the following tools:

- [Node.js](https://nodejs.org/)
- npm
- [MongoDB](https://www.mongodb.com/)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/SupainNandy/RENT_CAR_LOCAL.git
cd RENT_CAR_LOCAL
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the backend root directory.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Configure the required database connection, authentication secret, and image-upload credentials according to the application's configuration.

**Security:** Keep environment variables and private credentials out of version control. Never publish real database credentials, API keys, or authentication secrets in your repository.

### 4. Start the Backend

Start the development server:

```bash
npm run dev
```

For production, use:

```bash
npm start
```

The application uses the configured server port. With the example configuration, the local server address is:

```text
http://localhost:5000
```

### 5. Connect the Frontend

Clone the frontend repository:

```bash
git clone https://github.com/SupainNandy/RENT_CAR_LOCAL_FRONTEND.git
cd RENT_CAR_LOCAL_FRONTEND
npm install
npm run dev
```

Configure the frontend API base URL to match the running backend server. Ensure the backend CORS configuration permits requests from the frontend origin.

## API Modules

| Module | Responsibility |
|---|---|
| Authentication | User registration and login |
| Cars | Vehicle listing and management |
| Bookings | Rental booking operations |
| Booking History | Booking record management |
| Administration | Administrative operations |

The API provides the backend functionality required by the car rental application.

## Security Best Practices

- Store credentials and secrets in environment variables.
- Exclude `.env` files from Git version control.
- Validate and sanitize incoming request data.
- Enforce authentication and authorization on protected endpoints.
- Configure CORS for trusted frontend origins.
- Use HTTPS in production.
- Avoid exposing private credentials in client-side code.

## Future Improvements

- Automated API and integration testing.
- API documentation using Swagger/OpenAPI.
- Centralized error handling and structured logging.
- Rate limiting and enhanced security controls.
- CI/CD automation.
- Production deployment and performance optimization.

## Author

**Supain Nandy**

- GitHub: [@SupainNandy](https://github.com/SupainNandy)
- Backend Repository: [RENT_CAR_LOCAL](https://github.com/SupainNandy/RENT_CAR_LOCAL)
- Frontend Repository: [RENT_CAR_LOCAL_FRONTEND](https://github.com/SupainNandy/RENT_CAR_LOCAL_FRONTEND)

## License

No license information is specified in this README.

---

If you find this project useful, consider starring the repository!
