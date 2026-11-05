// 公開前/公開後チェック: node tools/verify.js [URL]  (省略時は public/ をローカル配信して検証)
// 375/390/430px(スマホ) と 1280px(PC) で表示・CTA・GTM・dataLayer を確認する。
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SHONAN_URL = 'https://s.lmes.jp/landing-qr/2007227153-vjoL5182?uLand=0UuHe7';
const SAKAI_ID = '2007227107-GgA3P6zw';
const IMG_W = 585, IMG_H = 11688;

function serve() {
  const root = path.join(__dirname, '..', 'public');
  const types = { '.html': 'text/html; charset=utf-8', '.jpg': 'image/jpeg' };
  return new Promise((res) => {
    const s = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f)) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(rsp);
    }).listen(0, () => res(s));
  });
}

(async () => {
  let url = process.argv[2], server;
  if (!url) { server = await serve(); url = `http://127.0.0.1:${server.address().port}/`; }
  const browser = await chromium.launch();
  let fail = 0;
  const ok = (c, m) => { console.log(`${c ? 'OK  ' : 'FAIL'} ${m}`); if (!c) fail++; };

  for (const width of [375, 390, 430, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, isMobile: width < 600, hasTouch: width < 600 });
    const page = await ctx.newPage();
    const errors = [], gtm = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('request', (r) => { if (r.url().includes('googletagmanager.com/gtm.js?id=GTM-KPB2C8K')) gtm.push(r.url()); });
    // 外部遷移は止めて URL だけ記録
    await page.route('https://s.lmes.jp/**', (r) => r.fulfill({ status: 200, body: 'stub' }));
    await page.goto(url, { waitUntil: 'load' });
    const info = await page.evaluate(() => {
      const img = document.querySelector('.lp__img');
      const r = img.getBoundingClientRect();
      return {
        title: document.title, nat: [img.naturalWidth, img.naturalHeight], complete: img.complete,
        rect: [r.width, r.height], scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth,
        html: document.documentElement.outerHTML,
        gtmTags: document.querySelectorAll('script[src*="gtm.js"]').length,
        ctas: [...document.querySelectorAll('.lp__cta')].map((a) => {
          const b = a.getBoundingClientRect();
          return { pos: a.dataset.ctaPosition, href: a.href, label: a.getAttribute('aria-label'), w: b.width, h: b.height, x: b.x + b.width / 2, y: b.y + window.scrollY + b.height / 2 };
        }),
      };
    });
    const p = `[${width}px]`;
    ok(info.title === "PAPAMAMA CAR'S ららぽーと湘南平塚店｜試乗体験イベント", `${p} title`);
    ok(info.complete && info.nat[0] === IMG_W && info.nat[1] === IMG_H, `${p} image loaded ${info.nat.join('x')}`);
    ok(Math.abs(info.rect[1] / info.rect[0] - IMG_H / IMG_W) < 0.01, `${p} aspect ratio kept ${info.rect.map(Math.round).join('x')}`);
    ok(info.scrollW <= info.clientW, `${p} no horizontal scroll (${info.scrollW}/${info.clientW})`);
    ok(!info.html.includes(SAKAI_ID), `${p} no Sakai URL`);
    ok(info.gtmTags === 1 && gtm.length === 1, `${p} GTM-KPB2C8K loaded once`);
    ok(info.ctas.length === 3, `${p} 3 CTAs`);
    for (const c of info.ctas) {
      ok(c.href === SHONAN_URL && c.label && c.w > 40 && c.h > 20, `${p} CTA ${c.pos} ${Math.round(c.w)}x${Math.round(c.h)} href ok`);
      await page.evaluate((y) => window.scrollTo(0, y - 300), c.y);
      const sy = await page.evaluate(() => window.scrollY);
      const [nav] = await Promise.all([
        page.waitForEvent('framenavigated', { timeout: 5000 }).catch(() => null),
        page.mouse.click(c.x, c.y - sy),
      ]);
      ok(nav && nav.url() === SHONAN_URL, `${p} CTA ${c.pos} tap → ${nav ? nav.url() : 'no navigation'}`);
      await page.goto(url, { waitUntil: 'load' });
    }
    // dataLayer イベント（遷移を止めて確認）
    const pushes = await page.evaluate(() => {
      document.addEventListener('click', (e) => e.preventDefault(), true);
      document.querySelectorAll('.lp__cta').forEach((a) => a.click());
      return window.dataLayer.filter((d) => d.event === 'line_reservation_click');
    });
    ok(pushes.length === 3 && pushes.every((d) => d.store_name === 'shonan' && d.destination_url === SHONAN_URL)
      && pushes.map((d) => d.cta_position).join() === 'first_view,middle,bottom', `${p} dataLayer line_reservation_click x3`);
    ok(errors.length === 0, `${p} no JS errors ${errors.join(' | ')}`);
    await ctx.close();
  }
  await browser.close();
  if (server) server.close();
  console.log(fail ? `\n${fail} check(s) failed` : '\nall checks passed');
  process.exit(fail ? 1 : 0);
})();
