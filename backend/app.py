from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
import logging
import re
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Get frontend URL for CORS
FRONTEND_URL = os.getenv('FRONTEND_URL')
if not FRONTEND_URL:
    raise ValueError("FRONTEND_URL environment variable is required")

# CORS setup - only allow requests from specified frontend URL
CORS(app, resources={
    r"/api/chat": {
        "origins": [FRONTEND_URL],  # Only allow requests from the specified frontend URL
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini AI
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is required")

genai.configure(api_key=GEMINI_API_KEY)

# Initialize the model
model = genai.GenerativeModel('gemini-1.5-flash')

# Football-specific context prompt
FOOTBALL_CONTEXT = """
You are a knowledgeable football (soccer) AI assistant. You specialize in:
- Player statistics and career information
- Team histories and current standings
- Match results and upcoming fixtures
- Transfer news and rumors
- Tactical analysis and formations
- Football rules and regulations
- Historical football facts and records
- League information (Premier League, La Liga, Serie A, Bundesliga, etc.)
- International competitions (World Cup, UEFA Euro, Champions League, etc.)

Always provide accurate, up-to-date information about football. If you're unsure about recent events, mention that your information might not be current. Keep responses engaging and informative.
"""

def sanitize_input(user_input):
    """Sanitize user input to prevent injection attacks"""
    # Remove potentially harmful characters
    sanitized = re.sub(r'[<>"\']', '', user_input)
    # Limit length
    return sanitized[:500] if len(sanitized) > 500 else sanitized

def is_football_related(message):
    """Check if the message is football-related"""
    football_keywords = [
        'football', 'soccer', 'player', 'team', 'match', 'goal', 'league',
        'premier league', 'champions league', 'fifa', 'uefa', 'world cup',
        'messi', 'ronaldo', 'barcelona', 'real madrid', 'manchester',
        'liverpool', 'arsenal', 'chelsea', 'psg', 'juventus', 'milan',
        'bayern', 'dortmund', 'atletico', 'valencia', 'sevilla', 'napoli',
        'inter', 'roma', 'lazio', 'tottenham', 'city', 'united', 'striker',
        'midfielder', 'defender', 'goalkeeper', 'formation', 'tactics',
        'transfer', 'contract', 'injury', 'suspension', 'card', 'penalty',
        'offside', 'corner', 'free kick', 'derby', 'fixture', 'standings'
    ]
    
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in football_keywords)

# Simple rate limiting (in-memory)
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["50 per minute"]
)

@app.route('/')
def home():
    return jsonify({
        "message": "Football AI Chatbot API is running!",
        "endpoints": {
            "chat": "/api/chat",
            "health": "/api/health"
        }
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "football-chatbot-api"})

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
@limiter.limit("20 per minute")
def chat():
    """Main chat endpoint"""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return '', 200
    
    logger.info(f"Received chat request from {request.remote_addr}")
    
    try:
        data = request.get_json()
        logger.debug(f"Request data: {data}")
        
        if not data or 'message' not in data:
            return jsonify({"error": "Message is required"}), 400
        
        user_message = sanitize_input(data['message'])
        logger.info(f"Processing message: {user_message[:50]}...")
        
        if not user_message.strip():
            return jsonify({"error": "Message cannot be empty"}), 400
        
        # Check if message is football-related
        if not is_football_related(user_message):
            return jsonify({
                "response": "I'm a football-focused AI assistant. Please ask me questions about football/soccer such as players, teams, matches, leagues, or football-related topics!"
            })
        
        # Prepare the prompt with context
        full_prompt = f"{FOOTBALL_CONTEXT}\n\nUser question: {user_message}"
        
        try:
            # Generate response using Gemini with timeout
            response = model.generate_content(
                full_prompt,
                safety_settings=[
                    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                ]
            )
            
            if not response:
                logger.error("Null response from Gemini API")
                return jsonify({"error": "Failed to generate response"}), 500
                
            if not hasattr(response, 'text'):
                logger.error("Response missing text attribute")
                return jsonify({"error": "Invalid response format"}), 500
                
            if not response.text or not response.text.strip():
                logger.error("Empty response text from Gemini API")
                return jsonify({"error": "Empty response from AI"}), 500
            
            logger.info("Successfully generated response")
            return jsonify({
                "response": response.text,
                "user_message": user_message
            })
            
        except Exception as api_error:
            logger.error(f"Gemini API error: {str(api_error)}")
            return jsonify({"error": "AI model error", "details": str(api_error)}), 500
            
    except Exception as e:
        logger.error(f"General error in chat endpoint: {str(e)}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@app.route('/favicon.ico')
def favicon():
    return '', 204  # Return no content for favicon requests

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    # Get configuration from environment variables
    debug_mode = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5001))
    
    app.run(debug=debug_mode, host=host, port=port)
