# Football AI Chatbot

A production-ready AI chatbot focused on football/soccer topics, powered by Google's Gemini AI.

## Features

- 🤖 Intelligent football-focused conversations
- ⚽ Covers players, teams, matches, leagues, and more
- 🎨 Modern, responsive web interface
- 🔒 Input sanitization and security measures
- 📱 Mobile-friendly design
- 🚀 Production-ready deployment

## Setup

### Prerequisites

- Python 3.8+
- Google Gemini AI API key
- Modern web browser

### Backend Setup

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```

3. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

4. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file in the backend directory and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

6. Start the Flask backend server:
   ```bash
   python app.py
   ```
   
   The backend will start running on `http://localhost:5001`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Start a local web server (you can use Python's built-in server):
   ```bash
   python -m http.server 8000
   ```

3. Open your web browser and go to:
   ```
   http://localhost:8000
   ```

## Usage

1. Make sure both the backend (port 5001) and frontend (port 8000) servers are running
2. Open the web interface in your browser
3. Start chatting about football topics!
4. The AI assistant can help with:
   - Player information and statistics
   - Team histories and achievements
   - Match results and analysis
   - League information
   - Transfer news and rumors
   - Football rules and regulations

## API Endpoints

- `GET /` - API information
- `GET /api/health` - Health check
- `POST /api/chat` - Chat with the AI assistant

## Troubleshooting

### Backend Issues

- **Connection Refused Error**: Make sure the Flask backend is running on port 5001
- **AI Model Error**: Ensure your Gemini API key is valid and properly set in the `.env` file
- **Missing Dependencies**: Run `pip install -r requirements.txt` to install all required packages

### Frontend Issues

- **CORS Errors**: Make sure the backend server is running and CORS is properly configured
- **Network Errors**: Check that both frontend and backend servers are running on their respective ports
