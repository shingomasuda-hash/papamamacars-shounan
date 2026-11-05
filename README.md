# PAPAMAMA CAR'S ららぽーと湘南平塚店｜試乗体験イベント LP

承認済み完成デザイン（JPG 585×11688px）をそのまま縦長LPとして公開する静的サイト。
堺店（`papamamacars-sakai`）とは独立したリポジトリ・Vercelプロジェクトで公開する。

- `public/index.html` … LP本体（GTM-KPB2C8K、LINE予約CTA×3、dataLayer計測）
- `public/images/lp-shonan.jpg` … 完成デザイン画像（Drive: `1anRapohWNv9Pb9jwnqfPHfEjYcuEQAk9`
  「PAPAMAMA｜湘南平塚店｜承認B案反映｜SP390・別案.jpg」）
- `tools/measure_cta.py` … 画像内のオレンジ色予約ボタンを検出し%座標を index.html に反映
- `tools/verify.js` … 375/390/430/1280px で表示・CTA遷移・GTM・dataLayer を検証
- `vercel.json` … Vercel 静的配信設定（出力ディレクトリ `public`）

## 湘南平塚店固有の注意
- LOVE LOCK／湘南平への試乗／PHOTO TIME は湘南店独自コンテンツ。堺店の工場見学に差し替えない。
- 画像下部の「正式な予約先は確認中」注記は、公開版画像から該当部分のみ除去すること。

## 予約URL（湘南平塚店専用）
`https://s.lmes.jp/landing-qr/2007227153-vjoL5182?uLand=0UuHe7`

## クリック計測（dataLayer）

```js
{ event: 'line_reservation_click', store_name: 'shonan',
  cta_position: 'first_view' | 'middle' | 'bottom',
  destination_url: 'https://s.lmes.jp/landing-qr/2007227153-vjoL5182?uLand=0UuHe7' }
```

GTM側：カスタムイベントトリガー `line_reservation_click` ＋ データレイヤー変数
`store_name` / `cta_position` / `destination_url` を作成し、GA4イベント等に渡す。
既存の「リンククリック（s.lmes.jp）」系トリガーがある場合は二重計測になるため、どちらか一方に統一する。

## 手順
```bash
python3 tools/measure_cta.py public/images/lp-shonan.jpg --debug --write
node tools/verify.js            # ローカル検証
node tools/verify.js https://<公開URL>/   # 公開後検証
```
