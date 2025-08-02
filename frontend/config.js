// Configuration for different environments
const CONFIG = {
    // For local development
    development: {
        apiUrl: 'http://localhost:5001/api'
    },
    // For production (update with your deployed backend URL)
    production: {
        apiUrl: 'https://your-backend-url.com/api'
    }
};

// Auto-detect environment
const isProduction = window.location.hostname !== 'localhost';
const config = isProduction ? CONFIG.production : CONFIG.development;