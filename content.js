function extractPageContent() {
  const title = document.title;
  
  let content = '';
  
  const article = document.querySelector('article');
  if (article) {
    content = article.innerText;
  } else {
    const main = document.querySelector('main');
    if (main) {
      content = main.innerText;
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
          break;
        }
      }
      
      if (!content) {
        const paragraphs = document.querySelectorAll('p');
        content = Array.from(paragraphs)
          .map(p => p.innerText.trim())
          .filter(text => text.length > 50)
          .join('\n\n');
      }
    }
  }
  
  return {
    title,
    content: content.trim(),
    url: window.location.href
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
    cursor: pointer;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    transition: transform 0.2s ease;
  `;
  button.innerHTML = '💬';
  
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
  });
  
  button.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openSidePanel' });
  });
  
  document.body.appendChild(button);
}

chrome.storage.sync.get(['isEnabled'], (result) => {
  if (result.isEnabled) {
    createFloatingButton();
  }
});