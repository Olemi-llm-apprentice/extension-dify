function extractPageContent() {
  const title = document.title;
  let content = '';
  let extractMethod = '';
  
  const article = document.querySelector('article');
  if (article) {
    content = article.innerText;
    extractMethod = 'article要素から抽出';
  } else {
    const main = document.querySelector('main');
    if (main) {
      content = main.innerText;
      extractMethod = 'main要素から抽出';
    } else {
      const contentSelectors = [
        '.content',
        '.article-content', 
        '.post-content',
        '.entry-content',
        '.blog-content',
        '#content',
        '.main-content'
      ];
      
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          content = element.innerText;
          extractMethod = `${selector}セレクタから抽出`;
          break;
        }
      }
      
      if (!content) {
        const paragraphs = document.querySelectorAll('p');
        const validParagraphs = Array.from(paragraphs)
          .map(p => p.innerText.trim())
          .filter(text => text.length > 50);
        content = validParagraphs.join('\n\n');
        extractMethod = `${validParagraphs.length}個のp要素から抽出`;
      }
    }
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
    const pageData = extractPageContent();
    sendResponse(pageData);
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
  
  function extractAndSendContent() {
    button.innerHTML = '⏳';
    button.style.background = '#f59e0b';
    
    const pageData = extractPageContent();
    
    showTooltip(`${pageData.extractMethod}\n文字数: ${pageData.contentLength}文字`);
    
    chrome.runtime.sendMessage({ action: 'openSidePanel' }, () => {
      setTimeout(() => {
        chrome.runtime.sendMessage({ 
          action: 'sendContentToSidePanel', 
          data: pageData 
        });
      }, 500);
    });
    
    setTimeout(() => {
      button.innerHTML = '💬';
      button.style.background = '#4f46e5';
    }, 1000);
  }
  
  button.addEventListener('mousedown', (e) => {
    mouseDownTime = Date.now();
    isLongPress = false;
    
    longPressTimer = setTimeout(() => {
      if (!isDragging) {
        isLongPress = true;
        extractAndSendContent();
      }
    }, 800);
    
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    const pos = getButtonPosition();
    buttonStartX = pos.x;
    buttonStartY = pos.y;
    
    button.style.cursor = 'grabbing';
    button.style.transition = 'none';
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      clearTimeout(longPressTimer);
      setButtonPosition(buttonStartX + deltaX, buttonStartY + deltaY);
    }
  });
  
  document.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    
    clearTimeout(longPressTimer);
    isDragging = false;
    button.style.cursor = 'move';
    button.style.transition = 'transform 0.2s ease';
    
    const deltaX = Math.abs(e.clientX - dragStartX);
    const deltaY = Math.abs(e.clientY - dragStartY);
    const pressDuration = Date.now() - mouseDownTime;
    
    if (deltaX < 5 && deltaY < 5 && pressDuration < 800 && !isLongPress) {
      chrome.runtime.sendMessage({ action: 'openSidePanel' });
    }
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
  if (result.isEnabled) {
    createFloatingButton();
  }
});