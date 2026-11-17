#!/usr/bin/env python3
"""GIAO-2 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/GIAO-2/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/GIAO-2/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/GIAO-2/dot_bien.py --help

Khuôn viec/GIAO-1/dot_bien.py: chép server/, cong_cu/gia_lap/, bài thử, bộ kiểm và hai file client bài Z3 đọc ra thư mục tạm (BẢN CHÉP THẬT — chỉ
node_modules nối symlink), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG bản sao.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso, Ahamove thật (bài thử dùng Ahamove giả trong tiến trình).
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
GH, AH, RG = 'server/utils/giaoHang.js', 'server/utils/ahamove.js', 'server/routes/giao-hang.js'
MAN, API = 'client/src/pages/GiaoHang/index.jsx', 'client/src/utils/api.js'
BAI = {'g1': 'cong_cu/thu_GIAO1.js', 'g2': 'cong_cu/thu_GIAO2.js'}
CHEP = list(BAI.values()) + ['kiem_tra_truoc_khi_giao.js', MAN, API]

# (tên, bài, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A: trả lời ngay, xử lý sau ──
  ('BV-tra-loi-ngay', 'g2', [(RG, "  res.json({ success: true });   // GIAO-2: trả lời NGAY", "  gh.nhanTinBaoNen(req.body); await gh.choTinBao(); res.json({ success: true });   // GIAO-2: trả lời NGAY", 1),
    (RG, "\n  gh.nhanTinBaoNen(req.body);\n}));", "\n}));", 1)], r'✗ A1a '),
  ('VS-200-truoc-khoa', 'g2', [(RG, "  const khoa = process.env.AHAMOVE_KHOA_BAO;\n", "  res.json({ success: true }); gh.nhanTinBaoNen(req.body); return;\n  const khoa = process.env.AHAMOVE_KHOA_BAO;\n", 1)], r'✗ A1b '),
  ('VS-nen-khong-bat-loi', 'g2', [(GH, "  const p = nhanTinBao(ma).catch((e) => logLoi(", "  const p = nhanTinBao(ma).then(() => {}, (e) => { logLoi(", 1),
    (GH, "'xử lý tin', e)).finally(", "'xử lý tin', e); throw e; }).finally(", 1)], r'✗ A2c '),
  # ── vòng sửa 4 (soát vòng 3) ──
  ('VS-ma-tinh-lai', 'g2', [(GH, "  const p = nhanTinBao(ma).catch((e) => logLoi('tin', ma, 'xử lý tin', e))", "  const p = nhanTinBao(String(b?._id || b?.order_id || '')).catch((e) => logLoi('tin', String(b?._id || b?.order_id || ''), 'xử lý tin', e))", 1)], r'✗ A2e '),
  ('BV-ma-loc-ky-tu', 'g2', [(GH, ".replace(/[^A-Za-z0-9_-]/g, '')", "", 1)], r'✗ A2e '),
  ('BV-xoa-chong-lap-bat-loi', 'g2', [(GH, "\n      .catch((e2) => logLoi('tin', ma, 'gỡ dòng chống lặp', e2));", ";", 1)], r'✗ A2f '),
  ('BV-nhan-cap-nhat-the', 'g2', [(GH, "    buoc('cập nhật thẻ')(e);", "    throw e;", 1)], r'✗ A2d '),
  ('BV-gianh-bat-loi', 'g2', [(GH, "\n      .catch((e) => logLoi('doc_lai', c.ma_ahamove, 'ghi kho', e));", ";", 1)], r'✗ B2d '),
  ('BV-tin-dang-goi', 'g2', [(GH, "  if (c.trang_thai === 'dang_goi') return logGiao('tin', ma, '-', 'bỏ qua: thẻ đang gọi xe', t0);\n", "", 1)], r'✗ A4 '),
  ('VS-tin-dang-goi-409', 'g1', [(RG, "  res.json({ success: true });   // GIAO-2: trả lời NGAY", "  if ((await require('../database').queryOne('SELECT trang_thai FROM pos_giao_chuyen WHERE ma_ahamove = ?', [String(req.body?._id)]))?.trang_thai === 'dang_goi') return res.status(409).json({ code: 'DANG_GOI_XE' });\n  res.json({ success: true });   // GIAO-2: trả lời NGAY", 1)], r'✗ V10 '),
  ('BV-go-chong-lap', 'g2', [(GH, "    await run('DELETE FROM pos_giao_tin WHERE ma_ahamove = ? AND trang_thai = ? AND phu = ?', [ma, d.trang_thai, phu])\n      .catch((e2) => logLoi('tin', ma, 'gỡ dòng chống lặp', e2));   // lỗi này không che lỗi gốc\n", "", 1)], r'✗ A2d '),
  ('VS-go-chong-lap-moi-trang-thai', 'g2', [(GH, "'DELETE FROM pos_giao_tin WHERE ma_ahamove = ? AND trang_thai = ? AND phu = ?', [ma, d.trang_thai, phu]", "'DELETE FROM pos_giao_tin WHERE ma_ahamove = ? AND trang_thai = ? AND phu = ?', [ma, 'X', phu]", 1)], r'✗ A2d '),
  # ── B: đọc lại ──
  ('BV-mot-chuyen', 'g2', [(AH, "const motChuyen = (j) => { const o = Array.isArray(j) ? j[0] : j; return o && !(o._id || o.order_id) && o.order ? o.order : o; };", "const motChuyen = (j) => j;", 1)], r'✗ B1 '),
  ('VS-mot-chuyen-chi-mang', 'g2', [(AH, "return o && !(o._id || o.order_id) && o.order ? o.order : o; };", "return o; };", 1)], r'✗ B1 chi tiết chuyến bọc \{ order'),
  ('BV-han-doc-lai', 'g2', [(GH, "aha.docChuyen(c.ma_ahamove, HAN_DOC_LAI_MS)", "aha.docChuyen(c.ma_ahamove)", 1)], r'✗ B2a '),
  ('BV-han-lay-token', 'g2', [(AH, "api_key: process.env.AHAMOVE_API_KEY }, han: tuy.han });", "api_key: process.env.AHAMOVE_API_KEY } });", 1)], r'✗ B2c '),
  ('BV-han-goi-tho', 'g2', [(AH, "  signal: AbortSignal.timeout(han) });", "  signal: AbortSignal.timeout(HAN_GOI_MS) });", 1)], r'✗ B2a '),
  ('BV-log-loi-doc-lai', 'g2', [(GH, ".catch((e) => { logLoi('doc_lai', c.ma_ahamove, 'đọc Ahamove', e); return false; });", ".catch(() => false);", 1)], r'✗ B2b '),
  ('VS-phi-huy-loi-chung', 'g2', [(GH, "    } catch (e) { logLoi('phi_huy', t.ma_ahamove, 'ghi kho', e); }\n", "    } catch (e) { throw e; }\n", 1),
    (GH, "  const phiHuy = docLaiPhiHuy();", "  const phiHuy = docLaiPhiHuy().catch((e) => logLoi('phi_huy', '-', 'ghi kho', e));", 1)], r'✗ B2b '),
  ('VS-phi-huy-tuan-tu', 'g2', [(GH, "  await Promise.all(ds.map(async (t) => {   // song song", "  for (const t of ds) await (async () => {   // song song", 1),
    (GH, "    } catch (e) { logLoi('phi_huy', t.ma_ahamove, 'ghi kho', e); }\n  }));", "    } catch (e) { logLoi('phi_huy', t.ma_ahamove, 'ghi kho', e); }\n  })();", 1)], r'✗ B2a '),
  ('BV-han-phi-huy', 'g2', [(GH, "aha.docChuyen(t.ma_ahamove, HAN_DOC_LAI_MS)", "aha.docChuyen(t.ma_ahamove)", 1)], r'✗ B2a '),
  ('VS-phi-huy-sau-the', 'g2', [(GH, "  const phiHuy = docLaiPhiHuy();", "  const phiHuy = () => docLaiPhiHuy();", 1), (GH, "  await phiHuy;\n", "  await phiHuy();\n", 1)], r'✗ B2a '),
  ('BV-log-phi-huy', 'g2', [(GH, ".catch((e) => { logLoi('phi_huy', t.ma_ahamove, 'đọc Ahamove', e); return null; })", ".catch(() => null)", 1)], r'✗ B2b '),
  ('BV-chong-lap-changes', 'g2', [(GH, "  if (moi.changes !== 1) return logGiao('tin', ma, d.trang_thai, 'bỏ qua: tin lặp', t0);\n", "", 1)], r'✗ A3 '),
  ('BV-log-tin-bo-qua', 'g2', [(GH, "  if (c.trang_thai === 'dang_goi') return logGiao('tin', ma, '-', 'bỏ qua: thẻ đang gọi xe', t0);", "  if (c.trang_thai === 'dang_goi') return;", 1)], r'✗ B3c '),
  ('VS-log-suy-lai', 'g2', [(GH, "await capNhatTuAhamove(c, d).then((kq) => logGiao('doc_lai', c.ma_ahamove, d ? d.trang_thai : '-', kq, t0),", "await capNhatTuAhamove(c, d).then(() => logGiao('doc_lai', c.ma_ahamove, d ? d.trang_thai : '-', (d && trangThaiQuan(d)) || '-', t0),", 1)], r'✗ B3d '),
  ('BV-doc-lai-ngay', 'g2', [(GH, "lechGiay(now, -(docLaiNgay ? DOC_LAI_TAY_GIAY : DOC_LAI_GIAY))", "lechGiay(now, -DOC_LAI_GIAY)", 1)], r'✗ B4b '),
  ('VS-tai-lai-khong-chan-don', 'g2', [(GH, "lechGiay(now, -(docLaiNgay ? DOC_LAI_TAY_GIAY : DOC_LAI_GIAY))", "(docLaiNgay ? now + 'Z' : lechGiay(now, -DOC_LAI_GIAY))", 1)], r'✗ B4c '),
  ('VS-tai-lai-ca-hen-gio', 'g2', [(GH, "lechGiay(now, -(docLaiNgay ? DOC_LAI_TAY_GIAY : DOC_LAI_GIAY))", "lechGiay(now, -DOC_LAI_TAY_GIAY)", 1)], r'✗ B4a '),
  ('VS-tran-tai-lai', 'g2', [(GH, ".slice(0, docLaiNgay ? DOC_LAI_TAY_TOI_DA : DOC_LAI_TOI_DA)", ".slice(0, docLaiNgay ? 99 : DOC_LAI_TOI_DA)", 1)], r'✗ B4d '),
  ('BV-cua-doc-lai', 'g2', [(RG, "gh.danhSach(req.query.doc_lai === '1')", "gh.danhSach()", 1)], r'✗ B4b '),
  ('BV-log-giao', 'g2', [(GH, "const logGiao = (nguon, ma, ttAha, kq, t0) => console.log(", "const logGiao = (nguon, ma, ttAha, kq, t0) => (() => {})(", 1)], r'✗ B3a '),
  ('VS-log-sdt-tai-xe', 'g2', [(GH, "logGiao('doc_lai', c.ma_ahamove, d ? d.trang_thai : '-',", "logGiao('doc_lai', c.ma_ahamove, d ? d.trang_thai + ' ' + d.tai_xe.sdt : '-',", 1)], r'✗ B3b '),
  # ── màn ──
  ('BV-nut-tai-lai', 'g2', [(MAN, "onClick={() => tai(true)}>Tải lại", "onClick={() => tai()}>Tải lại", 1)], r'✗ Z3 '),
  ('VS-in-tem-truyen-doi-so', 'g2', [(MAN, "inTemTui(c, r.lan).then(() => tai());", "inTemTui(c, r.lan).then(tai);", 1)], r'✗ Z3 '),
  ('BV-api-doc-lai', 'g2', [(API, "${docLai ? '?doc_lai=1' : ''}", "", 1)], r'✗ Z3 '),
]


def ban_sao(thay):
  """Chép server/ + giả lập + bài thử + bộ kiểm ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_giao2_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), os.path.join(tmp, 'cong_cu', 'gia_lap'))   # doiSoat.js nạp bat_bien.js ở đây
  for f in CHEP:
    os.makedirs(os.path.dirname(os.path.join(tmp, f)) or tmp, exist_ok=True)
    shutil.copyfile(os.path.join(GOC, f), os.path.join(tmp, f))
  os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
  for f, goc, moi, n in thay:
    p = os.path.join(tmp, f)
    if not os.path.realpath(p).startswith(os.path.realpath(tmp) + os.sep):
      return tmp, f'{f}: đích ghi nằm NGOÀI thư mục tạm'   # K5
    s = open(p, encoding='utf-8').read()
    if s.count(goc) != n:
      return tmp, f'{f}: khớp {s.count(goc)} lần, cần {n}'
    open(p, 'w', encoding='utf-8').write(s.replace(goc, moi))
  return tmp, None


def chay_bai(tmp, bai):
  r = subprocess.run(['node', os.path.join(tmp, BAI[bai])], cwd=tmp, capture_output=True, text=True, timeout=300)
  return r.returncode, re.sub(r'\x1b\[[0-9;]*m', '', (r.stdout or '') + (r.stderr or ''))


def chay(ten, bai, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    ma, ra = chay_bai(tmp, bai)
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if not re.search(r'\d+ đạt · \d+ hỏng', ra) or 'Bài thử sập' in ra:
      return ten, 'LẠC', 'bài sập: ' + (hong[-1] if hong else ra.strip().splitlines()[-1][:160] if ra.strip() else '')
    if ma == 0:
      return ten, 'SỐNG', 'bài xanh trọn'
    khop = [l for l in hong if re.search(mau, l)]
    return (ten, 'BẮT', khop[0][:140]) if khop else (ten, 'LẠC', f'đỏ nhưng không khớp {mau}: ' + ' | '.join(h[:60] for h in hong[:3]))
  except subprocess.TimeoutExpired:
    return ten, 'LẠC', 'quá hạn 300 s'
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def doi_chung():
  tmp, _ = ban_sao([])
  try:
    ok, dong = True, []
    for bai in BAI:
      ma, ra = chay_bai(tmp, bai)
      m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
      ok = ok and ma == 0 and m is not None and m.group(2) == '0'
      dong.append(f'{bai}: ' + (m.group(0) if m else ra[-160:]) + ''.join(' | ' + l.strip()[:140] for l in ra.splitlines() if '✗' in l))
    return ok, ' · '.join(dong)
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  chon = [a for a in sys.argv[1:] if not a.startswith('--')]
  if '--liet-ke' in sys.argv:
    for t, *_ in DOT_BIEN: print(t)
    sys.exit(0)
  ds = [d for d in DOT_BIEN if not chon or d[0] in chon]
  if chon and len(ds) != len(chon):
    sys.exit('tên không có trong danh sách: ' + ', '.join(set(chon) - {d[0] for d in ds}))
  ok, dong = doi_chung()
  print(f'ĐỐI CHỨNG (bản chưa đột biến): {"XANH" if ok else "ĐỎ"} · {dong}')
  if not ok:
    sys.exit('đối chứng đỏ — không chạy đột biến (K3)')
  with ThreadPoolExecutor(max_workers=4) as ex:
    kq = list(ex.map(lambda d: chay(*d), ds))
  for ten, tt, ghi in kq: print(f'{tt:5} {ten} — {ghi}')
  dem = {t: sum(1 for _, x, _ in kq if x == t) for t in ('BẮT', 'SỐNG', 'HỎNG', 'LẠC')}
  print(f'TỔNG {len(kq)} đột biến · BẮT {dem["BẮT"]} · SỐNG {dem["SỐNG"]} · HỎNG {dem["HỎNG"]} · LẠC {dem["LẠC"]}')
  sys.exit(0 if dem['BẮT'] == len(kq) else 1)
