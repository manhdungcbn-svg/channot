/**
 * Component chọn địa chỉ dạng cascade: Tỉnh/Thành phố → Phường/Xã → Số nhà, đường.
 *
 * Dùng chung cho trang Tài khoản (sổ địa chỉ) và trang Giỏ hàng (checkout).
 * Dữ liệu tỉnh/xã lấy từ `GET /api/shop/admin/provinces` & `/wards`
 * (endpoint public của backend, theo sáp nhất hành chính 01/07/2025).
 *
 * Props:
 *  - provinceCode  : mã tỉnh đang chọn ('' nếu chưa chọn)
 *  - wardCode      : mã phường/xã đang chọn
 *  - detail        : số nhà, đường
 *  - onChange      : (next) => void, next = { provinceCode, wardCode, addressDetail, provinceName, wardName }
 *  - error         : thông báo lỗi hiển thị dưới form
 *  - disabled      : khoá toàn bộ form
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { getProvinces, getWards } from '../../api/address';

const INPUT_CLASS =
  'h-12 w-full rounded-xl border-2 border-line-200 bg-white px-4 text-base text-ink-900 placeholder:text-ink-300 transition-colors duration-150 focus:border-brand-accent focus:outline-none';

const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-ink-700';

const SELECT_CLASS = `${INPUT_CLASS} appearance-none bg-white pr-10 disabled:bg-surface-subtle disabled:text-ink-300`;

export function AddressPicker({
  provinceCode = '',
  wardCode = '',
  detail = '',
  onChange = () => {},
  error = '',
  disabled = false,
  idPrefix = 'address',
}) {
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingWards, setLoadingWards] = useState(false);
  const [wardsError, setWardsError] = useState('');

  // Tên đã chọn (để hiển thị tên đầy đủ + ghép chuỗi địa chỉ gửi API).
  const provinceName = useMemo(
    () => provinces.find((item) => item.code === provinceCode)?.name ?? '',
    [provinces, provinceCode],
  );
  const wardName = useMemo(
    () => wards.find((item) => item.code === wardCode)?.name ?? '',
    [wards, wardCode],
  );

  // Nạp danh sách tỉnh (cache trong module `api/address`).
  useEffect(() => {
    let cancelled = false;
    setLoadingProvinces(true);

    getProvinces()
      .then((data) => {
        if (!cancelled) setProvinces(data);
      })
      .finally(() => {
        if (!cancelled) setLoadingProvinces(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Nạp danh sách phường/xã theo tỉnh đang chọn.
  const wardRequestRef = useRef(0);
  useEffect(() => {
    const requestId = wardRequestRef.current + 1;
    wardRequestRef.current = requestId;

    if (!provinceCode) {
      setWards([]);
      setLoadingWards(false);
      setWardsError('');
      return undefined;
    }

    let cancelled = false;
    setLoadingWards(true);
    setWardsError('');

    getWards(provinceCode)
      .then((data) => {
        if (cancelled || wardRequestRef.current !== requestId) return;
        setWards(data);
        if (data.length === 0) {
          setWardsError('Không tải được danh sách phường/xã');
        }
      })
      .finally(() => {
        if (cancelled || wardRequestRef.current !== requestId) return;
        setLoadingWards(false);
      });

    return () => {
      cancelled = true;
    };
  }, [provinceCode]);

  const handleProvinceChange = (event) => {
    const nextProvinceCode = event.target.value;
    onChange({
      provinceCode: nextProvinceCode,
      wardCode: '',
      addressDetail: detail,
      provinceName: provinces.find((item) => item.code === nextProvinceCode)?.name ?? '',
      wardName: '',
    });
  };

  const handleWardChange = (event) => {
    const nextWardCode = event.target.value;
    onChange({
      provinceCode,
      wardCode: nextWardCode,
      addressDetail: detail,
      provinceName,
      wardName: wards.find((item) => item.code === nextWardCode)?.name ?? '',
    });
  };

  const handleDetailChange = (event) => {
    onChange({
      provinceCode,
      wardCode,
      addressDetail: event.target.value,
      provinceName,
      wardName,
    });
  };

  const fullAddress = [detail, wardName, provinceName].filter(Boolean).join(', ');

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}-province`} className={LABEL_CLASS}>
            Tỉnh / Thành phố <span className="text-status-danger-text">*</span>
          </label>
          <select
            id={`${idPrefix}-province`}
            value={provinceCode}
            onChange={handleProvinceChange}
            disabled={disabled}
            className={SELECT_CLASS}
          >
            <option value="">
              {loadingProvinces ? 'Đang tải danh sách tỉnh…' : '-- Chọn tỉnh/thành phố --'}
            </option>
            {provinces.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${idPrefix}-ward`} className={LABEL_CLASS}>
            Phường / Xã <span className="text-status-danger-text">*</span>
          </label>
          <select
            id={`${idPrefix}-ward`}
            value={wardCode}
            onChange={handleWardChange}
            disabled={disabled || !provinceCode}
            className={SELECT_CLASS}
          >
            <option value="">
              {!provinceCode
                ? '-- Chọn tỉnh/thành phố trước --'
                : loadingWards
                  ? 'Đang tải…'
                  : '-- Chọn phường/xã --'}
            </option>
            {wards.map((ward) => (
              <option key={ward.code} value={ward.code}>
                {ward.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-detail`} className={LABEL_CLASS}>
          Số nhà, đường <span className="text-status-danger-text">*</span>
        </label>
        <input
          id={`${idPrefix}-detail`}
          type="text"
          value={detail}
          onChange={handleDetailChange}
          disabled={disabled}
          placeholder="Ví dụ: Số 123, Nguyễn Huệ"
          autoComplete="street-address"
          className={INPUT_CLASS}
        />
      </div>

      {wardsError ? (
        <p className="text-xs text-ink-500">
          Không tải được danh sách phường/xã. Bạn vẫn có thể nhập địa chỉ bằng tay ở trên.
        </p>
      ) : null}

      {fullAddress ? (
        <div className="rounded-xl bg-surface-subtle px-3.5 py-2.5">
          <p className="text-xs font-medium text-ink-500">Địa chỉ đầy đủ</p>
          <p className="mt-0.5 text-sm font-medium text-ink-900 text-pretty">{fullAddress}</p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm font-medium text-status-danger-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default AddressPicker;
