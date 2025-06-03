class OptionsPage {
  constructor() {
    this.difyAppUrl = document.getElementById('difyAppUrl');
    this.isEnabled = document.getElementById('isEnabled');
    this.autoExtract = document.getElementById('autoExtract');
    this.extractSelectors = document.getElementById('extractSelectors');
    this.whitelistInput = document.getElementById('whitelistInput');
    this.blacklistInput = document.getElementById('blacklistInput');
    this.addWhitelistBtn = document.getElementById('addWhitelistBtn');
    this.addBlacklistBtn = document.getElementById('addBlacklistBtn');
    this.whitelistItems = document.getElementById('whitelistItems');
    this.blacklistItems = document.getElementById('blacklistItems');
    this.saveBtn = document.getElementById('saveBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.message = document.getElementById('message');
    this.tabButtons = document.querySelectorAll('.tab-button');
    this.tabContents = document.querySelectorAll('.tab-content');
    
    this.whitelist = [];
    this.blacklist = [];
    
    this.init();
  }
  
  async init() {
    this.bindEvents();
    await this.loadSettings();
  }
  
  bindEvents() {
    this.saveBtn.addEventListener('click', () => this.saveSettings());
    this.resetBtn.addEventListener('click', () => this.resetSettings());
    this.addWhitelistBtn.addEventListener('click', () => this.addToWhitelist());
    this.addBlacklistBtn.addEventListener('click', () => this.addToBlacklist());
    
    this.whitelistInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addToWhitelist();
      }
    });
    
    this.blacklistInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addToBlacklist();
      }
    });
    
    this.tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        this.switchTab(tabName);
      });
    });
  }
  
  async loadSettings() {
    try {
      const settings = await chrome.storage.sync.get([
        'difyAppUrl',
        'isEnabled',
        'autoExtract',
        'extractSelectors',
        'whitelist',
        'blacklist'
      ]);
      
      this.difyAppUrl.value = settings.difyAppUrl || '';
      this.isEnabled.checked = settings.isEnabled !== false;
      this.autoExtract.checked = settings.autoExtract || false;
      this.extractSelectors.value = settings.extractSelectors || '';
      this.whitelist = settings.whitelist || [];
      this.blacklist = settings.blacklist || [];
      
      this.renderSiteList('whitelist');
      this.renderSiteList('blacklist');
      
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.showMessage('設定の読み込みに失敗しました', 'error');
    }
  }
  
  async saveSettings() {
    try {
      const url = this.difyAppUrl.value.trim();
      
      if (url && !this.isValidUrl(url)) {
        this.showMessage('有効なURLを入力してください', 'error');
        return;
      }
      
      const settings = {
        difyAppUrl: url,
        isEnabled: this.isEnabled.checked,
        autoExtract: this.autoExtract.checked,
        extractSelectors: this.extractSelectors.value.trim(),
        whitelist: this.whitelist,
        blacklist: this.blacklist
      };
      
      await chrome.storage.sync.set(settings);
      this.showMessage('設定を保存しました', 'success');
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showMessage('設定の保存に失敗しました', 'error');
    }
  }
  
  async resetSettings() {
    if (!confirm('すべての設定をリセットしますか？')) {
      return;
    }
    
    try {
      await chrome.storage.sync.clear();
      
      this.difyAppUrl.value = '';
      this.isEnabled.checked = true;
      this.autoExtract.checked = false;
      this.extractSelectors.value = '';
      this.whitelist = [];
      this.blacklist = [];
      
      this.renderSiteList('whitelist');
      this.renderSiteList('blacklist');
      
      this.showMessage('設定をリセットしました', 'success');
      
    } catch (error) {
      console.error('Failed to reset settings:', error);
      this.showMessage('設定のリセットに失敗しました', 'error');
    }
  }
  
  addToWhitelist() {
    const domain = this.whitelistInput.value.trim();
    if (domain && !this.whitelist.includes(domain)) {
      this.whitelist.push(domain);
      this.whitelistInput.value = '';
      this.renderSiteList('whitelist');
    }
  }
  
  addToBlacklist() {
    const domain = this.blacklistInput.value.trim();
    if (domain && !this.blacklist.includes(domain)) {
      this.blacklist.push(domain);
      this.blacklistInput.value = '';
      this.renderSiteList('blacklist');
    }
  }
  
  removeFromList(type, domain) {
    if (type === 'whitelist') {
      this.whitelist = this.whitelist.filter(item => item !== domain);
      this.renderSiteList('whitelist');
    } else if (type === 'blacklist') {
      this.blacklist = this.blacklist.filter(item => item !== domain);
      this.renderSiteList('blacklist');
    }
  }
  
  renderSiteList(type) {
    const container = type === 'whitelist' ? this.whitelistItems : this.blacklistItems;
    const list = type === 'whitelist' ? this.whitelist : this.blacklist;
    
    container.innerHTML = '';
    
    if (list.length === 0) {
      container.innerHTML = `<p class="help-text">まだ${type === 'whitelist' ? 'ホワイトリスト' : 'ブラックリスト'}に登録されたサイトはありません</p>`;
      return;
    }
    
    list.forEach(domain => {
      const item = document.createElement('div');
      item.className = 'site-item';
      item.innerHTML = `
        <span>${domain}</span>
        <button class="btn-remove" onclick="optionsPage.removeFromList('${type}', '${domain}')">削除</button>
      `;
      container.appendChild(item);
    });
  }
  
  switchTab(tabName) {
    this.tabButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.tab === tabName);
    });
    
    this.tabContents.forEach(content => {
      content.classList.toggle('active', content.id === tabName);
    });
  }
  
  showMessage(text, type) {
    this.message.textContent = text;
    this.message.className = `message ${type}`;
    this.message.classList.remove('hidden');
    
    setTimeout(() => {
      this.message.classList.add('hidden');
    }, 5000);
  }
  
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
}

let optionsPage;
document.addEventListener('DOMContentLoaded', () => {
  optionsPage = new OptionsPage();
});