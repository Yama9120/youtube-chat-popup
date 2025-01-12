import { ChatObserver } from './ChatObserver';
import { OverlayManager } from './OverlayManager';
import { SettingsUI } from './SettingsUI';
import { SettingsManager } from '../utils/SettingsManager';

class YouTubeChatController {
  private observer: ChatObserver | null = null;
  private overlay: OverlayManager;
  private initializeTimeout: number | null = null;
  private settings?: SettingsUI;

  constructor() {
    this.overlay = new OverlayManager();

    // 設定の初期化
    SettingsManager.loadSettings().then(settings => {
      this.settings = new SettingsUI(settings, (newSettings) => {
        this.overlay.updateSettings(newSettings);
        SettingsManager.saveSettings(newSettings);
      });
      this.overlay.updateSettings(settings);
    });
    
    // ページ読み込み完了後に初期化
    if (document.readyState === 'complete') {
      this.initialize();
    } else {
      window.addEventListener('load', () => this.initialize());
    }
  }

  private initialize(): void {
    // 初期化
    this.initializeObserver();

    // イベントリスナーの設定
    document.addEventListener('fullscreenchange', () => this.handleViewModeChange());
    document.addEventListener('webkitfullscreenchange', () => this.handleViewModeChange());

    // プレイヤーコンテナの監視
    this.observePlayerContainer();
  }

  private handleViewModeChange(): void {
    if (this.initializeTimeout) {
      clearTimeout(this.initializeTimeout);
    }

    // 画面モード変更後、少し待ってから再初期化
    this.initializeTimeout = window.setTimeout(() => {
      this.reinitialize();
    }, 1500);
  }

  private observePlayerContainer(): void {
    const videoContainer = document.querySelector('#player-container');
    if (videoContainer) {
      const containerObserver = new MutationObserver(() => this.handleViewModeChange());
      containerObserver.observe(videoContainer, {
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }
  }

  private reinitialize(): void {
    // console.log('Reinitializing chat observer...');
    if (this.observer) {
      this.observer.stop();
    }
    this.initializeObserver();
  }

  private initializeObserver(): void {
    this.observer = new ChatObserver((message) => {
      this.overlay.addMessage(message);
    });
    this.observer.start();
  }
}

// YouTubeの動画ページでのみ初期化
if (window.location.pathname.includes('/watch')) {
  const controller = new YouTubeChatController();
}