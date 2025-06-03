# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DifyのChrome拡張機能のリポジトリです。Difyでデプロイしたアプリをサイドバーやポップアップで表示し、ページ内容の自動取得などができる機能を提供します。

## Project Structure

```
/
├── manifest.json              # Chrome Extension manifest (v3)
├── background.js              # Service worker for background tasks
├── content.js                 # Content script for page interaction
├── popup.html                 # Extension popup interface
├── sidepanel.html            # Side panel interface
├── options.html              # Settings page
├── src/
│   ├── popup.js              # Popup functionality
│   ├── sidepanel.js          # Side panel functionality
│   └── options.js            # Settings page functionality
├── styles/
│   ├── popup.css             # Popup styles
│   ├── sidepanel.css         # Side panel styles
│   └── options.css           # Settings page styles
└── assets/                   # Static assets (currently empty)
```

## Key Features

- **サイドパネル表示**: DifyアプリをChromeのサイドパネルで表示
- **ポップアップ機能**: 拡張機能アイコンクリックでポップアップ表示
- **URL設定**: DifyアプリのURLを設定可能
- **サイト制御**: ホワイトリスト/ブラックリスト機能
- **コンテンツ抽出**: ページ内容を自動取得してDifyアプリに送信

## Technology Stack

- Chrome Extension Manifest V3
- Vanilla JavaScript (ES6+)
- CSS3 with modern features
- Chrome APIs: storage, sidePanel, tabs, action

## Development Notes

- Uses Chrome Extension Manifest V3
- All JavaScript uses modern ES6+ syntax
- Storage uses chrome.storage.sync for cross-device sync
- Content script handles page content extraction
- Background script manages extension state and permissions