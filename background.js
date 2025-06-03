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

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'openSidePanel') {
    chrome.sidePanel.open({ tabId: sender.tab.id });
  } else if (request.action === 'sendContentToSidePanel') {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        await chrome.sidePanel.open({ tabId: tabs[0].id });
        
        setTimeout(() => {
          chrome.runtime.sendMessage({
            action: 'receiveExtractedContent',
            data: request.data
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to send content to side panel:', error);
    }
  }
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