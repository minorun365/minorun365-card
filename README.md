# minorun365-card

minorun365のプロフィールを表示するCLIカードパッケージです。Python版（PyPI）とNode.js版（NPM）を提供しています。

## 使い方

### Python（uvx / pip）

```zsh
uvx minorun365
```

### Node.js（npx）

```zsh
npx minorun365
```

## 構成

```
.
├── python/     # Python 実装（PyPI: minorun365）とプロフィール共通データ（SSOT）
└── node/       # Node.js 実装（NPM: minorun365）
```

プロフィール内容（書籍・SNS・所属など）は `python/src/minorun365/data.json` で一元管理しており、両言語の実装が同じデータを参照します。

タイトルはターコイズ、見出しは濃い水色、ラベルと枠は中間グレーです。本文は端末の既定文字色を使い、黒背景・白背景のどちらでも読みやすい表示です。
