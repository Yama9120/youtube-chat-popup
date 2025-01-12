export interface ChatMessage {
    id: string;
    author: string;
    message: string;
    timestamp: number;
}

export type ChatDesign = 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft' | 'bottomBubble';
export type Position = 'right' | 'left';

export interface MessageConfig {
    maxLength: number;
    duration: number;
    maxMessages: number;
}

export interface OverlayOptions {
    position: Position;
    messageConfig: MessageConfig;
}

export interface ChatSettings {
    fontSize: number;
    messageWidth: number;
    opacity: number;
    showUsername: boolean;
    design: ChatDesign;
}

export const DEFAULT_SETTINGS: ChatSettings = {
    fontSize: 14,
    messageWidth: 300,
    opacity: 0.8,
    showUsername: true,
    design: 'topRight'
};