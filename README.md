# PAPAMAMA CAR'S ららぽーと湘南平塚店｜試乗体験イベント LP

承認済み完成デザイン（元JPG 585×11688px → 改訂版 585×11260px）をそのまま縦長LPとして公開する静的サイト。
堺店（`papamamacars-sakai`）とは独立したリポジトリ・Vercelプロジェクトで公開する。

- `public/index.html` … LP本体（GTM-KPB2C8K、LINE予約CTA×3、dataLayer計測）
- `public/images/lp-shonan.jpg` … 完成デザイン画像（Drive: `1anRapohWNv9Pb9jwnqfPHfEjYcuEQAk9`
  「PAPAMAMA｜湘南平塚店｜承認B案反映｜SP390・別案.jpg」）
- `tools/measure_cta.py` … 画像内のオレンジ色予約ボタンを検出し%座標を index.html に反映
- `tools/verify.js` … 375/390/430/1280px で表示・CTA遷移・GTM・dataLayer を検証
- `vercel.json` … Vercel 静的配信設定（出力ディレクトリ `public`）

## 湘南平塚店固有の注意
- 堺店の工場見学コンテンツに差し替えない（湘南平への試乗・PHOTO TIME は湘南店独自）。
- 画像下部の注記「予約後のご案内方法・正式な予約先は確認中。」は除去済み。

## 改訂履歴（公開版画像）
- 2026-11-05: 元デザインから最下部の注記を除去、q90/4:4:4/progressive で再保存。
- 2026-11-12: 愛の南京錠を外し、US MILE BOX 試乗をメインに、キャンペーン追加。
  - 導入「走る。願う。写真に残す。」→「走る。写真に残す。」、導入文を試乗中心の文に差し替え、
    「DRIVE / LOVE LOCK / PHOTO」→「参加費無料 / 事前予約制 / 往復約2時間」
  - 「02 / LOVE LOCK」セクション削除、PHOTO TIME を 02 に繰り上げ、イラストから南京錠を除去
  - YOUR DAY「03 愛の南京錠に想いを」削除・番号詰め
  - YOUR DAY 予約ボタン直後に CAMPAIGN（堺店4周年記念 オプション割引ガチャ／期間 11月中／
    対象 湘南平塚店でのご成約・オンラインでのご成約）を追加
  - イベント情報「愛の南京錠（参加者無料）」→「US MILE BOXの試乗（走り・乗り心地・使い勝手）」、イラストの南京錠を除去
  - FAQ「愛の南京錠も参加者無料です。」を削除
  - 未変更: YOUR COLOR のイラスト（南京錠あり）、LET'S GO の「走って、願って、写真に残して。」

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
