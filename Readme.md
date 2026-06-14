# YouTube Backend

A Node.js backend for a YouTube-style application. This project provides API endpoints for user authentication, video management, comments, likes, and other backend services required by a video streaming frontend.

## Features

- User authentication and authorization
- Video upload and metadata management
- Comment creation and retrieval
- Like/dislike support
- Search and category filtering
- RESTful API design

## Tech Stack

- Node.js
- Express.js
- MongoDB / Mongoose (or another database)
- JSON Web Tokens (JWT)
- dotenv for environment configuration

## Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB instance or compatible database

## Setup

1. Clone the repository

   ```bash
   git clone <repository-url>
   cd yt-backend
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root and add required variables

   ```env
   PORT=5000
   MONGO_URI=<your-mongo-connection-string>
   JWT_SECRET=<your-secret-key>
   ```

4. Start the development server

   ```bash
   npm run dev
   ```

## Running in Production

```bash
npm start
```

## API Overview

Typical endpoints include:

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT
- `GET /api/videos` - Get videos list
- `POST /api/videos` - Upload a new video
- `GET /api/videos/:id` - Get video details
- `PUT /api/videos/:id` - Update video metadata
- `DELETE /api/videos/:id` - Delete a video
- `POST /api/videos/:id/comments` - Add comment to video
- `POST /api/videos/:id/like` - Like a video
- `POST /api/videos/:id/dislike` - Dislike a video

Adjust routes based on the actual implementation in the project.

## Environment Variables

Ensure these environment variables are defined in `.env`:

- `PORT` - port on which the backend runs
- `MONGO_URI` - connection string for MongoDB
- `JWT_SECRET` - secret key for signing JWTs

## Folder Structure

A common structure for this backend could be:

- `controllers/` - request handler logic
- `models/` - database schemas
- `routes/` - API route definitions
- `middlewares/` - authentication and error handling
- `config/` - configuration and database setup
- `app.js` or `server.js` - application entry point


## License

This project is open source and available under the MIT License.
