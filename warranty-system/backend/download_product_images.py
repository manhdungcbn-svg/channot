"""Tải ảnh sản phẩm từ Wikimedia Commons về static/shop/ (dùng cho demo).

Mỗi ảnh được chuẩn hoá:
- JPEG vuông 800x800, nền trắng (để đồng đều thẻ sản phẩm).
- Ghi kèm CREDITS.md với nguồn + giấy phép.

CHẠY: python download_product_images.py
"""
import io
import json
import os
import sys
import time
import urllib.parse
import urllib.request

from PIL import Image, ImageOps

sys.stdout.reconfigure(encoding="utf-8")

UA = {"User-Agent": "DemoShopImageFetcher/1.0 (educational demo; manhdungcbn@gmail.com)"}
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(BASE_DIR, "static", "shop")
SIZE = 800

# slug -> (từ khoá tìm, tiêu đề file Commons ưu tiên)
IMAGES = {
    "tivi-qled-4k-55-inch": ("QLED television", "File:Samsung QLED TV 8K - 75 inches - 2018-11-02.jpg"),
    "tivi-led-4k-50-inch": ("flat screen television set", "File:A flat-screen television.jpg"),
    "may-loc-nuoc-ro-kang": ("water purifier reverse osmosis", "File:Eureka Forbes RO water purifier.jpg"),
    "quat-thap-quay-stand": ("tower fan", "File:Ventilatore a torre Orieme.jpg"),
    "tu-lanh-inverter-300l": ("refrigerator freezer", "File:SAMSUNG REFRIGERATOR RF60J9030WZ.jpg"),
    "loa-soundbar-ham-2-1ch": ("soundbar", "File:SAMSUNG SOUNDBAR HW-J250.jpg"),
    "tai-nghe-chup-tai-khong-day": ("over-ear headphones", "File:Sony WH-CH510 Bluetooth Over-Ear Headphone.jpg"),
    "may-lanh-inverter-2hp": ("air conditioner indoor unit", "File:DAIKIN AIR CONDITIONER INDOOR UNIT (14).jpg"),
    "robot-hut-bui-roborock-s8": ("robot vacuum cleaner", "File:Robot Vacuum - Charging (50841204983).jpg"),
    "noi-chien-khong-dau-5l": ("air fryer", "File:Air Fryer 2020.jpg"),
    "bep-tu-induction-3-vung": ("induction cooktop", "File:Eupa TSI-IH1880.jpg"),
    "am-sieu-toc-bo-1-7l": ("electric kettle stainless", "File:Breville.jpg"),
    "den-thong-minh-16m-led": ("LED light bulb", "File:Jevah 9-Watt LED Bulb.jpg"),
    "sac-du-phong-20000mah": ("USB power bank portable charger", "File:Powerbank Xiaomi, 3.jpg"),
    "may-hut-bui-cam-tay-20k": ("handheld vacuum cleaner", "File:Dyson V6 Trigger handheld vacuum.jpg"),
    "may-giat-inverter-10kg": ("washing machine", "File:Washing machine LG.png"),
}


def api_search(query, limit=10):
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": f"filetype:bitmap {query}",
        "gsrnamespace": "6",
        "gsrlimit": str(limit),
        "prop": "imageinfo",
        "iiprop": "url|mime|extmetadata",
        "iiurlwidth": str(SIZE * 2),
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.load(resp)
    pages = (data.get("query") or {}).get("pages") or {}
    return list(pages.values())


def fetch_image(slug, query, preferred_title):
    """Tìm ảnh ưu tiên, fallback ảnh đầu tiên tìm được."""
    for attempt in range(5):
        try:
            pages = api_search(query)
            break
        except urllib.error.HTTPError as exc:
            if exc.code == 429:
                wait = 12 * (attempt + 1)
                print(f"  rate-limited, chờ {wait}s…")
                time.sleep(wait)
                continue
            raise
    else:
        raise RuntimeError("Không gọi được Commons API")

    chosen = None
    for page in pages:
        if page.get("title") == preferred_title:
            chosen = page
            break
    if chosen is None and pages:
        chosen = pages[0]
    if chosen is None:
        raise RuntimeError(f"Không có ảnh cho {slug}")

    info = (chosen.get("imageinfo") or [{}])[0]
    meta = info.get("extmetadata") or {}

    def meta_value(key):
        value = (meta.get(key) or {}).get("value", "")
        # Bỏ HTML tags đơn giản
        import re

        return re.sub(r"<[^>]+>", "", value).strip()

    record = {
        "slug": slug,
        "title": chosen.get("title"),
        "artist": meta_value("Artist"),
        "license": meta_value("LicenseShortName"),
        "source": info.get("descriptionurl") or "",
        "download_url": info.get("thumburl") or info.get("url"),
    }
    print(f"  chọn {record['title']} [{record['license']}]")
    return record


def download(record):
    req = urllib.request.Request(record["download_url"], headers=UA)
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                raw = resp.read()
            break
        except urllib.error.HTTPError as exc:
            if exc.code == 429:
                wait = 15 * (attempt + 1)
                print(f"  tải bị chặn, chờ {wait}s…")
                time.sleep(wait)
                continue
            raise
    else:
        raise RuntimeError("Không tải được ảnh")

    img = Image.open(io.BytesIO(raw))
    # PNG/JPEG -> RGB trên nền trắng (giữ sản phẩm rõ nét)
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        background = Image.new("RGBA", img.size, (255, 255, 255, 255))
        img = Image.alpha_composite(background, img)
    img = img.convert("RGB")
    img = ImageOps.exif_transpose(img)

    # Cắt vuông giữa ảnh, thu về 800x800, thêm viền trắng nhẹ
    img = ImageOps.fit(img, (SIZE, SIZE), method=Image.LANCZOS, centering=(0.5, 0.5))
    out_path = os.path.join(OUT_DIR, f"{record['slug']}.jpg")
    img.save(out_path, "JPEG", quality=86, optimize=True)
    record["file"] = f"/static/shop/{record['slug']}.jpg"
    record["bytes"] = os.path.getsize(out_path)
    print(f"  lưu {out_path} ({record['bytes'] // 1024} KB)")
    return record


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    credits = []
    for slug, (query, preferred) in IMAGES.items():
        print(f"\n=== {slug} ===")
        try:
            record = fetch_image(slug, query, preferred)
            record = download(record)
            credits.append(record)
        except Exception as exc:  # noqa: BLE001
            print(f"  [LỖI] {exc}")
        time.sleep(4)

    credits_path = os.path.join(BASE_DIR, "static", "shop", "CREDITS.md")
    with open(credits_path, "w", encoding="utf-8") as fh:
        fh.write("# Nguồn ảnh sản phẩm demo\n\n")
        fh.write("Ảnh lấy từ Wikimedia Commons, giấy phép tự do (xem từng dòng).\n")
        fh.write("Ảnh được cắt vuông 800x800 và nén JPEG cho demo, không chỉnh nội dung.\n\n")
        fh.write("| Slug | Tệp Commons | Tác giả | Giấy phép | Nguồn |\n")
        fh.write("| --- | --- | --- | --- | --- |\n")
        for item in credits:
            fh.write(
                f"| `{item['slug']}` | {item['title']} | {item['artist']} | "
                f"{item['license']} | {item['source']} |\n"
            )
    print(f"\nĐã ghi {credits_path}")
    print(f"Tổng: {len(credits)}/{len(IMAGES)} ảnh.")


if __name__ == "__main__":
    main()