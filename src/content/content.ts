import { ChatObserver } from './ChatObserver';
import { OverlayManager } from './OverlayManager';

class YouTubeChatController {
  private observer: ChatObserver | null = null;
  private overlay: OverlayManager;

  constructor() {
    this.overlay = new OverlayManager();
    this.initializeObserver();

    // 画面モード変更の検知
    document.addEventListener('fullscreenchange', () => this.reinitialize());
    document.addEventListener('webkitfullscreenchange', () => this.reinitialize());
    
    // シアターモードなどの変更検知
    const videoContainer = document.querySelector('#player-container');
    if (videoContainer) {
      const containerObserver = new MutationObserver(() => this.reinitialize());
      containerObserver.observe(videoContainer, {
        attributes: true,
        childList: true,
        subtree: true
      });
    }
  }

  private reinitialize(): void {
    console.log('Reinitializing chat observer...');
    if (this.observer) {
      this.observer.stop();
    }
    
    setTimeout(() => {
      this.initializeObserver();
    }, 1000);
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