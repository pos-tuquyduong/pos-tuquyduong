// BAO-1b — lỗi nào của máy chủ là lỗi của ô PIN (server/utils/pinChuQuan.js: PIN_CHU_QUAN_SAI / _KHOA / _KHONG_HOP_LE, CHUA_CO_PIN_CHU_QUAN).
export const laLoiPin = (e) => /^(PIN_CHU_QUAN_|CHUA_CO_PIN_)/.test((e && e.code) || '');
