chrome.runtime.onInstalled.addListener(() => {
  console.log('🔍 [Dify Extension] Background script installed and running');
  chrome.storage.sync.set({
    difyAppUrl: '',
    isEnabled: true,
    whitelist: [],
    blacklist: []
  });
});

// Service Worker の生存確認
console.log('🔍 [Dify Extension] Background script loaded at:', new Date().toISOString());

// Service Worker の起動確認
chrome.runtime.onStartup.addListener(() => {
  console.log('🔍 [Dify Extension] Service Worker startup detected');
});

chrome.action.onClicked.addListener((tab) => {
  console.log('🔍 [Dify Extension] Extension icon clicked, opening side panel for tab:', tab.id);
  chrome.sidePanel.open({ tabId: tab.id });
});

let pendingContent = null;
let navigationTimeout = null;
let isSidePanelOpen = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🔍 [Dify Extension] Background received message:', request.action, request);
  
  (async () => {
    try {
      if (request.action === 'openSidePanel') {
        console.log('🔍 [Dify Extension] Opening side panel for tab:', sender.tab?.id);
        if (sender.tab?.id) {
          await chrome.sidePanel.open({ tabId: sender.tab.id });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'No tab ID' });
        }
      } else if (request.action === 'sendContentToSidePanel') {
        console.log('🔍 [Dify Extension] Processing sendContentToSidePanel request');
        console.log('🔍 [Dify Extension] Storing content for side panel');
        pendingContent = request.data;
        sendResponse({ success: true, message: 'Content stored. Please open side panel manually.' });
      } else if (request.action === 'openSidePanelWithContent') {
        console.log('🔍 [Dify Extension] Opening side panel with user gesture');
        try {
          pendingContent = request.data;
          if (sender.tab?.id) {
            await chrome.sidePanel.open({ tabId: sender.tab.id });
            console.log('🔍 [Dify Extension] Side panel opened successfully');
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'No tab ID' });
          }
        } catch (sidePanelError) {
          console.error('🔍 [Dify Extension] Error opening side panel:', sidePanelError);
          sendResponse({ success: false, error: 'Side panel operation failed: ' + sidePanelError.message });
        }
      } else if (request.action === 'getSidePanelContent') {
        console.log('🔍 [Dify Extension] Side panel requesting content');
        if (pendingContent) {
          const content = pendingContent;
          pendingContent = null;
          console.log('🔍 [Dify Extension] Returning pending content');
          sendResponse({ success: true, data: content });
        } else {
          console.log('🔍 [Dify Extension] No pending content available');
          sendResponse({ success: false, error: 'No pending content' });
        }
      } else if (request.action === 'registerSidePanel') {
        console.log('🔍 [Dify Extension] Registering side panel as open');
        isSidePanelOpen = true;
        console.log('🔍 [Dify Extension] Side panel registered successfully, isSidePanelOpen:', isSidePanelOpen);
        sendResponse({ success: true });
      } else if (request.action === 'unregisterSidePanel') {
        console.log('🔍 [Dify Extension] Unregistering side panel');
        isSidePanelOpen = false;
        sendResponse({ success: true });
      } else {
        console.log('🔍 [Dify Extension] Unknown action:', request.action);
        sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('🔍 [Dify Extension] Error in background message handler:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  return true;
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  checkSitePermissions(tab.url);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  console.log('🔍 [Dify Extension] Tab updated event fired:', {
    tabId, 
    changeInfo, 
    url: tab?.url, 
    isSidePanelOpen,
    status: changeInfo.status
  });
  
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('🔍 [Dify Extension] Tab completed loading:', tab.url);
    checkSitePermissions(tab.url);
    
    // サイドパネルが開いている場合、現在アクティブなタブをチェック
    if (isSidePanelOpen) {
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('🔍 [Dify Extension] Current active tab:', activeTab?.id, 'Updated tab:', tabId);
        
        if (activeTab && activeTab.id === tabId) {
          console.log('🔍 [Dify Extension] Active tab updated and side panel is open, starting auto extraction');
          handleNavigationWithDebounce(tabId);
        } else {
          console.log('🔍 [Dify Extension] Updated tab is not active tab');
        }
      } catch (error) {
        console.error('🔍 [Dify Extension] Error checking active tab:', error);
      }
    } else {
      console.log('🔍 [Dify Extension] Side panel not open');
    }
  } else {
    console.log('🔍 [Dify Extension] Tab update not complete or no URL');
  }
});

async function handleNavigationWithDebounce(tabId) {
  // 既存のタイマーをクリア
  if (navigationTimeout) {
    clearTimeout(navigationTimeout);
  }
  
  console.log('🔍 [Dify Extension] Page navigation detected, starting 4s debounce timer');
  
  // 4秒後に自動抽出実行
  navigationTimeout = setTimeout(async () => {
    try {
      const tab = await chrome.tabs.get(tabId);
      
      // chrome:// ページやエクステンションページは除外
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        console.log('🔍 [Dify Extension] Skipping auto extraction for system page');
        return;
      }
      
      console.log('🔍 [Dify Extension] Auto extracting content after navigation to:', tab.url);
      
      // サイドパネルにコンテンツ抽出を指示
      const response = await chrome.tabs.sendMessage(tabId, { action: 'extractContent' });
      
      if (response && response.content) {
        console.log('🔍 [Dify Extension] Auto extraction successful, storing for side panel');
        
        // pendingContentに保存してサイドパネルがポーリングできるようにする
        pendingContent = response;
      }
      
    } catch (error) {
      console.log('🔍 [Dify Extension] Auto extraction failed (normal for some pages):', error);
    }
  }, 4000); // 4秒待機
}

async function checkSitePermissions(url) {
  if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return;
  }

  const { whitelist, blacklist, isEnabled } = await chrome.storage.sync.get(['whitelist', 'blacklist', 'isEnabled']);
  
  if (!isEnabled) {
    return;
  }

  const hostname = new URL(url).hostname;
  
  const isWhitelisted = whitelist.length === 0 || whitelist.includes(hostname);
  const isBlacklisted = blacklist.includes(hostname);
  
  if (isWhitelisted && !isBlacklisted) {
    chrome.action.enable();
  } else {
    chrome.action.disable();
  }
}