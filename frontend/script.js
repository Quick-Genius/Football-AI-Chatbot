class FootballChatbot {
    constructor() {
        this.apiUrl = 'http://localhost:5001/api'; // Change this for production
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.errorModal = document.getElementById('errorModal');
        this.errorMessage = document.getElementById('errorMessage');
        
        this.initializeEventListeners();
        this.focusInput();
    }
    
    initializeEventListeners() {
        // Send button click - FIXED: replaced &gt; with >
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Enter key press - FIXED: replaced &amp; with &
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        }); // FIXED: Added missing closing brace
        
        // Input validation - FIXED: replaced &gt; with >
        this.messageInput.addEventListener('input', () => {
            this.validateInput();
        });
        
        // Quick suggestion chips - FIXED: replaced &gt; with >
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const message = e.target.dataset.message;
                this.messageInput.value = message;
                this.sendMessage();
            });
        });
        
        // Prevent form submission on enter - FIXED: replaced &amp; with &
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target === this.messageInput) {
                e.preventDefault();
            }
        }); // FIXED: Added missing closing brace
    } // FIXED: Added missing closing brace for initializeEventListeners
    
    validateInput() {
        const message = this.messageInput.value.trim();
        // FIXED: replaced &gt; and &lt; with > and <, &amp; with &
        const isValid = message.length > 0 && message.length <= 500;
        this.sendButton.disabled = !isValid;
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        
        if (!message) {
            this.showError('Please enter a message');
            return;
        }
        
        // FIXED: replaced &gt; with >
        if (message.length > 500) {
            this.showError('Message is too long. Please keep it under 500 characters.');
            return;
        }
        
        // Disable input and button
        this.setInputState(false);
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        this.messageInput.value = '';
        this.validateInput();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            const response = await this.callAPI(message);
            this.hideTypingIndicator();
            
            if (response.error) {
                this.showError(response.error);
            } else {
                this.addMessage(response.response, 'bot');
            }
        } catch (error) {
            this.hideTypingIndicator();
            console.error('Error:', error);
            this.showError('Failed to connect to the server. Please try again.');
        } finally {
            this.setInputState(true);
        }
    }
    
    async callAPI(message) {
        const controller = new AbortController();
        // FIXED: replaced &gt; with >
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
            const response = await fetch(`${this.apiUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('API endpoint not found. Please check the server configuration.');
                }
                // FIXED: replaced &gt; with >
                if (response.status >= 500) {
                    throw new Error('Server error. Please try again later.');
                }
                // FIXED: replaced &gt; with >
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            }
            throw error;
        }
    }
    
    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        // FIXED: Added the missing icon HTML
        avatarDiv.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const textP = document.createElement('p');
        textP.textContent = text;
        
        contentDiv.appendChild(textP);
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        this.typingIndicator.style.display = 'block';
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }
    
    setInputState(enabled) {
        this.messageInput.disabled = !enabled;
        this.sendButton.disabled = !enabled;
        
        if (enabled) {
            this.focusInput();
        }
    }
    
    focusInput() {
        // FIXED: replaced &gt; with >
        setTimeout(() => {
            this.messageInput.focus();
        }, 100);
    }
    
    scrollToBottom() {
        // FIXED: replaced &gt; with >
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorModal.style.display = 'flex';
    }
    
    closeErrorModal() {
        this.errorModal.style.display = 'none';
        this.focusInput();
    }
}

// Global function for closing error modal (called from HTML)
function closeErrorModal() {
    if (window.chatbot) {
        window.chatbot.closeErrorModal();
    }
}

// Initialize the chatbot when DOM is loaded - FIXED: replaced &gt; with >
document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new FootballChatbot();
});

// Handle online/offline status - FIXED: replaced &gt; with >
window.addEventListener('online', () => {
    console.log('Connection restored');
});

window.addEventListener('offline', () => {
    console.log('Connection lost');
    if (window.chatbot) {
        window.chatbot.showError('No internet connection. Please check your network and try again.');
    }
});
