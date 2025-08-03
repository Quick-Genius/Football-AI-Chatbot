export interface MessageType {
  text: string;
  sender: 'user' | 'bot';
}

export interface ApiResponse {
  response?: string;
  error?: string;
}
