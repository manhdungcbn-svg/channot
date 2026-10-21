"""
Backfill price + description cho cac san pham co san trong DB.
- KHONG xoa du lieu cu.
- Idempotent: skip neu ca 2 truong da duoc fill.
- Chay: python -m scripts.backfill_product_commercial
"""

import sys

sys.stdout.reconfigure(encoding="utf-8")

from sqlalchemy import text

from app.core.database import SessionLocal


# Bang backfill: serial -> (price VND, description)
SEED_DATA = [
    ("RWF-2026-0001", 1890000, "Router WiFi 6 ban chinh hang, 4 anten, 1 cong WAN 2.5Gbps."),
    ("CAM-2026-0001", 2490000, "Camera giam sat 4MP, ho tro night vision va phat hien chuyen dong."),
    ("SW-2025-0001", 3290000, "Switch 8 cong Gigabit, QoS toi uu cho gaming va streaming."),
    ("MSH-2026-0002", 4590000, "He thong WiFi Mesh 2-pack, phu song den 200m2."),
    ("RWF-2026-0005", 2190000, "Router WiFi 6 Pro, CPU quad-core, 4 cong LAN 1Gbps."),
    ("CAM-2026-0006", 3790000, "Camera IP 8MP ngoai troi, chuan IP67, ho tro PoE+."),
    ("SW-2026-0007", 5690000, "Switch 16 cong Gigabit, 4 cong SFP+, quan ly Layer 2."),
    ("MSH-2026-0008", 6290000, "WiFi Mesh 3-pack, ho tro WiFi 6E, cau hinh app dien thoai."),
    ("CAM-2026-0009", 4990000, "Camera PTZ ngoai troi, zoom quang hoc 5x, the nho 256GB."),
    ("RWF-2026-0010", 8990000, "Router WiFi 7 flagship, cong 10G, 4 band, MU-MIMO."),
]


def main():
    db = SessionLocal()
    try:
        updated = 0
        skipped = 0
        missing = []
        for serial, price, description in SEED_DATA:
            row = db.execute(
                text("SELECT id, price, description FROM products WHERE serial_number = :s"),
                {"s": serial},
            ).first()
            if not row:
                missing.append(serial)
                continue
            pid, cur_price_v, cur_desc = row
            # Skip neu ca price va description da fill (idempotent).
            if cur_price_v is not None and (cur_desc or "").strip():
                skipped += 1
                continue
            db.execute(
                text("UPDATE products SET price = :p, description = :d WHERE id = :id"),
                {"p": price, "d": description, "id": pid},
            )
            updated += 1
        db.commit()
        print(f"[OK] Updated={updated} Skipped={skipped} Missing={len(missing)}")
        if missing:
            print(f"[WARN] Serials khong ton tai trong DB: {missing}")
    except Exception as e:
        db.rollback()
        print(f"[ERR] Loi: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()