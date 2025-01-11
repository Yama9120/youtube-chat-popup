import { ChatMessage } from '../types/types';

export class ChatObserver {
  private observer: MutationObserver;
  private callback: (message: ChatMessage) => void;
  
  constructor(onNewMessage: (message: ChatMessage) => void) {
    this.callback = onNewMessage;
    this.observer = new MutationObserver(this.handleMutations.bind(this));
  }

  public start(): void {
    const chatContainer = document.querySelector('#chat');
    if (!chatContainer) {
      setTimeout(() => this.start(), 1000); // Retry if chat not found
      return;
    }

    this.observer.observe(chatContainer, {
      childList: true,
      subtree: true
    });
  }

  public stop(): void {
    this.observer.disconnect();
  }

  private handleMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        this.processChatMessages(mutation.addedNodes);
      }
    }
  }

  private processChatMessages(nodes: NodeList): void {
    nodes.forEach(node => {
      if (node instanceof HTMLElement && this.isChatMessage(node)) {
        const message = this.extractMessageData(node);
        if (message) {
          this.callback(message);
        }
      }
    });
  }

  private isChatMessage(element: HTMLElement): boolean {
    return element.tagName === 'YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER' ||
           element.matches('[id^="message"]');
  }

  private extractMessageData(element: HTMLElement): ChatMessage | null {
    try {
      const authorElement = element.querySelector('#author-name');
      const messageElement = element.querySelector('#message');

      if (!authorElement || !messageElement) return null;

      return {
        id: crypto.randomUUID(),
        author: authorElement.textContent?.trim() || '',
        message: messageElement.textContent?.trim() || '',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error extracting message data:', error);
      return null;
    }
  }
}