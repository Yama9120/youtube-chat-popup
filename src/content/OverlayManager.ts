import { ChatMessage, OverlayOptions } from '../types/types';

export class OverlayManager {
  private container: HTMLElement;
  private messages: ChatMessage[] = [];
  private options: OverlayOptions;

  constructor(options: Partial<OverlayOptions> = {}) {
    this.options = {
      position: options.position || 'right',
      duration: options.duration || 5000,
      maxMessages: options.maxMessages || 5
    };
    this.container = this.createContainer();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      ${this.options.position}: 20px;
      top: 20px;
      z-index: 9999;
      pointer-events: none;
    `;
    document.body.appendChild(container);
    return container;
  }

  public addMessage(message: ChatMessage): void {
    const messageElement = this.createMessageElement(message);
    this.container.appendChild(messageElement);
    
    this.messages.push(message);
    if (this.messages.length > this.options.maxMessages) {
      const oldMessage = this.messages.shift();
      const oldElement = this.container.querySelector(`[data-message-id="${oldMessage?.id}"]`);
      oldElement?.remove();
    }

    setTimeout(() => {
      messageElement.remove();
      this.messages = this.messages.filter(m => m.id !== message.id);
    }, this.options.duration);
  }

  private createMessageElement(message: ChatMessage): HTMLElement {
    const element = document.createElement('div');
    element.dataset.messageId = message.id;
    element.style.cssText = `
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 8px;
      animation: slideIn 0.3s ease-out;
    `;
    element.innerHTML = `<strong>${message.author}:</strong> ${message.message}`;
    return element;
  }

  public reset(): void {
    // オーバーレイをクリアして再初期化
    this.container.innerHTML = '';
    this.messages = [];
  }

  // フルスクリーン時の位置調整
  private updatePosition(): void {
    const isFullscreen = document.fullscreenElement !== null;
    this.container.style.position = 'fixed';
    this.container.style.zIndex = '9999';
    
    if (isFullscreen) {
      this.container.style.top = '20px';
      this.container.style.right = '20px';
    } else {
      this.container.style.top = '60px';
      this.container.style.right = '10px';
    }
  }
}