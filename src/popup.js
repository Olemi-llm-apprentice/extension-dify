class Popup {
  constructor() {
    this.settingsBtn = document.getElementById('settingsBtn');
    this.openSidePanelBtn = document.getElementById('openSidePanelBtn');
    this.extractContentBtn = document.getElementById('extractContentBtn');
    this.toggleBtn = document.getElementById('toggleBtn');
    this.toggleText = document.getElementById('toggleText');
    this.moreSettingsBtn = document.getElementById('moreSettingsBtn');
    this.difyUrlInput = document.getElementById('difyUrlInput');
    this.saveUrlBtn = document.getElementById('saveUrlBtn');
    this.statusText = document.getElementById('statusText');
    this.currentSite = document.getElementById('currentSite');
    
    this.init();
  }
  
  async init() {
    this.bindEvents();
    await this.loadSettings();
    await this.updateStatus();
  }
  
  bindEvents() {
    this.settingsBtn.addEventListener('click', () => this.openSettings());
    this.moreSettingsBtn.addEventListener('click', () => this.openSettings());
    this.openSidePanelBtn.addEventListener('click', () => this.openSidePanel());
    this.extractContentBtn.addEventListener('click', () => this.extractContent());
    this.toggleBtn.addEventListener('click', () => this.toggleExtension());
    this.saveUrlBtn.addEventListener('click', () => this.saveUrl());
    
    this.difyUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.saveUrl();
      }
    });
  }
  
  async loadSettings() {
    try {
      const { difyAppUrl, isEnabled } = await chrome.storage.sync.get(['difyAppUrl', 'isEnabled']);
      
      if (difyAppUrl) {
        this.difyUrlInput.value = difyAppUrl;
      }
      
      this.updateToggleButton(isEnabled !== false);
      
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }
  
  async updateStatus() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const { difyAppUrl, isEnabled } = await chrome.storage.sync.get(['difyAppUrl', 'isEnabled']);
      
      if (tab && tab.url) {
        const hostname = new URL(tab.url).hostname;
        this.currentSite.textContent = hostname;
      }
      
      if (!difyAppUrl) {
        this.statusText.textContent = 'URL未設定';
        this.statusText.style.color = '#ef4444';
      } else if (!isEnabled) {
        this.statusText.textContent = '無効';
        this.statusText.style.color = '#6b7280';
      } else {
        this.statusText.textContent = '有効';
        this.statusText.style.color = '#10b981';
      }
      
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }
  
  updateToggleButton(isEnabled) {
    if (isEnabled) {
      this.toggleBtn.classList.add('enabled');
      this.toggleText.textContent = '無効化';
    } else {
      this.toggleBtn.classList.remove('enabled');
      this.toggleText.textContent = '有効化';
    }
  }
  
  async openSidePanel() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.sidePanel.open({ tabId: tab.id });
      window.close();
    } catch (error) {
      console.error('Failed to open side panel:', error);
    }
  }
  
  async extractContent() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        console.error('No active tab found');
        return;
      }
      
      console.log('🔍 [Dify Extension] Extracting content from tab:', tab.id);
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractContent' });
      
      console.log('🔍 [Dify Extension] Content extraction response:', response);
      
      if (response && response.content) {
        console.log('🔍 [Dify Extension] Content extracted, sending to side panel');
        chrome.runtime.sendMessage({ 
          action: 'sendContentToSidePanel', 
          data: response 
        });
        await this.openSidePanel();
      } else {
        console.error('No content extracted from page');
      }
      
    } catch (error) {
      console.error('Failed to extract content:', error);
    }
  }
  
  async toggleExtension() {
    try {
      const { isEnabled } = await chrome.storage.sync.get(['isEnabled']);
      const newState = !isEnabled;
      
      await chrome.storage.sync.set({ isEnabled: newState });
      this.updateToggleButton(newState);
      await this.updateStatus();
      
    } catch (error) {
      console.error('Failed to toggle extension:', error);
    }
  }
  
  async saveUrl() {
    try {
      const url = this.difyUrlInput.value.trim();
      
      if (url && !this.isValidUrl(url)) {
        alert('有効なURLを入力してください');
        return;
      }
      
      await chrome.storage.sync.set({ difyAppUrl: url });
      await this.updateStatus();
      
      this.saveUrlBtn.textContent = '保存済み';
      this.saveUrlBtn.style.background = '#10b981';
      
      setTimeout(() => {
        this.saveUrlBtn.textContent = '保存';
        this.saveUrlBtn.style.background = '';
      }, 2000);
      
    } catch (error) {
      console.error('Failed to save URL:', error);
    }
  }
  
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
  
  openSettings() {
    chrome.runtime.openOptionsPage();
    window.close();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Popup();
});