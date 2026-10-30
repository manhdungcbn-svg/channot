"""Dữ liệu hành chính Việt Nam (tỉnh/thành phố + phường/xã).

Nguồn: `vietnam-address-data` (npm) — bám nghị quyết 1171/NQ-UBTVQH15, cập nhật
sau sáp nhất hành chính 01/07/2025 (34 tỉnh/thành, 3321 phường/xã).

Dữ liệu được đóng gói sẵn trong `data/` để backend không phụ thuộc mạng lúc
chạy. File sinh tự động bằng `scripts/build_vn_address.py`.

Cấu trúc file `provinces.json`:
    [{"code": "01", "name": "Hà Nội"}, ...]

Cấu trúc file `wards.json`:
    [{"code": "10101001", "name": "Phường Phú Thượng", "province_code": "01"}, ...]
"""
import json
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


@lru_cache(maxsize=1)
def _load_provinces() -> List[Dict[str, str]]:
    """Nạp danh sách tỉnh/thành phố (cache trong tiến trình)."""
    path = DATA_DIR / "provinces.json"
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    return [
        {"code": str(item["code"]), "name": str(item["name"])}
        for item in data
    ]


@lru_cache(maxsize=1)
def _load_wards() -> List[Dict[str, str]]:
    """Nạp danh sách phường/xã (cache trong tiến trình)."""
    path = DATA_DIR / "wards.json"
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    return [
        {
            "code": str(item["code"]),
            "name": str(item["name"]),
            "province_code": str(item["province_code"]),
        }
        for item in data
    ]


def list_provinces() -> List[Dict[str, str]]:
    """Danh sách tỉnh/thành phố."""
    return list(_load_provinces())


def list_wards(province_code: Optional[str] = None) -> List[Dict[str, str]]:
    """Danh sách phường/xã — lọc theo tỉnh nếu có `province_code`."""
    wards = _load_wards()
    if province_code:
        code = str(province_code).strip()
        wards = [item for item in wards if item["province_code"] == code]
    return list(wards)


def find_province(code: str) -> Optional[Dict[str, str]]:
    """Tìm 1 tỉnh theo mã."""
    target = str(code).strip()
    for item in _load_provinces():
        if item["code"] == target:
            return item
    return None


def find_ward(code: str) -> Optional[Dict[str, str]]:
    """Tìm 1 phường/xã theo mã."""
    target = str(code).strip()
    for item in _load_wards():
        if item["code"] == target:
            return item
    return None


def clear_cache() -> None:
    """Xoá cache — dùng trong test hoặc sau khi cập nhật dữ liệu."""
    _load_provinces.cache_clear()
    _load_wards.cache_clear()
