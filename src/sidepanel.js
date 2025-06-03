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
    this.setupMessageListener();
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
  
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'receiveExtractedContent') {
        this.handleExtractedContent(request.data);
      }
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
  
  handleExtractedContent(pageData) {
    this.showContentPreview(pageData);
    this.sendContentToDify(pageData);
  }
  
  showContentPreview(pageData) {
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
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    notification.innerHTML = `
      <div><strong>コンテンツを抽出しました</strong></div>
      <div>${pageData.extractMethod} | ${pageData.contentLength}文字</div>
      <div style="margin-top: 4px; opacity: 0.9;">${pageData.title}</div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 4000);
  }
  
  sendContentToDify(pageData) {
    const message = `【ページ情報】\nタイトル: ${pageData.title}\nURL: ${pageData.url}\n抽出方法: ${pageData.extractMethod}\n文字数: ${pageData.contentLength}文字\n\n【本文】\n${pageData.content}`;
    
    this.waitForIframeLoad().then(() => {
      this.injectContentIntoChat(message);
    });
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
  
  injectContentIntoChat(message) {
    try {
      const iframeDoc = this.iframe.contentDocument;
      if (!iframeDoc) {
        this.fallbackContentDelivery(message);
        return;
      }
      
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
        inputElement = iframeDoc.querySelector(selector);
        if (inputElement) break;
      }
      
      if (inputElement) {
        inputElement.focus();
        inputElement.value = message;
        
        ['input', 'change', 'keyup'].forEach(eventType => {
          inputElement.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
        
        setTimeout(() => {
          const submitSelectors = [
            'button[type="submit"]',
            '.send-button',
            '.submit-button', 
            'button[aria-label*="送信"]',
            'button[aria-label*="send"]',
            'button[title*="送信"]',
            'button[title*="send"]'
          ];
          
          let submitButton = null;
          for (const selector of submitSelectors) {
            submitButton = iframeDoc.querySelector(selector);
            if (submitButton) break;
          }
          
          if (submitButton && !submitButton.disabled) {
            submitButton.click();
          }
        }, 500);
      } else {
        this.fallbackContentDelivery(message);
      }
      
    } catch (error) {
      console.error('Failed to inject content into chat:', error);
      this.fallbackContentDelivery(message);
    }
  }
  
  fallbackContentDelivery(message) {
    this.iframe.contentWindow.postMessage({
      type: 'DIFY_EXTENSION_CONTENT',
      content: message,
      timestamp: Date.now()
    }, '*');
    
    navigator.clipboard.writeText(message).then(() => {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 16px;
        right: 16px;
        background: #3b82f6;
        color: white;
        padding: 12px;
        border-radius: 8px;
        font-size: 12px;
        z-index: 1000;
        text-align: center;
      `;
      notification.textContent = 'コンテンツをクリップボードにコピーしました。Difyアプリでペーストしてください。';
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
    }).catch(() => {
      console.log('Clipboard access failed');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SidePanel();
});