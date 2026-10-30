"""Sinh lại dữ liệu hành chính Việt Nam cho backend từ npm package.

Dùng khi cần cập nhật theo sáp nhất hành chính mới:

    python scripts/build_vn_address.py

Script tải `vietnam-address-data` từ npm registry, chuẩn hoá về:
    app/data/provinces.json
    app/data/wards.json
"""
import json
import sys
import tarfile
import tempfile
import urllib.request
from pathlib import Path

PACKAGE = "vietnam-address-data"
TARBALL_URL = "https://registry.npmjs.org/vietnam-address-data/-/vietnam-address-data-1.0.0.tgz"

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_DIR / "app" / "data"


def _download_and_extract(target_dir: Path) -> Path:
    """Tải tarball package và trả về thư mục đã giải nén."""
    tarball = target_dir / "pkg.tgz"
    print(f"Đang tải {TARBALL_URL} ...")
    with urllib.request.urlopen(TARBALL_URL, timeout=60) as response:
        tarball.write_bytes(response.read())

    print("Đang giải nén ...")
    with tarfile.open(tarball, "r:gz") as archive:
        archive.extractall(target_dir)
    return target_dir / "package"


def _read_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def main() -> int:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        package_dir = _download_and_extract(Path(tmp))
        provinces = _read_json(package_dir / "dist" / "data" / "provinces.json")
        wards = _read_json(package_dir / "dist" / "data" / "wards.json")

    out_provinces = [
        {"code": str(item["id"]), "name": str(item["name"]).strip()}
        for item in provinces
    ]
    out_wards = [
        {
            "code": str(item["id"]),
            "name": str(item["name"]).strip(),
            "province_code": str(item["provinceId"]),
        }
        for item in wards
    ]

    (DATA_DIR / "provinces.json").write_text(
        json.dumps(out_provinces, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (DATA_DIR / "wards.json").write_text(
        json.dumps(out_wards, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"✓ Đã ghi {len(out_provinces)} tỉnh/thành → {DATA_DIR / 'provinces.json'}")
    print(f"✓ Đã ghi {len(out_wards)} phường/xã → {DATA_DIR / 'wards.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
