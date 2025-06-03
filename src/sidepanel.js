class SidePanel {
  constructor() {
    this.iframe = document.getElementById('difyIframe');
    this.noUrlMessage = document.getElementById('noUrlMessage');
    this.difyFrame = document.getElementById('difyFrame');
    this.loadingMessage = document.getElementById('loadingMessage');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.extractBtn = document.getElementById('extractBtn');
    this.openSettingsBtn = document.getElementById('openSettingsBtn');
    
    this.init();
  }
  
  async init() {
    this.bindEvents();
    await this.loadDifyApp();
  }
  
  bindEvents() {
    this.settingsBtn.addEventListener('click', () => this.openSettings());
    this.extractBtn.addEventListener('click', () => this.extractPageContent());
    this.openSettingsBtn.addEventListener('click', () => this.openSettings());
    
    this.iframe.addEventListener('load', () => {
      this.hideLoading();
    });
  }
  
  async loadDifyApp() {
    try {
      const { difyAppUrl } = await chrome.storage.sync.get(['difyAppUrl']);
      
      if (!difyAppUrl || difyAppUrl.trim() === '') {
        this.showNoUrlMessage();
        return;
      }
      
      this.showLoading();
      this.iframe.src = difyAppUrl;
      this.showDifyFrame();
      
    } catch (error) {
      console.error('Failed to load Dify app:', error);
      this.showNoUrlMessage();
    }
  }
  
  showNoUrlMessage() {
    this.noUrlMessage.classList.remove('hidden');
    this.difyFrame.classList.add('hidden');
    this.loadingMessage.classList.add('hidden');
  }
  
  showDifyFrame() {
    this.noUrlMessage.classList.add('hidden');
    this.difyFrame.classList.remove('hidden');
  }
  
  showLoading() {
    this.loadingMessage.classList.remove('hidden');
  }
  
  hideLoading() {
    this.loadingMessage.classList.add('hidden');
  }
  
  openSettings() {
    chrome.runtime.openOptionsPage();
  }
  
  async extractPageContent() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        return;
      }
      
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractContent' });
      
      if (response && response.content) {
        this.sendContentToDify(response);
      }
      
    } catch (error) {
      console.error('Failed to extract page content:', error);
    }
  }
  
  sendContentToDify(pageData) {
    const message = `ページタイトル: ${pageData.title}\nURL: ${pageData.url}\n\n内容:\n${pageData.content}`;
    
    try {
      this.iframe.contentWindow.postMessage({
        type: 'DIFY_EXTENSION_MESSAGE',
        content: message
      }, '*');
    } catch (error) {
      console.error('Failed to send content to Dify:', error);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SidePanel();
});