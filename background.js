chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    difyAppUrl: '',
    isEnabled: true,
    whitelist: [],
    blacklist: []
  });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

let pendingContent = null;

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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    checkSitePermissions(tab.url);
  }
});

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