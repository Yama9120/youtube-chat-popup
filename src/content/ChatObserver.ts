import { ChatMessage } from '../types/types';

export class ChatObserver {
  private observer: MutationObserver;
  private callback: (message: ChatMessage) => void;
  private processedMessageIds: Set<string> = new Set(); // メッセージIDを追跡
  
  constructor(onNewMessage: (message: ChatMessage) => void) {
    this.callback = onNewMessage;
    this.observer = new MutationObserver(this.handleMutations.bind(this));
    console.log('ChatObserver initialized');
  }

  public start(): void {
    this.stop();
    this.processedMessageIds.clear();
    this.findAndObserveChatContainer();
  }

  public stop(): void {
    this.observer.disconnect();
  }

  private handleMutations(mutations: MutationRecord[]): void {
    // チャットメッセージのみを処理
    mutations
      .filter(mutation => mutation.type === 'childList')
      .forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement && 
              node.tagName.toLowerCase() === 'yt-live-chat-text-message-renderer') {
            this.processMessage(node);
          }
        });
      });
  }

  private processMessage(element: HTMLElement): void {
    // メッセージ要素から一意のIDを生成
    const messageId = this.generateMessageId(element);
    
    if (!this.processedMessageIds.has(messageId)) {
      const message = this.extractMessageData(element);
      if (message) {
        this.processedMessageIds.add(messageId);
        this.callback(message);
      }
    }
  }

  // メッセージの一意性を保証するためのID生成
  private generateMessageId(element: HTMLElement): string {
    const author = element.querySelector('#author-name')?.textContent?.trim() || '';
    const message = element.querySelector('#message')?.textContent?.trim() || '';
    const timestamp = element.querySelector('#timestamp')?.textContent?.trim() || '';
    return `${author}-${message}-${timestamp}`;
  }

  private findAndObserveChatContainer(): void {
    const chatFrame = document.querySelector('iframe#chatframe');
    if (chatFrame instanceof HTMLIFrameElement) {
      this.observeFrameLoad(chatFrame);
    } else {
      this.findChatContainerInDocument(document);
    }
  }

  private observeFrameLoad(frame: HTMLIFrameElement): void {
    const checkFrame = () => {
      const frameDocument = frame.contentDocument || frame.contentWindow?.document;
      if (frameDocument) {
        this.findChatContainerInDocument(frameDocument);
      } else {
        setTimeout(checkFrame, 500);
      }
    };
    
    checkFrame();
  }

  private findChatContainerInDocument(doc: Document): void {
    const chatContainer = doc.querySelector('yt-live-chat-app');
    
    if (chatContainer) {
      console.log('Found chat container:', chatContainer);
      this.observer.observe(chatContainer, {
        childList: true,
        subtree: true,
      });
      console.log('Started observing chat container');
    } else {
      setTimeout(() => this.findChatContainerInDocument(doc), 1000);
    }
  }

  private extractMessageData(element: HTMLElement): ChatMessage | null {
    try {
      const authorElement = element.querySelector('#author-name');
      const messageElement = element.querySelector('#message');
      const timestampElement = element.querySelector('#timestamp');

      if (!authorElement || !messageElement || !timestampElement) return null;

      const id = this.generateMessageId(element);
      
      return {
        id,
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