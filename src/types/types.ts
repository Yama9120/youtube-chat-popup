export interface ChatMessage {
    id: string;
    author: string;
    message: string;
    timestamp: number;
  }
  
  export interface OverlayOptions {
    position: 'right' | 'left';
    duration: number;
    maxMessages: number;
  }