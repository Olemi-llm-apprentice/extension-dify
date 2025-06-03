async function extractPageContent() {
  const title = document.title;
  let content = '';
  let extractMethod = '';
  
  // カスタムセレクタの設定を確認
  const { extractSelectors } = await chrome.storage.sync.get(['extractSelectors']);
  
  if (extractSelectors && extractSelectors.trim()) {
    // 上級者設定: カスタムセレクタを使用
    const customSelectors = extractSelectors.split(',').map(s => s.trim());
    for (const selector of customSelectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          content = element.innerText;
          extractMethod = `カスタムセレクタ「${selector}」から抽出`;
          break;
        }
      } catch (error) {
        console.warn('Invalid selector:', selector);
      }
    }
  }
  
  if (!content) {
    // デフォルト設定: body全体から取得（不要な要素を除外）
    const bodyClone = document.body.cloneNode(true);
    
    // 不要な要素を削除
    const unwantedSelectors = [
      'script', 'style', 'noscript', 'iframe', 'object', 'embed',
      'header', 'nav', 'footer', 'aside', '.advertisement', '.ads',
      '.social-share', '.comments', '.sidebar', '.menu', '.navigation',
      '[class*="ad-"]', '[id*="ad-"]', '[class*="advertisement"]',
      '[class*="social"]', '[class*="share"]', '[class*="comment"]',
      '.cookie-notice', '.popup', '.modal', '.overlay',
      '#dify-floating-button' // 自身のフローティングボタンを除外
    ];
    
    unwantedSelectors.forEach(selector => {
      try {
        const elements = bodyClone.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      } catch (error) {
        console.warn('Selector removal failed:', selector);
      }
    });
    
    // テキストを取得
    content = bodyClone.innerText || bodyClone.textContent || '';
    
    // 空行の除去と整理
    content = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
      .replace(/\n{3,}/g, '\n\n'); // 3つ以上の連続改行を2つに
    
    extractMethod = 'body全体から抽出（不要要素除外済み）';
  }
  
  return {
    title,
    content: content.trim(),
    url: window.location.href,
    extractMethod,
    contentLength: content.trim().length
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractContent') {
    extractPageContent().then(pageData => {
      sendResponse(pageData);
    }).catch(error => {
      console.error('Content extraction failed:', error);
      sendResponse({ error: error.message });
    });
    return true; // 非同期レスポンスを示す
  }
});

function createFloatingButton() {
  const button = document.createElement('div');
  button.id = 'dify-floating-button';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    background: #4f46e5;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    cursor: move;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    transition: transform 0.2s ease;
    user-select: none;
  `;
  button.innerHTML = '💬';
  
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let buttonStartX = 0;
  let buttonStartY = 0;
  
  function getButtonPosition() {
    const rect = button.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top
    };
  }
  
  function setButtonPosition(x, y) {
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;
    
    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));
    
    button.style.left = x + 'px';
    button.style.top = y + 'px';
    button.style.right = 'auto';
    button.style.bottom = 'auto';
  }
  
  let mouseDownTime = 0;
  let longPressTimer = null;
  let isLongPress = false;
  
  // イベントハンドラーを保存
  const originalClickHandler = () => {
    console.log('🔍 [Dify Extension] Short click detected, opening side panel');
    chrome.runtime.sendMessage({ action: 'openSidePanel' });
  };
  
  const openSidePanelHandler = () => {
    console.log('🔍 [Dify Extension] Opening side panel with stored content');
    chrome.runtime.sendMessage({ action: 'openSidePanel' }, (response) => {
      if (response && response.success) {
        // ボタンを元に戻す
        button.innerHTML = '💬';
        button.style.background = '#4f46e5';
        button.title = '';
        button.removeEventListener('click', openSidePanelHandler);
        // 元のイベントリスナーは mouseup で処理されるので追加不要
      }
    });
  };
  
  function showTooltip(message, duration = 3000) {
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      position: fixed;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10001;
      pointer-events: none;
      max-width: 200px;
      word-wrap: break-word;
    `;
    tooltip.textContent = message;
    
    const buttonRect = button.getBoundingClientRect();
    tooltip.style.left = (buttonRect.left - 100) + 'px';
    tooltip.style.top = (buttonRect.top - 40) + 'px';
    
    document.body.appendChild(tooltip);
    
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    }, duration);
  }
  
  async function extractAndSendContent() {
    console.log('🔍 [Dify Extension] Starting content extraction');
    button.innerHTML = '⏳';
    button.style.background = '#f59e0b';
    
    try {
      const pageData = await extractPageContent();
      console.log('🔍 [Dify Extension] Extracted content:', {
        title: pageData.title,
        contentLength: pageData.contentLength,
        extractMethod: pageData.extractMethod
      });
      
      showTooltip(`${pageData.extractMethod}\n文字数: ${pageData.contentLength}文字`);
      
      chrome.runtime.sendMessage({ 
        action: 'sendContentToSidePanel', 
        data: pageData 
      }, (response) => {
        console.log('🔍 [Dify Extension] Content send response:', response);
        if (response && response.success) {
          console.log('🔍 [Dify Extension] Content successfully stored');
          showTooltip('コンテンツを抽出しました！\n💬ボタンをクリックしてサイドパネルを開いてください', 5000);
          
          // フローティングボタンを変更してサイドパネルを開けるようにする
          button.innerHTML = '📋';
          button.style.background = '#10b981';
          button.title = 'クリックしてサイドパネルを開く';
          
          // 新しいクリックリスナーを追加
          button.removeEventListener('click', originalClickHandler);
          button.addEventListener('click', openSidePanelHandler);
          
        } else {
          console.error('🔍 [Dify Extension] Failed to send content:', response?.error);
          // エラー時にボタンを元に戻す
          button.innerHTML = '💬';
          button.style.background = '#4f46e5';
        }
      });
      
    } catch (error) {
      console.error('🔍 [Dify Extension] Content extraction failed:', error);
      button.innerHTML = '💬';
      button.style.background = '#4f46e5';
      showTooltip('コンテンツ抽出に失敗しました', 3000);
    }
  }
  
  button.addEventListener('mousedown', (e) => {
    console.log('🔍 [Dify Extension] Mousedown event triggered');
    mouseDownTime = Date.now();
    isLongPress = false;
    isDragging = false;
    
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    const pos = getButtonPosition();
    buttonStartX = pos.x;
    buttonStartY = pos.y;
    
    longPressTimer = setTimeout(() => {
      console.log('🔍 [Dify Extension] Long press timer fired');
      if (!isDragging) {
        isLongPress = true;
        extractAndSendContent();
      }
    }, 800);
    
    button.style.cursor = 'grabbing';
    button.style.transition = 'none';
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (mouseDownTime === 0) return;
    
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > 5 && !isDragging) {
      console.log('🔍 [Dify Extension] Starting drag, canceling long press');
      isDragging = true;
      clearTimeout(longPressTimer);
    }
    
    if (isDragging) {
      setButtonPosition(buttonStartX + deltaX, buttonStartY + deltaY);
    }
  });
  
  document.addEventListener('mouseup', (e) => {
    if (mouseDownTime === 0) return;
    
    console.log('🔍 [Dify Extension] Mouseup event triggered', {
      isDragging,
      isLongPress,
      pressDuration: Date.now() - mouseDownTime
    });
    
    clearTimeout(longPressTimer);
    
    const deltaX = Math.abs(e.clientX - dragStartX);
    const deltaY = Math.abs(e.clientY - dragStartY);
    const pressDuration = Date.now() - mouseDownTime;
    
    if (!isDragging && !isLongPress && deltaX < 5 && deltaY < 5 && pressDuration < 800) {
      originalClickHandler();
    }
    
    isDragging = false;
    isLongPress = false;
    mouseDownTime = 0;
    button.style.cursor = 'move';
    button.style.transition = 'transform 0.2s ease';
  });
  
  button.addEventListener('mouseenter', () => {
    if (!isDragging) {
      button.style.transform = 'scale(1.1)';
    }
  });
  
  button.addEventListener('mouseleave', () => {
    if (!isDragging) {
      button.style.transform = 'scale(1)';
    }
  });
  
  document.body.appendChild(button);
}

chrome.storage.sync.get(['isEnabled'], (result) => {
  console.log('🔍 [Dify Extension] Storage check result:', result);
  if (result.isEnabled !== false) {
    console.log('🔍 [Dify Extension] Creating floating button');
    createFloatingButton();
  } else {
    console.log('🔍 [Dify Extension] Extension is disabled, not creating button');
  }
});

window.addEventListener('load', () => {
  console.log('🔍 [Dify Extension] Page loaded, checking for button');
  const existingButton = document.getElementById('dify-floating-button');
  if (!existingButton) {
    console.log('🔍 [Dify Extension] Button not found, recreating');
    chrome.storage.sync.get(['isEnabled'], (result) => {
      if (result.isEnabled !== false) {
        createFloatingButton();
      }
    });
  }
});