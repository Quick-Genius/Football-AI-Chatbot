from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
import logging
import re

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:8000", "http://127.0.0.1:8000"],
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
model = genai.GenerativeModel('gemini-pro')

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
def chat():
    """Main chat endpoint"""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        # FIXED: Complete the if statement
        if not data or 'message' not in data:
            return jsonify({"error": "Message is required"}), 400
        
        user_message = sanitize_input(data['message'])
        
        if not user_message.strip():
            return jsonify({"error": "Message cannot be empty"}), 400
        
        # Check if message is football-related
        if not is_football_related(user_message):
            return jsonify({
                "response": "I'm a football-focused AI assistant. Please ask me questions about football/soccer such as players, teams, matches, leagues, or football-related topics!"
            })
        
        # Prepare the prompt with context
        full_prompt = f"{FOOTBALL_CONTEXT}\n\nUser question: {user_message}"
        
        # Generate response using Gemini
        response = model.generate_content(full_prompt)
        
        if not response.text:
            return jsonify({"error": "Failed to generate response"}), 500
        
        return jsonify({
            "response": response.text,
            "user_message": user_message
        })
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

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
    app.run(debug=True, host='0.0.0.0', port=5001)
