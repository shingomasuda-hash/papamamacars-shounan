"""完成JPG内のオレンジ色「LINEで参加予約する」ボタンを検出し、
画像全体に対する%座標を public/index.html の CTA_COORDS ブロックへ書き込む。

使い方: python3 tools/measure_cta.py public/images/lp-shonan.jpg [--write]
検出結果は必ず目視で確認すること（--debug でボタン切り出し画像を出力）。
"""
import re
import sys
from pathlib import Path

from PIL import Image


def is_orange(r, g, b):
    return r > 200 and 90 < g < 190 and b < 110 and r - b > 120


def find_buttons(img, min_w_ratio=0.45, min_h=40):
    w, h = img.size
    px = img.load()
    rows = []
    for y in range(h):
        cnt = sum(1 for x in range(0, w, 2) if is_orange(*px[x, y][:3]))
        rows.append(cnt * 2)
    bands, start = [], None
    for y, c in enumerate(rows + [0]):
        if c >= w * min_w_ratio and start is None:
            start = y
        elif c < w * min_w_ratio and start is not None:
            if y - start >= min_h:
                bands.append((start, y))
            start = None
    boxes = []
    for y0, y1 in bands:
        xs = [x for y in range(y0, y1, 2) for x in range(w) if is_orange(*px[x, y][:3])]
        boxes.append((min(xs), y0, max(xs) + 1, y1))
    return boxes


def main():
    src = Path(sys.argv[1])
    img = Image.open(src).convert("RGB")
    w, h = img.size
    boxes = find_buttons(img)
    print(f"image {w}x{h}, buttons found: {len(boxes)}")
    for b in boxes:
        print("  px", b)
    if len(boxes) != 3:
        sys.exit("expected exactly 3 buttons; inspect manually")
    pad = 4  # タップしやすさのため数pxだけ外側へ拡張
    css = []
    for key, (x0, y0, x1, y1) in zip(["fv", "md", "bt"], boxes):
        x0, y0, x1, y1 = max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad)
        css.append(
            f"--{key}-l:{x0 / w * 100:.4f}%;--{key}-t:{y0 / h * 100:.4f}%;"
            f"--{key}-w:{(x1 - x0) / w * 100:.4f}%;--{key}-h:{(y1 - y0) / h * 100:.4f}%;"
        )
        if "--debug" in sys.argv:
            img.crop((x0, y0, x1, y1)).save(f"cta_{key}.png")
    block = "\n    ".join(css)
    print(block)
    if "--write" in sys.argv:
        html = Path("public/index.html")
        text = html.read_text(encoding="utf-8")
        text = re.sub(
            r"(/\* CTA_COORDS_START \*/).*?(/\* CTA_COORDS_END \*/)",
            lambda m: f"{m.group(1)}\n    {block}\n    {m.group(2)}",
            text,
            flags=re.S,
        )
        html.write_text(text, encoding="utf-8")
        print("written to public/index.html")


if __name__ == "__main__":
    main()
