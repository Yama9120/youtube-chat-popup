import { ChatMessage, OverlayOptions, ChatSettings } from '../types/types';

export class OverlayManager {
  private container: HTMLElement;
  private messages: ChatMessage[] = [];
  private options: OverlayOptions;
  private settings: ChatSettings = {
    fontSize: 14,
    messageWidth: 300,
    opacity: 0.8,
    showUsername: true,
    design: 'topRight'
  };

  constructor(options: Partial<OverlayOptions> = {}) {
    this.options = {
      position: options.position || 'right',
      duration: options.duration || 5000,
      maxMessages: options.maxMessages || 5
    };
    this.container = this.createContainer();
    this.createSettingsButton();
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

  private createSettingsButton(): void {
    const button = document.createElement('button');
    button.textContent = '⚙️';
    button.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      z-index: 10000;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: none;
      padding: 8px;
      border-radius: 50%;
      cursor: pointer;
      pointer-events: auto;
    `;
    button.addEventListener('click', () => this.toggleSettings());
    this.container.appendChild(button);
  }

  private createSettingsPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: fixed;
      top: 50px;
      left: 10px;
      background: rgba(0, 0, 0, 0.9);
      padding: 20px;
      border-radius: 8px;
      color: white;
      z-index: 10000;
      pointer-events: auto;
    `;

    panel.innerHTML = `
      <h3 style="margin: 0 0 16px 0">チャット設定</h3>
      <div style="margin-bottom: 12px">
        <label>デザイン</label><br>
        <select data-setting="design">
          <option value="topRight" ${this.settings.design === 'topRight' ? 'selected' : ''}>右上</option>
          <option value="bottomRight" ${this.settings.design === 'bottomRight' ? 'selected' : ''}>右下</option>
        </select>
      </div>
      <div style="margin-bottom: 12px">
        <label>ユーザー名を表示</label>
        <input type="checkbox" data-setting="showUsername" ${this.settings.showUsername ? 'checked' : ''}>
      </div>
      <div style="margin-bottom: 12px">
        <label>文字サイズ (px)</label><br>
        <input type="range" min="10" max="24" value="${this.settings.fontSize}" data-setting="fontSize">
        <span>${this.settings.fontSize}px</span>
      </div>
      <div style="margin-bottom: 12px">
        <label>メッセージ幅 (px)</label><br>
        <input type="range" min="200" max="500" value="${this.settings.messageWidth}" data-setting="messageWidth">
        <span>${this.settings.messageWidth}px</span>
      </div>
      <div style="margin-bottom: 12px">
        <label>透明度</label><br>
        <input type="range" min="1" max="100" value="${this.settings.opacity * 100}" data-setting="opacity">
        <span>${this.settings.opacity}</span>
      </div>
    `;

    panel.querySelectorAll('input[type="range"]').forEach(input => {
      input.addEventListener('input', async (e) => {
        const target = e.target as HTMLInputElement;
        const setting = target.dataset.setting as keyof ChatSettings;
        const value = Number(target.value);
        
        // 型安全な設定の更新
        if (setting === 'opacity') {
          this.settings = {
            ...this.settings,
            [setting]: value / 100
          };
        } else if (setting === 'fontSize' || setting === 'messageWidth') {
          this.settings = {
            ...this.settings,
            [setting]: value
          };
        }
        
        // 表示値を更新
        const span = target.nextElementSibling as HTMLElement;
        span.textContent = setting === 'opacity' ? String(this.settings[setting]) : `${value}px`;
        
        // 既存のメッセージに新しい設定を適用
        this.applySettingsToAllMessages();
    
        // 設定を保存
        await chrome.storage.local.set({ 'youtube-chat-settings': this.settings });
      });
    })

    const checkbox = panel.querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkbox.addEventListener('change', async (e) => {
      const target = e.target as HTMLInputElement;
      this.settings.showUsername = target.checked;
      this.applySettingsToAllMessages();
      await chrome.storage.local.set({ 'youtube-chat-settings': this.settings });
    });

    // デザイン選択のイベントリスナーを追加
    const designSelect = panel.querySelector('select[data-setting="design"]') as HTMLSelectElement;
    designSelect.addEventListener('change', () => {
      this.settings = {
        ...this.settings,
        design: designSelect.value as ChatSettings['design']
      };
      this.applySettingsToAllMessages();
      chrome.storage.local.set({ 'youtube-chat-settings': this.settings });
    });

    return panel;
  }

  private toggleSettings(): void {
    const existingPanel = document.querySelector('.chat-settings-panel');
    if (existingPanel) {
      existingPanel.remove();
    } else {
      const panel = this.createSettingsPanel();
      panel.classList.add('chat-settings-panel');
      document.body.appendChild(panel);
    }
  }

  private applySettingsToAllMessages(): void {
    this.container.querySelectorAll('[data-message-id]').forEach(messageEl => {
      if (messageEl instanceof HTMLElement) {
        const authorEl = messageEl.querySelector('.chat-author') as HTMLElement;
        const messageTextEl = messageEl.querySelector('.chat-message') as HTMLElement;
        
        if (authorEl && messageTextEl) {
          this.applyMessageStyles(messageEl, authorEl, messageTextEl);
        }
      }
    });
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
    const messageContainer = document.createElement('div');
    messageContainer.dataset.messageId = message.id;
    messageContainer.className = 'chat-message-container';
    
    const authorSpan = document.createElement('span');
    authorSpan.className = 'chat-author';
    authorSpan.textContent = `${message.author}:`;
    
    const messageSpan = document.createElement('span');
    messageSpan.className = 'chat-message';
    messageSpan.textContent = message.message;
    
    messageContainer.appendChild(authorSpan);
    messageContainer.appendChild(messageSpan);
    
    this.applyMessageStyles(messageContainer, authorSpan, messageSpan);
    return messageContainer;
  }
  
  private applyMessageStyles(
    container: HTMLElement, 
    author: HTMLElement, 
    message: HTMLElement
  ): void {
    // コンテナのスタイル
    container.style.cssText = `
      background: rgba(0, 0, 0, ${this.settings.opacity});
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 8px;
      width: ${this.settings.messageWidth}px;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      animation: slideIn 0.3s ease-out;
    `;
  
    // 著者名のスタイル
    author.style.cssText = `
      font-weight: bold;
      font-size: ${this.settings.fontSize}px;
      margin-bottom: 4px;
      line-height: 1.2;
      display: ${this.settings.showUsername ? 'block' : 'none'};
    `;
  
    // メッセージ本文のスタイル
    message.style.cssText = `
      font-size: ${this.settings.fontSize}px;
      word-wrap: break-word;
      white-space: pre-wrap;
      line-height: 1.4;
    `;
  }
  
  public reset(): void {
    this.container.innerHTML = '';
    this.messages = [];
    this.createSettingsButton();
  }

  public updatePosition(): void {
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

  private updateDesign(): void {
    // コンテナの配置を更新
    if (this.settings.design === 'topRight') {
      this.container.style.top = '20px';
      this.container.style.bottom = 'auto';
      this.container.style.right = '20px';
    } else if (this.settings.design === 'bottomRight') {
      this.container.style.top = 'auto';
      this.container.style.bottom = '20px';
      this.container.style.right = '20px';
    }
  }
  
  public updateSettings(settings: ChatSettings): void {
    this.settings = settings;
    this.updateDesign();
    this.applySettingsToAllMessages();
  }
}