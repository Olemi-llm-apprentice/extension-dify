# 🤖 Dify Chrome Extension

> DifyでデプロイしたアプリをChromeのサイドバーやポップアップで手軽に利用できる拡張機能

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange.svg)](https://developer.chrome.com/docs/extensions/mv3/)

## ✨ 特徴

- 🎯 **ワンクリックアクセス**: Difyアプリにサイドバーまたはポップアップからすぐにアクセス
- 🚀 **スマート自動更新**: ページ遷移・タブ切り替え時に自動でコンテンツを抽出（URL変更検知付き）
- 📄 **高精度コンテンツ抽出**: Webページの本文を自動取得してDifyアプリに送信
- 🎬 **YouTube字幕対応**: YouTube動画の字幕データを優先的に抽出（多言語対応）
- 🔄 **手動更新機能**: いつでも最新コンテンツを即座に再取得
- ⚙️ **自動抽出制御**: 自動コンテンツ抽出の有効/無効を設定で切り替え可能
- 🎮 **ドラッグ可能なフローティングボタン**: 邪魔にならない位置に自由に移動
- 🚫 **サイト別表示制御**: ブラックリストでフローティングボタンの表示を制御
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

#### 🚀 自動コンテンツ抽出（推奨）

**最もシンプルな使い方:**

1. **💬ボタンをクリック** → サイドパネルが開き、自動的に現在のページ内容を抽出
2. **別のページ/タブに移動** → 2.5秒後に自動で新しいコンテンツを抽出・表示
3. **📋コピーボタンをクリック** → クリップボードにコピー
4. **DifyアプリでCtrl+V** → ペーストして完了

**🔄 手動更新:**
- **更新ボタン（🔄）をクリック** → いつでも即座にコンテンツを再取得

#### 🖱️ フローティングボタン

Webページ上に表示される💬ボタンで以下の操作が可能：

| 操作 | 機能 |
|------|------|
| **クリック** | サイドパネルを開く |
| **ドラッグ** | ボタンを好きな位置に移動 |

#### 🤖 スマート自動更新システム

- **新規ページ遷移**: 自動検知 → 2.5秒後に自動抽出
- **既存タブ切り替え**: URL変更時のみ自動抽出
- **重複防止**: 同じURLの場合はスキップしてパフォーマンス向上

#### 📱 ポップアップメニュー

拡張機能アイコンクリックで開くメニュー：

- ✅ 拡張機能の有効/無効切り替え
- 🔧 クイック設定（DifyアプリURL）
- 📋 サイドパネルを開く
- 📄 現在のページ内容を抽出

#### ⚙️ 詳細設定

「詳細設定」から以下を設定可能：

- **DifyアプリURL**: 使用するDifyアプリのURL
- **自動コンテンツ抽出**: 自動抽出機能の有効/無効
- **ブラックリスト**: フローティングボタンを表示しないサイトを指定
- **カスタムセレクタ**: 高度なコンテンツ抽出設定

## 🔧 コンテンツ抽出機能

### 抽出方法

**🔸 YouTube動画（NEW）:**
- 字幕データを優先的に抽出
- 多言語対応（日本語 > 英語 > その他）
- 手動作成字幕を自動生成より優先
- 読みやすい段落形式に整形

**🔸 デフォルト動作（推奨）:**
- `<body>` 全体から本文を抽出
- 不要要素を自動除外（広告、ナビ、フッター、SNSボタン等）
- より多くのコンテンツを確実に取得

**🔸 上級者設定:**
- 設定ページでカスタムCSSセレクタを指定可能
- 例: `article, .post-content, #main`

### 送信される形式

**YouTube動画の場合:**
```
【ページ情報】
タイトル: プログラミング入門講座
URL: https://www.youtube.com/watch?v=example
抽出方法: YouTube字幕から抽出（ja） - 手動作成
文字数: 1500文字

【本文】
こんにちは、今日はプログラミングの基礎について説明します。

まずは変数の概念から始めましょう。変数とは、データを格納するための箱のようなものです。

次に関数について説明します。関数は処理をまとめたもので、再利用可能なコードブロックです。
```

**通常のWebページの場合:**
```
【ページ情報】
タイトル: 記事のタイトル
URL: https://example.com/article
抽出方法: body全体から抽出（不要要素除外済み）
文字数: 3500文字

【本文】
実際の記事内容がここに表示されます...
（body全体から広告・ナビゲーション等を除外した本文）
```

### 活用例

- **📝 要約**: 長い記事や動画の要点を3行で要約
- **🌍 翻訳**: 外国語記事・動画字幕の日本語翻訳
- **❓ 質問応答**: 記事・動画内容について詳しく質問
- **🔍 分析**: 記事・動画の論点や感情分析
- **✍️ リライト**: 異なる視点での書き直し
- **🎬 YouTube活用**: 動画の字幕から学習ノート作成

## 🎯 対応サイト

以下のようなサイトでコンテンツ抽出が効果的：

- ✅ **YouTube**: 動画の字幕データを自動抽出
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