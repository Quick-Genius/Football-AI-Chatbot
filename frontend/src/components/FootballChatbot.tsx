import React, { useState, useEffect, useRef } from 'react';
import type { MessageType, ApiResponse } from '../types/types';
import ChatMessage from './ChatMessage';
import ErrorModal from './ErrorModal';
import './FootballChatbot.css';

const FootballChatbot: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isInputDisabled, setIsInputDisabled] = useState<boolean>(false);
  
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // API URL from environment variables
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  const quickSuggestions = [
    "Tell me about Premier League",
    "Who won the last World Cup?",
    "Latest transfer news",
    "Upcoming matches"
  ];

  useEffect(() => {
    focusInput();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('Connection restored');
    };

    const handleOffline = () => {
      console.log('Connection lost');
      setError('No internet connection. Please check your network and try again.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const validateInput = (message: string): boolean => {
    return message.trim().length > 0 && message.length <= 500;
  };

  const focusInput = (): void => {
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 100);
  };

  const scrollToBottom = (): void => {
    setTimeout(() => {
      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      }
    }, 100);
  };

  const callAPI = async (message: string): Promise<ApiResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${apiUrl}/chat`, {
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

        if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  };

  const sendMessage = async (): Promise<void> => {
    const message = inputValue.trim();

    if (!message) {
      setError('Please enter a message');
      return;
    }

    if (message.length > 500) {
      setError('Message is too long. Please keep it under 500 characters.');
      return;
    }

    // Disable input and add user message
    setIsInputDisabled(true);
    setMessages(prev => [...prev, { text: message, sender: 'user' }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await callAPI(message);
      setIsLoading(false);

      if (response.error) {
        setError(response.error);
      } else if (response.response) {
        setMessages(prev => [...prev, { text: response.response as string, sender: 'bot' }]);
      } else {
        setError('No response received from the server');
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to the server. Please try again.');
    } finally {
      setIsInputDisabled(false);
      focusInput();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string): void => {
    // Clear any existing errors
    setError('');
    
    // Directly send the suggestion without setting input value
    if (!suggestion.trim()) {
      return;
    }

    // Disable input and add user message
    setIsInputDisabled(true);
    setMessages(prev => [...prev, { text: suggestion, sender: 'user' }]);
    setInputValue('');
    setIsLoading(true);

    // Send the suggestion directly
    callAPI(suggestion)
      .then(response => {
        setIsLoading(false);
        if (response.error) {
          setError(response.error);
        } else if (response.response) {
          setMessages(prev => [...prev, { text: response.response as string, sender: 'bot' }]);
        } else {
          setError('No response received from the server');
        }
      })
      .catch(error => {
        setIsLoading(false);
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Failed to connect to the server. Please try again.');
      })
      .finally(() => {
        setIsInputDisabled(false);
        focusInput();
      });
  };

  const closeErrorModal = (): void => {
    setError('');
    focusInput();
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <i className="fas fa-futbol"></i>
          <h1>Football Chatbot</h1>
          <p>Your AI assistant for all things football</p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="chat-container" ref={chatMessagesRef}>
        <div className="chat-messages">
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
          
          {/* Typing Indicator */}
          {isLoading && (
            <div className="typing-indicator">
              <div className="message bot-message">
                <div className="message-avatar">
                  <i className="fas fa-futbol"></i>
                </div>
                <div className="message-content">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Suggestions */}
      <div className="quick-suggestions">
        {quickSuggestions.map((suggestion, index) => (
          <button
            key={index}
            className="suggestion-chip"
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={isInputDisabled}
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input Container */}
      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            ref={messageInputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your football question here..."
            disabled={isInputDisabled}
            rows={1}
            className="message-input"
          />
          <button
            className="send-button"
            onClick={sendMessage}
            disabled={!validateInput(inputValue) || isInputDisabled}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>

      {/* Error Modal */}
      {error && (
        <ErrorModal message={error} onClose={closeErrorModal} />
      )}
    </div>
  );
};

export default FootballChatbot;
