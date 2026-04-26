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
├── data.json   # プロフィール共通データ（SSOT）
├── python/     # Python 実装（PyPI: minorun365）
└── node/       # Node.js 実装（NPM: minorun365）
```

プロフィール内容（書籍・SNS・所属など）は `data.json` で一元管理しており、両言語の実装が同じデータを参照します。
