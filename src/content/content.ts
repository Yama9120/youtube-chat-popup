import { ChatObserver } from './ChatObserver';
import { OverlayManager } from './OverlayManager';

const overlay = new OverlayManager();
const observer = new ChatObserver((message) => {
  overlay.addMessage(message);
});

// Start observing when video is in fullscreen
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    observer.start();
  } else {
    observer.stop();
  }
});

// Initial start if already on a YouTube video page
if (window.location.pathname.includes('/watch')) {
  observer.start();
}