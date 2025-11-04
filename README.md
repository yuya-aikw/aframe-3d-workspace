# Info
[Japan Mobility Show Nagoya 2025 (2025/11/22~2025/11/24)](https://www.japan-mobility-show.com/) のWebXR実装

# File Structure
- [作っていただいた車体のモデル](https://nucl.slack.com/archives/C09LP0QSBM3/p1761111898226899?thread_ts=1760572530.666869&cid=C09LP0QSBM3)を展開
~~~
jms2025_demo
├── README.md
├── index.html
└── yamaha_ae88
    ├── public
    └── src
~~~

# Running
適当なサーバーを立ててhttpsでindex.htmlを開く
## Pythonの検証用webサーバー (httpのみ)
- ターミナルで`python -m http.server 8000`
- ブラウザで[http://localhost:8000](http://localhost:8000)にアクセス
- [WebXRの拡張機能](https://www.crossroad-tech.com/entry/immersive-web-emulator)
# Usage

# Tips
<!-- ## local開発環境でのSSL有効化
- https://tomoyayoshida.com/blog/mkcert-ssl-setup/
1. SSL証明書と秘密鍵の作成
~~~

~~~ -->