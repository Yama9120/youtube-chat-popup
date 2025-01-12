import { ChatSettings } from '../types/types';

export const DEFAULT_SETTINGS: ChatSettings = {
  fontSize: 14,
  messageWidth: 300,
  messageHeight: 80,
  opacity: 0.8
};

export class SettingsManager {
  private static readonly STORAGE_KEY = 'youtube-chat-settings';

  static async saveSettings(settings: ChatSettings): Promise<void> {
    await chrome.storage.local.set({ [this.STORAGE_KEY]: settings });
  }

  static async loadSettings(): Promise<ChatSettings> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      return result[this.STORAGE_KEY] || DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return DEFAULT_SETTINGS;
    }
  }
}