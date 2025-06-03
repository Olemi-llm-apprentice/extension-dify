class SidePanel {
  constructor() {
    this.iframe = document.getElementById('difyIframe');
    this.noUrlMessage = document.getElementById('noUrlMessage');
    this.difyFrame = document.getElementById('difyFrame');
    this.loadingMessage = document.getElementById('loadingMessage');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.refreshBtn = document.getElementById('refreshBtn');
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
    // 自動でアクティブタブのコンテンツを抽出
    await this.autoExtractPageContent();
    // サイドパネルがアクティブであることをbackgroundに通知
    await this.registerSidePanel();
  }
  
  bindEvents() {
    this.settingsBtn.addEventListener('click', () => this.openSettings());
    this.refreshBtn.addEventListener('click', () => this.manualExtractPageContent());
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
  
  async autoExtractPageContent() {
    try {
      // 自動抽出設定をチェック
      const { autoExtractEnabled } = await chrome.storage.sync.get(['autoExtractEnabled']);
      if (autoExtractEnabled === false) {
        console.log('🔍 [Dify Extension] Auto extraction disabled, skipping initial extraction');
        return;
      }
      
      console.log('🔍 [Dify Extension] Auto extracting page content');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        console.log('🔍 [Dify Extension] No tab ID found for auto extraction');
        return;
      }
      
      // サイドパネル自体やchrome://ページは除外
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        console.log('🔍 [Dify Extension] Skipping auto extraction for chrome page');
        return;
      }
      
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractContent' });
      
      if (response && response.content) {
        console.log('🔍 [Dify Extension] Auto content extraction successful');
        this.handleExtractedContent(response);
      }
      
    } catch (error) {
      console.log('🔍 [Dify Extension] Auto extraction failed (normal for some pages):', error);
    }
  }

  async manualExtractPageContent() {
    try {
      console.log('🔍 [Dify Extension] Manual refresh button clicked');
      this.refreshBtn.innerHTML = '⏳';
      this.refreshBtn.disabled = true;
      
      // 現在アクティブなタブを取得
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('🔍 [Dify Extension] Current active tab:', tab);
      
      if (!tab || !tab.id) {
        console.error('🔍 [Dify Extension] No tab ID found for manual extraction');
        return;
      }
      
      // chrome:// ページの除外
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        console.log('🔍 [Dify Extension] Skipping manual extraction for chrome page');
        return;
      }
      
      console.log('🔍 [Dify Extension] Sending extract message to tab:', tab.id);
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractContent' });
      console.log('🔍 [Dify Extension] Manual extraction response:', response);
      
      if (response && response.content) {
        console.log('🔍 [Dify Extension] Manual content extraction successful');
        this.handleExtractedContent(response);
      } else {
        console.error('🔍 [Dify Extension] No content in manual extraction response');
      }
      
    } catch (error) {
      console.error('🔍 [Dify Extension] Manual extraction failed:', error);
    } finally {
      // ボタンを元に戻す
      setTimeout(() => {
        this.refreshBtn.innerHTML = '🔄';
        this.refreshBtn.disabled = false;
      }, 1000);
    }
  }

  async extractPageContent() {
    try {
      console.log('🔍 [Dify Extension] Extract page content (internal)');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        console.error('🔍 [Dify Extension] No tab ID found');
        return;
      }
      
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractContent' });
      
      if (response && response.content) {
        console.log('🔍 [Dify Extension] Content extracted, handling in side panel');
        this.handleExtractedContent(response);
      } else {
        console.error('🔍 [Dify Extension] No content in response or response is null');
      }
      
    } catch (error) {
      console.error('🔍 [Dify Extension] Failed to extract page content:', error);
    }
  }
  
  handleExtractedContent(pageData) {
    console.log('🔍 [Dify Extension] Handling extracted content:', pageData);
    this.showContentPreview(pageData);
    this.currentContent = pageData;
    this.attemptDifyIntegration(pageData);
    
    // URLを記録するためにbackgroundに通知
    chrome.runtime.sendMessage({ 
      action: 'updateLastExtractedUrl', 
      url: pageData.url 
    });
  }
  
  showContentPreview(pageData) {
    console.log('🔍 [Dify Extension] Updating content preview display:', {
      title: pageData.title,
      contentLength: pageData.contentLength,
      url: pageData.url
    });
    
    this.contentTitle.textContent = pageData.title;
    this.contentInfo.textContent = `${pageData.extractMethod} | ${pageData.contentLength}文字 | ${pageData.url}`;
    this.contentText.textContent = pageData.content;
    this.contentPreview.classList.remove('hidden');
    
    // 表示更新を強制
    this.contentPreview.style.display = 'flex';
    
    // ユーザーの注意をDifyアプリに向ける
    this.highlightDifyApp();
    
    console.log('🔍 [Dify Extension] Content preview updated successfully');
  }

  async registerSidePanel() {
    try {
      await chrome.runtime.sendMessage({ action: 'registerSidePanel' });
      console.log('🔍 [Dify Extension] Side panel registered for auto navigation updates');
      
      // ナビゲーション更新をポーリングで監視
      this.startNavigationPolling();
    } catch (error) {
      console.error('🔍 [Dify Extension] Failed to register side panel:', error);
    }
  }

  // サイドパネルが閉じられた時の処理
  unregisterSidePanel() {
    try {
      chrome.runtime.sendMessage({ action: 'unregisterSidePanel' });
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }
    } catch (error) {
      console.error('🔍 [Dify Extension] Failed to unregister side panel:', error);
    }
  }

  startNavigationPolling() {
    console.log('🔍 [Dify Extension] Starting navigation polling');
    // 3秒ごとに新しいコンテンツをチェック
    this.pollingInterval = setInterval(async () => {
      try {
        const response = await chrome.runtime.sendMessage({ action: 'getSidePanelContent' });
        if (response && response.success && response.data) {
          console.log('🔍 [Dify Extension] Found new navigation content, updating display');
          console.log('🔍 [Dify Extension] New content data:', {
            title: response.data.title,
            url: response.data.url,
            contentLength: response.data.contentLength
          });
          this.handleExtractedContent(response.data);
        }
        // ログを減らすため、コンテンツがない場合はログ出力しない
      } catch (error) {
        // エラーは無視（サイドパネルが閉じられた場合など）
      }
    }, 3000);
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
      
      // 通知を表示しない
    } else {
      console.log('🔍 [Dify Extension] No suitable input element found');
      this.showManualInstructions();
    }
  }
  
  showManualInstructions() {
    // 通知を表示しない（自動クリップボードコピーも削除済みのため）
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
  
  highlightDifyApp() {
    // Difyアプリの枠を一時的にハイライト
    this.difyFrame.style.transition = 'border 0.3s ease';
    this.difyFrame.style.border = '3px solid #10b981';
    this.difyFrame.style.borderRadius = '8px';
    
    setTimeout(() => {
      this.difyFrame.style.border = 'none';
      this.difyFrame.style.borderRadius = '0';
    }, 3000);
    
    // iframeにフォーカスを当てる試み
    try {
      this.iframe.focus();
    } catch (error) {
      console.log('Cannot focus iframe due to cross-origin restrictions');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SidePanel();
});