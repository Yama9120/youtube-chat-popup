import { ChatSettings } from '../types/types';

export class SettingsUI {
  private container: HTMLElement;

  constructor(
    private settings: ChatSettings,
    private onSettingsChange: (settings: ChatSettings) => void
  ) {
    this.container = this.createSettingsPanel();
    this.createSettingsButton();
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
    `;
    button.addEventListener('click', () => this.toggleSettings());
    document.body.appendChild(button);
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
      display: none;
    `;

    this.updatePanelContent(panel);
    document.body.appendChild(panel);
    return panel;
  }

  private updatePanelContent(panel: HTMLElement): void {
    panel.innerHTML = `
      <h3 style="margin: 0 0 16px 0">チャット設定</h3>
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

    this.attachEventListeners(panel);
  }

  private attachEventListeners(panel: HTMLElement): void {
    panel.querySelectorAll('input[type="range"]').forEach(input => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const setting = target.dataset.setting as keyof ChatSettings;
        const value = Number(target.value);
        
        const newSettings = { ...this.settings };
        if (setting === 'opacity') {
          newSettings[setting] = value / 100;
        } else {
          newSettings[setting] = value;
        }
        
        this.settings = newSettings;
        this.onSettingsChange(newSettings);
        
        // Update display value
        const span = target.nextElementSibling as HTMLElement;
        span.textContent = setting === 'opacity' ? String(newSettings[setting]) : `${value}px`;
      });
    });
  }

  private toggleSettings(): void {
    this.container.style.display = 
      this.container.style.display === 'none' ? 'block' : 'none';
  }
}