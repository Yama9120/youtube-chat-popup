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

export interface ChatSettings {
    fontSize: number;
    messageWidth: number;

    opacity: number;
  }
  
  // デフォルト設定も追加
  export const DEFAULT_SETTINGS: ChatSettings = {
    fontSize: 14,
    messageWidth: 300,

    opacity: 0.8
  };