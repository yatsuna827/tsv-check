# TS-V-Check

## 概要
ポケモンの7世代TSV検索ツールのフロントエンドのガワです。
IDを指定して該当する初期seedを返すAPIを別途用意する必要があります。

### 余談
TSとVが分かれているのはスクリプト部分をTSで書いているからです。

## 環境構築
- `npm install` でパッケージをインストール.
- `npm run gen` で `src/index.html` から型生成.
- `npm run build` で ビルド.
- `npm run start` でサーバ起動.
  - http://localhost:3000 がアプリ本体、http://localhost:8080 が開発用APIサーバ.

## Author
Twitter: [@sub_827](https://twitter.com/sub_827)

## Licence
[MIT](https://github.com/kotabrog/ft_mini_ls/blob/main/LICENSE)