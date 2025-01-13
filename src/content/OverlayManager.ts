import { ChatMessage, ChatSettings, OverlayOptions, MessageConfig, Position, ChatDesign } from '../types/types';

export class OverlayManager {
  private settingsButton: HTMLElement;
  private container: HTMLElement;
  private messages: ChatMessage[] = [];
  private messageConfig: MessageConfig;
  private position: Position;
  private settings: ChatSettings = {
    fontSize: 14,
    messageWidth: 300,
    opacity: 0.8,
    showUsername: true,
    design: 'topRight',
    maxMessages: 200
  };

  constructor(options: Partial<OverlayOptions> = {}) {
    this.settings = {
      fontSize: 14,
      messageWidth: 300,
      opacity: 0.8,
      showUsername: true,
      design: 'topRight',
      maxMessages: 200  // デフォルト値
    };
  
    // デザインごとの設定
    const designConfigs: Record<ChatDesign, Omit<MessageConfig, 'maxMessages'>> = {
      bottomBubble: {
        maxLength: 30,
        duration: 5000,
      },
      topRight: {
        maxLength: 200,
        duration: 5000,
      },
      topLeft: {
        maxLength: 200,
        duration: 5000,
      },
      bottomRight: {
        maxLength: 200,
        duration: 5000,
      },
      bottomLeft: {
        maxLength: 200,
        duration: 5000,
      }
    };
  
    this.position = options.position || 'right';
    
    // MessageConfigを作成（maxMessagesは設定から取得）
    this.messageConfig = {
      ...designConfigs[this.settings.design],
      maxMessages: this.settings.maxMessages
    };
  
    this.container = this.createContainer();
    this.settingsButton = this.createSettingsButton();
  }

  public updateSettings(settings: ChatSettings): void {
    this.settings = settings;
    
    // デザイン変更時にメッセージ設定も更新
    const designConfigs: Record<ChatDesign, MessageConfig> = {
      bottomBubble: {
        maxLength: 30,
        duration: 5000,
        maxMessages: this.settings.maxMessages
      },
      topRight: {
        maxLength: 200,
        duration: 5000,
        maxMessages: this.settings.maxMessages
      },
      topLeft: {
        maxLength: 200,
        duration: 5000,
        maxMessages: this.settings.maxMessages
      },
      bottomRight: {
        maxLength: 200,
        duration: 5000,
        maxMessages: this.settings.maxMessages
      },
      bottomLeft: {
        maxLength: 200,
        duration: 5000,
        maxMessages: this.settings.maxMessages
      }
    };
    
    this.messageConfig = designConfigs[this.settings.design];

    // 既存のメッセージを制限に合わせて調整
    while (this.messages.length > this.messageConfig.maxMessages) {
      const oldMessage = this.messages.shift();
      const oldElement = this.container.querySelector(`[data-message-id="${oldMessage?.id}"]`);
      oldElement?.remove();
    }

    this.updateDesign();
    this.applySettingsToAllMessages();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      ${this.position}: 20px;
      top: 20px;
      z-index: 9999;
      pointer-events: none;
    `;
    document.body.appendChild(container);
    return container;
  }

  private shouldDisplayMessage(message: string, isSpecialContent: boolean = false): boolean {
    // HTMLタグを除いた実際のテキスト長さを計算
    const textLength = this.stripHtmlTags(message).length;
    
    // デザインに応じた文字数制限
    const maxLength = this.settings.design === 'bottomBubble'
      ? (isSpecialContent ? 5000 : 30)  // bottomBubbleは通常30文字、スタンプは5000文字
      : (isSpecialContent ? 5000 : (this.messageConfig.maxLength || 200));
  
    console.log(`Message length check: ${textLength} / ${maxLength}`);
    return textLength <= maxLength;
  }

  private stripHtmlTags(html: string): string {
    // HTMLタグを除去し、実際のテキスト長さを計算
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  }

  private cleanupOldMessages(): void {
    const now = Date.now();
    this.messages = this.messages.filter(message => {
      if (now - message.timestamp > this.messageConfig.duration) {
        const element = this.container.querySelector(`[data-message-id="${message.id}"]`);
        element?.remove();
        return false;
      }
      return true;
    });
  }

  public addMessage(message: ChatMessage): void {
    // スタンプかどうかを判断する関数
    const isStampOrSpecialContent = (messageContent: string) => {
      // スタンプや特殊な画像要素が含まれているかチェック
      return /<img[^>]+class="(emoji|small-emoji)"/.test(messageContent);
    };
  
    const isSpecialContent = isStampOrSpecialContent(message.message);
  
    if (!this.shouldDisplayMessage(message.message, isSpecialContent)) {
      return;
    }
  
    // 残りの実装は同じ
    const messageElement = this.createMessageElement(message);
    this.container.appendChild(messageElement);
    
    this.messages.push(message);
    if (this.messages.length > this.messageConfig.maxMessages) {
      const oldMessage = this.messages.shift();
      const oldElement = this.container.querySelector(`[data-message-id="${oldMessage?.id}"]`);
      oldElement?.remove();
    }
  
    setTimeout(() => {
      messageElement.remove();
      this.messages = this.messages.filter(m => m.id !== message.id);
    }, this.messageConfig.duration);
  }

  private createMessageElement(message: ChatMessage): HTMLElement {
    const messageContainer = document.createElement('div');
    messageContainer.dataset.messageId = message.id;
    
    const authorEl = document.createElement('span');
    const messageEl = document.createElement('span');
    
    authorEl.className = 'chat-author';
    messageEl.className = 'chat-message';
    
    authorEl.textContent = message.author;
    // HTMLをそのまま設定
    messageEl.innerHTML = message.message;
    
    // CORS設定と代替テキスト処理
    messageEl.querySelectorAll('img').forEach(img => {
      if (img instanceof HTMLImageElement) {
        img.crossOrigin = 'anonymous';
        img.referrerPolicy = 'no-referrer';
        
        img.onerror = () => {
          const altText = img.getAttribute('alt');
          if (altText) {
            const span = document.createElement('span');
            span.textContent = `:${altText}:`;
            span.style.opacity = '0.7';
            img.replaceWith(span);
          }
        };
      }
    });
     
    messageContainer.appendChild(authorEl);
    messageContainer.appendChild(messageEl); 
     
    this.applyMessageStyles(messageContainer, authorEl, messageEl);
    return messageContainer;
  }

  private createSettingsButton(): HTMLElement {
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
    document.body.appendChild(button);  // containerではなく、document.bodyに直接追加
    return button;
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
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px;">
          <button 
            class="design-btn ${this.settings.design === 'topLeft' ? 'active' : ''}" 
            data-design="topLeft"
            style="padding: 8px; text-align: center;">
            左上
          </button>
          <button 
            class="design-btn ${this.settings.design === 'topRight' ? 'active' : ''}" 
            data-design="topRight"
            style="padding: 8px; text-align: center;">
            右上
          </button>
          <button 
            class="design-btn ${this.settings.design === 'bottomLeft' ? 'active' : ''}" 
            data-design="bottomLeft"
            style="padding: 8px; text-align: center;">
            左下
          </button>
          <button 
            class="design-btn ${this.settings.design === 'bottomRight' ? 'active' : ''}" 
            data-design="bottomRight"
            style="padding: 8px; text-align: center;">
            右下
          </button>
        </div>
        <div style="margin-top: 8px;">
          <button 
            class="design-btn ${this.settings.design === 'bottomBubble' ? 'active' : ''}" 
            data-design="bottomBubble"
            style="padding: 8px; text-align: center; width: 100%;">
            吹き出し
          </button>
        </div>
      </div>
      <div style="margin-bottom: 12px">
        <label>ユーザー名を表示</label>
        <input type="checkbox" data-setting="showUsername" ${this.settings.showUsername ? 'checked' : ''}>
      </div>
      <div style="margin-bottom: 12px">
        <label>同時表示数</label><br>
        <input type="range" min="5" max="50" value="${this.settings.maxMessages}" data-setting="maxMessages">
        <span>${this.settings.maxMessages}件</span>
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

    panel.querySelectorAll('.design-btn').forEach(button => {
      (button as HTMLElement).style.cssText = `
        background: rgba(50, 50, 50, 0.8);
        border: 2px solid transparent;
        border-radius: 4px;
        color: white;
        cursor: pointer;
        padding: 8px;
        transition: all 0.2s;
      `;
    });

    panel.querySelector('.design-btn.active')?.setAttribute('style', `
      background: rgba(50, 50, 50, 0.8);
      border: 2px solid #fff;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      padding: 8px;
    `);

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
        } else if (setting === 'fontSize' || setting === 'messageWidth' || setting === 'maxMessages') {
          this.settings = {
            ...this.settings,
            [setting]: value
          };
        }
        
        // 表示値を更新
        const span = target.nextElementSibling as HTMLElement;
        if (setting === 'opacity') {
          span.textContent = String(this.settings[setting]);
        } else if (setting === 'maxMessages') {
          span.textContent = `${value}件`;
        } else {
          span.textContent = `${value}px`;
        }
        
        // 設定を即時反映
        this.updateSettings(this.settings);
        
        // 設定を保存
        await chrome.storage.local.set({ 'youtube-chat-settings': this.settings });
      });
    });
    
    const checkbox = panel.querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkbox.addEventListener('change', async (e) => {
      const target = e.target as HTMLInputElement;
      this.settings.showUsername = target.checked;
      this.applySettingsToAllMessages();
      await chrome.storage.local.set({ 'youtube-chat-settings': this.settings });
    });

    // デザイン選択のイベントリスナー
    panel.querySelectorAll('.design-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const target = e.target as HTMLButtonElement;
        const newDesign = target.dataset.design as ChatSettings['design'];
        
        // アクティブ状態を更新
        panel.querySelectorAll('.design-btn').forEach(btn => {
          (btn as HTMLElement).style.border = '2px solid transparent';
        });
        target.style.border = '2px solid #fff';
        
        this.settings = {
          ...this.settings,
          design: newDesign
        };
        
        this.updateDesign();
        await chrome.storage.local.set({ 'youtube-chat-settings': this.settings });
      });
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

  private applyMessageStyles(
    container: HTMLElement,
    author: HTMLElement,
    message: HTMLElement
  ): void {

    if (this.settings.design === 'bottomBubble') {
      // ランダム値を生成（0-100）
      const random = Math.random() * 100;
      let randomX;
      let randomY;
      
      if (random < 40) {
          // 40%の確率で左側（-45%から-20%）
          randomX = Math.random() * 30 - 45;
          randomY = Math.random() * 170 + 50;
      } else if (random < 80) {
          // 40%の確率で右側（20%から45%）
          randomX = Math.random() * 30 + 15;
          randomY = Math.random() * 170 + 50;
      } else {
          // 20%の確率で中央（-20%から20%）
          randomX = Math.random() * 40 - 20;
          randomY = Math.random() * 100 + 50;
      }
      
      container.style.cssText = `
        background: rgba(0, 0, 0, ${this.settings.opacity});
        color: white;
        padding: 12px 20px;
        border-radius: 20px;
        width: ${this.settings.messageWidth}px;
        position: absolute;
        left: ${50 + randomX}%;
        bottom: ${randomY}px;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        animation: fadeInOut 5s ease-in-out;
      `;
  
      author.style.cssText = `
        font-weight: bold;
        font-size: ${this.settings.fontSize}px;
        margin-bottom: 4px;
        line-height: 1.2;
        display: ${this.settings.showUsername ? 'block' : 'none'};
        text-align: center;
      `;
  
      message.style.cssText = `
        font-size: ${this.settings.fontSize}px;
        word-wrap: break-word;
        white-space: pre-wrap;
        line-height: 1.4;
        text-align: center;
      `;

    } else {
      // 通常のデザイン用のスタイル（既存のスタイル）
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
  
      author.style.cssText = `
        font-weight: bold;
        font-size: ${this.settings.fontSize}px;
        margin-bottom: 4px;
        line-height: 1.2;
        display: ${this.settings.showUsername ? 'block' : 'none'};
      `;
  
      message.style.cssText = `
        font-size: ${this.settings.fontSize}px;
        word-wrap: break-word;
        white-space: pre-wrap;
        line-height: 1.4;
      `;
    }

    // 絵文字のスタイル設定
    const size = this.settings.fontSize * 1.8;
    message.querySelectorAll('img').forEach(img => {
      if (img instanceof HTMLImageElement) {
        Object.assign(img.style, {
          height: `${size}px`,
          width: 'auto',
          maxHeight: `${size}px`,
          verticalAlign: 'middle',
          margin: '0 2px'
        });
      }
    });

    // 絵文字コンテナのスタイル
    message.querySelectorAll('.emoji, yt-emoji').forEach(container => {
      if (container instanceof HTMLElement) {
        Object.assign(container.style, {
          display: 'inline-flex',
          verticalAlign: 'middle'
        });
      }
    });
  }

  public reset(): void {
    this.container.innerHTML = '';
    this.messages = [];
    this.createSettingsButton();
  }

  public updatePosition(): void {
    if (this.settings.design !== 'bottomBubble') {
      const isFullscreen = document.fullscreenElement !== null;
      if (isFullscreen) {
        this.container.style.top = '20px';
        this.container.style.right = '20px';
      } else {
        this.container.style.top = '60px';
        this.container.style.right = '10px';
      }
    }
  }

  private updateDesign(): void {
    // アニメーションスタイルの追加
    this.ensureAnimationStyles();
    
    // コンテナのスタイルをリセット
    this.container.style.cssText = '';
  
    // 基本のコンテナスタイル
    const baseStyles = `
      position: fixed;
      z-index: 9999;
      pointer-events: none;
    `;
  
    if (this.settings.design === 'bottomBubble') {
      this.container.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 400px;
        pointer-events: none;
        z-index: 9999;
      `;
    } else {
      // 他のデザインの位置設定
      this.container.style.cssText = baseStyles;
      switch (this.settings.design) {
        case 'topRight':
          this.container.style.top = '20px';
          this.container.style.right = '20px';
          break;
        case 'topLeft':
          this.container.style.top = '20px';
          this.container.style.left = '20px';
          break;
        case 'bottomRight':
          this.container.style.bottom = '20px';
          this.container.style.right = '20px';
          break;
        case 'bottomLeft':
          this.container.style.bottom = '20px';
          this.container.style.left = '20px';
          break;
      }
    }
  }

  private ensureAnimationStyles(): void {
    if (!document.querySelector('#chat-animations')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'chat-animations';
      styleSheet.textContent = `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(-50%) scale(0.9); }
          10% { opacity: 1; transform: translateX(-50%) scale(1); }
          90% { opacity: 1; transform: translateX(-50%) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) scale(0.9); }
        }
      `;
      document.head.appendChild(styleSheet);
    }
  }
}