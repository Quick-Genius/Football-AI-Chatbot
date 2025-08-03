import React from 'react';
import type { MessageType } from '../types/types';

interface ChatMessageProps {
  message: MessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div className={`message ${message.sender}-message`}>
      <div className="message-avatar">
        {message.sender === 'user' ? (
          <i className="fas fa-user"></i>
        ) : (
          <i className="fas fa-futbol"></i>
        )}
      </div>
      <div className="message-content">
        <p>{message.text}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
