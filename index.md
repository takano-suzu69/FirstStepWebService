# 初めに

一人ででもできる！ AWSでWEBサービス開発入門With生成AI 用の公開リポジトリです。
初版(2024年版) と2025年版は章立てが違うので、それぞれのディレクトリをご確認ください。

# コンテンツ

## 初版

### サンプル画像

高野はPhotoshopにて作成しておりますが、作る場合は何のソフトウェアでも問題ありません。

- 6_arch2.jpg

「6.1 構築をする手順をAIに聞く」で使用したプロンプト画像です。
図5.21: WEBサービス②例の図です。

- 7_gamen.jpg

「6.2 アプリメーションコードの作成をAIと一緒に書く」で使用したプロンプト画像です。
図6.2の図です。

## 第2版

### 5章構築資材

　- api.js
  - app.js
  - auth.js 
  - config.js # 置換場所あり
  - index.html
  - styles.css
  - Template-webService.yaml

### セキュリティ対応用資材

  - api-secure.js # 置換場所あり
  - app.js
  - auth-secure.js # 置換場所あり
  - index.html
  - styles.css
  - function.zip
　- testweb-cloudformation.yaml

#### 使い方
1. testweb-cloudformation.yaml を使いCloudformationにてスタックを作成します
  
2. testweb-cloudformation.yaml で作成された Lambdaを、function.zip で更新します
    更新の仕方は、function.zip をs3に配置し、Lambdaページを開き、コードソースタブの右上「アップロード元」からS3を選択、
    配置したfunction.zip のURLを貼り付け、保存ボタンを押下してください。

3. testweb-cloudformation.yaml の出力より、CloudfrontのURLを確認し、
　　api-secure.js、auth-secure.jsの「https://xxxxxxxxxx.cloudfront.net」部分を置き換えてください。

4. testweb-cloudformation.yaml で作成されたS3に、api-secure.js、app.js、auth-secure.js、index.html、styles.css を
    配置します
    
5. CloudfrontのURLをブラウザからアクセスします。アプリケーションが呼び出せます！

   こちらはAmazonQ Developerの指摘を元にセキュリティ対応を行っておりますが、脆弱性診断は受けておりませんので、
   ご留意ください。

## 正誤表

見つけ次第こちらを更新します。

## 更新サマリ

2024/8/12 1.0
2025/5/30 1.99 (セキュリティ資材Up少々お待ちください)
2025/7/11 2.0  (セキュリティ資材Up完了)

# 連絡先

Twitter(X)@takano0131、または本書公開のメールアドレス経由でお願いいたします。
