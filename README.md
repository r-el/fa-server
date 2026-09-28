# Specter Server

## Installation and Setup

### Prerequisites

- Node.js v16+
- npm or yarn

### Installation

```bash
cd fa-server
npm install
```

### Running

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

## Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
# Environment
NODE_ENV=development

# Server
PORT=12113
HOST=localhost

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:12113

# Database - Supabase (Required)
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
```

### Configuration Files

- `src/config/server.js` - Basic server configuration
- `src/config/cors.js` - CORS configuration
- `.env` - Environment variables

## Project Structure

```text
server/
├── src/
│   ├── config/          # Configurations
│   │   ├── server.js    # Server configuration
│   │   └── cors.js      # CORS configuration
│   ├── controllers/     # API controllers
│   │   ├── rootController.js
│   │   └── healthController.js
│   ├── middlewares/     # Middlewares
│   │   └── errorHandler.js
│   ├── routes/          # API routes
│   │   ├── rootRoutes.js
│   │   └── healthRoutes.js
│   └── server.js        # Main server file
├── .env                 # Environment variables
├── .env.example         # Environment variables example
├── index.js             # Entry point
└── package.json         # Dependencies and scripts
```

## Features

- Express.js - Fast and lightweight web framework
- CORS - Cross-origin resource sharing support
- Helmet - Basic security
- ES Modules - Modern module support
- Error Handling - Advanced error handling
- Environment Variables - Dynamic configuration

## API Endpoints

### GET /

Basic connection test

```json
{
  "success": true,
  "message": "Welcome to Specter Server!"
}
```

### GET /health

Health check endpoint for monitoring and deployment verification

```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2025-09-14T10:30:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

## Development

### Adding a New Route

1. Create a controller in `src/controllers/`
2. Create a dedicated route file in `src/routes/` (e.g., `userRoutes.js`)
3. Import and connect the route to server in `src/server.js`

Example structure:

- `src/controllers/userController.js` - Controller logic
- `src/routes/userRoutes.js` - Route definitions
- `src/server.js` - Route registration

### Error Handling

The server includes global error handling with:

- Development mode: Full error details and stack traces
- Production mode: Generic error messages for security

### Production Deployment

For production deployment, ensure these environment variables are set:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
ALLOWED_ORIGINS=https://yourdomain.com
SUPABASE_URL=your_production_supabase_url
SUPABASE_KEY=your_production_supabase_key

```

#### Heroku Deployment

Set environment variables using Heroku CLI:

```bash
heroku config:set NODE_ENV=production
heroku config:set SUPABASE_URL=your_supabase_url
heroku config:set SUPABASE_KEY=your_supabase_key
```

#### GitHub Secrets (for CI/CD)

Add these secrets to your GitHub repository:

- `SUPABASE_URL`
- `SUPABASE_KEY`

- Detailed logging
- Customized error messages
- Stack trace in development environment

## Main Dependencies

- express - Web framework
- cors - CORS support
- helmet - HTTP headers security
- dotenv - Environment variables loading

## Security

- Helmet.js for HTTP headers protection
- CORS restricted to allowed domains
- "X-Powered-By" header hiding
- Request size limit (10MB)
