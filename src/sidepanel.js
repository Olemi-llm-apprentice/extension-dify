class SidePanel {
  constructor() {
    this.iframe = document.getElementById('difyIframe');
    this.noUrlMessage = document.getElementById('noUrlMessage');
    this.difyFrame = document.getElementById('difyFrame');
    this.loadingMessage = document.getElementById('loadingMessage');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.extractBtn = document.getElementById('extractBtn');
    this.openSettingsBtn = document.getElementById('openSettingsBtn');
    this.contentPreview = document.getElementById('contentPreview');
    this.contentTitle = document.getElementById('contentTitle');
    this.contentInfo = document.getElementById('contentInfo');
    this.contentText = document.getElementById('contentText');
    this.copyContentBtn = document.getElementById('copyContentBtn');
    this.closeContentBtn = document.getElementById('closeContentBtn');
    
    this.init();
  }
  
  async init() {
    this.bindEvents();
    this.setupMessageListener();
    await this.loadDifyApp();
    await this.checkForPendingContent();
  }
  
  bindEvents() {
    this.settingsBtn.addEventListener('click', () => this.openSettings());
    this.extractBtn.addEventListener('click', () => this.extractPageContent());
    this.openSettingsBtn.addEventListener('click', () => this.openSettings());
    this.copyContentBtn.addEventListener('click', () => this.copyContentToClipboard());
    this.closeContentBtn.addEventListener('click', () => this.hideContentPreview());
    
    this.iframe.addEventListener('load', () => {
      this.hideLoading();
    });
  }
  
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('🔍 [Dify Extension] Side panel received message:', request.action, request);
      if (request.action === 'receiveExtractedContent') {
        console.log('🔍 [Dify Extension] Handling extracted content in side panel');
        this.handleExtractedContent(request.data);
      }
    });
  }
  
  async checkForPendingContent() {
    try {
      console.log('🔍 [Dify Extension] Checking for pending content');
      const response = await chrome.runtime.sendMessage({ action: 'getSidePanelContent' });
      if (response && response.success && response.data) {
        console.log('🔍 [Dify Extension] Found pending content, processing');
        this.handleExtractedContent(response.data);
      } else {
        console.log('🔍 [Dify Extension] No pending content found');
      }
    } catch (error) {
      console.error('Error checking for pending content:', error);
    }
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
  
  handleExtractedContent(pageData) {
    console.log('🔍 [Dify Extension] Handling extracted content:', pageData);
    this.showContentPreview(pageData);
    this.currentContent = pageData;
    this.attemptDifyIntegration(pageData);
  }
  
  showContentPreview(pageData) {
    this.contentTitle.textContent = pageData.title;
    this.contentInfo.textContent = `${pageData.extractMethod} | ${pageData.contentLength}文字 | ${pageData.url}`;
    this.contentText.textContent = pageData.content;
    this.contentPreview.classList.remove('hidden');
    
    this.showTemporaryNotification('コンテンツを抽出しました！クリップボードにコピーされています。');
    
    this.copyContentToClipboard();
  }
  
  async waitForIframeLoad() {
    return new Promise((resolve) => {
      if (this.iframe.contentDocument && this.iframe.contentDocument.readyState === 'complete') {
        resolve();
      } else {
        this.iframe.addEventListener('load', resolve, { once: true });
      }
    });
  }
  
  attemptDifyIntegration(pageData) {
    const message = `【ページ情報】\nタイトル: ${pageData.title}\nURL: ${pageData.url}\n抽出方法: ${pageData.extractMethod}\n文字数: ${pageData.contentLength}文字\n\n【本文】\n${pageData.content}`;
    
    this.waitForIframeLoad().then(() => {
      this.tryInjectContentIntoChat(message);
    });
  }
  
  tryInjectContentIntoChat(message) {
    try {
      console.log('🔍 [Dify Extension] Attempting to inject content into Dify chat');
      
      setTimeout(() => {
        try {
          const iframeDoc = this.iframe.contentDocument;
          if (iframeDoc) {
            console.log('🔍 [Dify Extension] Access to iframe document successful');
            this.findAndFillInput(iframeDoc, message);
          } else {
            console.log('🔍 [Dify Extension] Cannot access iframe document (CORS restriction)');
            this.showManualInstructions();
          }
        } catch (error) {
          console.log('🔍 [Dify Extension] Cross-origin iframe access denied:', error);
          this.showManualInstructions();
        }
      }, 2000);
      
    } catch (error) {
      console.error('Failed to inject content into chat:', error);
      this.showManualInstructions();
    }
  }
  
  findAndFillInput(doc, message) {
    const selectors = [
      'textarea[placeholder*="メッセージ"]',
      'textarea[placeholder*="message"]', 
      'textarea[placeholder*="Message"]',
      'input[type="text"][placeholder*="メッセージ"]',
      'input[type="text"][placeholder*="message"]',
      '.chat-input textarea',
      '.message-input textarea',
      '[role="textbox"]',
      'textarea',
      'input[type="text"]'
    ];
    
    let inputElement = null;
    for (const selector of selectors) {
      inputElement = doc.querySelector(selector);
      if (inputElement) {
        console.log('🔍 [Dify Extension] Found input element:', selector);
        break;
      }
    }
    
    if (inputElement) {
      inputElement.focus();
      inputElement.value = message;
      
      ['input', 'change', 'keyup'].forEach(eventType => {
        inputElement.dispatchEvent(new Event(eventType, { bubbles: true }));
      });
      
      this.showTemporaryNotification('コンテンツをDifyアプリに自動入力しました！');
    } else {
      console.log('🔍 [Dify Extension] No suitable input element found');
      this.showManualInstructions();
    }
  }
  
  showManualInstructions() {
    this.showTemporaryNotification('Difyアプリのチャット欄にペーストしてください。コンテンツはクリップボードにコピー済みです。', 5000);
  }
  
  showTemporaryNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 60px;
      left: 16px;
      right: 16px;
      background: #10b981;
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      z-index: 1000;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, duration);
  }
  
  async copyContentToClipboard() {
    if (!this.currentContent) return;
    
    const message = `【ページ情報】\nタイトル: ${this.currentContent.title}\nURL: ${this.currentContent.url}\n抽出方法: ${this.currentContent.extractMethod}\n文字数: ${this.currentContent.contentLength}文字\n\n【本文】\n${this.currentContent.content}`;
    
    try {
      await navigator.clipboard.writeText(message);
      console.log('🔍 [Dify Extension] Content copied to clipboard');
      this.copyContentBtn.textContent = '✅ コピー済み';
      setTimeout(() => {
        this.copyContentBtn.textContent = '📋 コピー';
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }
  
  hideContentPreview() {
    this.contentPreview.classList.add('hidden');
    this.currentContent = null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SidePanel();
});