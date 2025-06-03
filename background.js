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