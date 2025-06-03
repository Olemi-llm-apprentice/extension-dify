# 🤖 Dify Chrome Extension

> DifyでデプロイしたアプリをChromeのサイドバーやポップアップで手軽に利用できる拡張機能

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange.svg)](https://developer.chrome.com/docs/extensions/mv3/)

## ✨ 特徴

- 🎯 **ワンクリックアクセス**: Difyアプリにサイドバーまたはポップアップからすぐにアクセス
- 📄 **自動コンテンツ抽出**: Webページの本文を自動取得してDifyアプリに送信
- 🎮 **ドラッグ可能なフローティングボタン**: 邪魔にならない位置に自由に移動
- ⚙️ **柔軟な設定**: サイトごとのホワイトリスト・ブラックリスト対応
- 🔒 **セキュア**: Chrome Extension Manifest V3準拠

## 🚀 インストール方法

### 開発版（推奨）

1. このリポジトリをクローンまたはダウンロード
```bash
git clone https://github.com/your-username/extension-dify.git
cd extension-dify
```

2. Chromeで拡張機能の開発者モードを有効化
   - Chrome設定 → 拡張機能 → 開発者モードをON

3. 「パッケージ化されていない拡張機能を読み込む」をクリック

4. このフォルダを選択してインストール完了

## 📖 使い方

### 初期設定

1. **拡張機能アイコンをクリック** してポップアップを開く
2. **DifyアプリのURL** を入力（例: `https://udify.app/chatbot/your-app-id`）
3. **保存** をクリック

### 基本操作

#### 🖱️ フローティングボタン

Webページ上に表示される💬ボタンで以下の操作が可能：

| 操作 | 機能 |
|------|------|
| **短押し（クリック）** | サイドパネルを開く |
| **長押し（800ms以上）** | ページ内容を抽出してDifyアプリに送信 |
| **ドラッグ** | ボタンを好きな位置に移動 |

#### 📱 ポップアップメニュー

拡張機能アイコンクリックで開くメニュー：

- ✅ 拡張機能の有効/無効切り替え
- 🔧 クイック設定（DifyアプリURL）
- 📋 サイドパネルを開く
- 📄 現在のページ内容を抽出

#### ⚙️ 詳細設定

「詳細設定」から以下を設定可能：

- **DifyアプリURL**: 使用するDifyアプリのURL
- **ホワイトリスト**: 拡張機能を有効にするサイトを限定
- **ブラックリスト**: 特定のサイトで拡張機能を無効化
- **コンテンツ抽出設定**: 自動抽出の詳細設定

## 🔧 コンテンツ抽出機能

### 抽出方法

拡張機能は以下の優先順位でページ内容を抽出：

1. `<article>` 要素
2. `<main>` 要素  
3. `.content`, `.article-content` 等のクラス
4. 50文字以上の `<p>` 要素

### 送信される形式

```
【ページ情報】
タイトル: 記事のタイトル
URL: https://example.com/article
抽出方法: article要素から抽出
文字数: 1500文字

【本文】
実際の記事内容がここに表示されます...
```

### 活用例

- **📝 要約**: 長い記事の要点を3行で要約
- **🌍 翻訳**: 外国語記事の日本語翻訳
- **❓ 質問応答**: 記事内容について詳しく質問
- **🔍 分析**: 記事の論点や感情分析
- **✍️ リライト**: 異なる視点での書き直し

## 🎯 対応サイト

以下のようなサイトでコンテンツ抽出が効果的：

- ✅ ブログ・ニュースサイト
- ✅ Wikipedia等の情報サイト
- ✅ 技術記事・ドキュメント
- ✅ 論文・レポート

## 📁 プロジェクト構成

```
extension-dify/
├── manifest.json              # 拡張機能設定
├── background.js              # バックグラウンド処理
├── content.js                 # ページ操作・コンテンツ抽出
├── popup.html                 # ポップアップUI
├── sidepanel.html            # サイドパネルUI
├── options.html              # 設定ページ
├── src/
│   ├── popup.js              # ポップアップ機能
│   ├── sidepanel.js          # サイドパネル機能
│   └── options.js            # 設定ページ機能
└── styles/
    ├── popup.css             # ポップアップスタイル
    ├── sidepanel.css         # サイドパネルスタイル
    └── options.css           # 設定ページスタイル
```

## 🛠️ 技術仕様

- **Chrome Extension Manifest V3**
- **Vanilla JavaScript (ES6+)**
- **CSS3 with modern features**
- **Chrome APIs**: `storage`, `sidePanel`, `tabs`, `action`

## 🔮 今後の機能予定

- [ ] 過去のチャット履歴の保存・検索
- [ ] サイトごとに異なるDifyアプリを割り当て
- [ ] 右クリックコンテキストメニュー
- [ ] ショートカットキーによる即時起動
- [ ] ダークモード対応
- [ ] 選択テキストのみ抽出機能

## 🤝 コントリビュート

バグ報告や機能提案は[Issues](https://github.com/your-username/extension-dify/issues)でお気軽にどうぞ！

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルをご覧ください。

## 🙏 謝辞

[公式Dify拡張機能](https://chromewebstore.google.com/detail/dify-chatbot/ceehdapohffmjmkdcifjofadiaoeggaf?hl=ja)をベースに開発しています。