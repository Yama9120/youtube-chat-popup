import { ChatMessage } from '../types/types';

export class ChatObserver {
  private observer: MutationObserver;
  private callback: (message: ChatMessage) => void;
  
  constructor(onNewMessage: (message: ChatMessage) => void) {
    this.callback = onNewMessage;
    this.observer = new MutationObserver(this.handleMutations.bind(this));
    console.log('ChatObserver initialized'); // デバッグログ追加
  }

  public start(): void {
    // まずiframeを探す
    const chatFrame = document.querySelector('iframe#chatframe');
    if (chatFrame instanceof HTMLIFrameElement) {
      const frameDocument = chatFrame.contentDocument || chatFrame.contentWindow?.document;
      if (frameDocument) {
        const chatContainer = frameDocument.querySelector('#chat, #chat-messages, yt-live-chat-app');
        console.log('Found chat container in iframe:', chatContainer);
        if (chatContainer) {
          this.observer.observe(chatContainer, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
          });
          console.log('Started observing chat container in iframe');
          return;
        }
      }
    }

    // iframeがない場合やアクセスできない場合は通常のDOM内を探す
    const chatContainer = document.querySelector('#chat, #chat-messages, yt-live-chat-app');
    console.log('Found chat container:', chatContainer);

    if (!chatContainer) {
      console.log('Chat container not found, retrying...');
      setTimeout(() => this.start(), 1000);
      return;
    }

    this.observer.observe(chatContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });
    console.log('Started observing chat container');
  }

  public stop(): void {
    this.observer.disconnect();
  }

  private handleMutations(mutations: MutationRecord[]): void {
    console.log('Mutations detected:', mutations); // デバッグログ
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement && this.isChatMessage(node)) {
            console.log('Found chat message:', node); // デバッグログ
            const message = this.extractMessageData(node);
            if (message) {
              console.log('Extracted message data:', message); // デバッグログ
              this.callback(message);
            }
          }
        });
      }
    }
  }

  private isChatMessage(element: HTMLElement): boolean {
    const selectors = [
      'yt-live-chat-text-message-renderer',
      'yt-live-chat-paid-message-renderer', // スーパーチャットも含める
      '[id^="message"]',
      '.chat-message',
      '.yt-live-chat-item-list-renderer'
    ];
    
    const isMessage = selectors.some(selector => 
      element.matches(selector) || element.querySelector(selector) !== null
    );
    
    console.log('Checking element:', {
      element,
      tagName: element.tagName,
      isMessage,
      selectors: selectors.map(s => ({ 
        selector: s, 
        matches: element.matches(s),
        hasChild: element.querySelector(s) !== null 
      }))
    });
    
    return isMessage;
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