#!/usr/bin/env python3
"""KHO-2b — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KHO-2b/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/KHO-2b/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/KHO-2b/dot_bien.py --goc <sha>        (bằng chứng ĐỎ: bài hiện tại trên server/ của commit sha)
    python3 viec/KHO-2b/dot_bien.py --help             (in hướng dẫn này)

Khuôn viec/KHO-2a/dot_bien.py: chép server/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi chuỗi
phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, không bao giờ đếm là đạt, K3), chạy `node cong_cu/thu_KHO2b.js --may-chu <bản sao>`.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Thoát 2 (bài sập) hoặc đỏ mà không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
T, D, L, NH, PS, S, B7 = ('server/kho/tinh.js', 'server/kho/duong.js', 'server/kho/duLieu.js', 'server/kho/nhapHang.js', 'server/kho/phatSinh.js',
                          'server/routes/settings.js', 'server/nang_cap/007_kho_nhap_hang.js')

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A: đơn đặt hàng ──
  ('BV-DH-VAO-TON', [(L, "\"p.trang_thai = 'da_duyet' AND p.loai <> 'DH'\"", "\"p.trang_thai = 'da_duyet'\"", 1)], r'✗ A9 '),
  ('VS-DH-KHONG-GOP', [(T, 'm.set(d.nguyen_lieu_id, (m.get(d.nguyen_lieu_id) || 0) + d.luong);', 'm.set(d.nguyen_lieu_id, d.luong);', 1)], r'✗ A[12] '),
  ('VS-HAN-MUC-LON-HON-BANG', [(T, 'tong != null && tong <= muc', 'tong != null && tong < muc', 1)], r'✗ A(4|7b) '),
  ('VS-THIEU-GIA-DUOI-HAN-MUC', [(T, 'tong != null && tong <= muc', '(tong ?? 0) <= muc', 1)], r'✗ A8 '),
  ('VS-DH-NV-TU-DUYET', [(NH, "(vaiTro === 'manager' && tinh.trongHanMuc(", "(vaiTro !== 'owner' && tinh.trongHanMuc(", 1)], r'✗ A6 '),
  ('BV-CAN-CHU-QUAN', [(L, "vaiTro !== 'owner' && await dhCanChuQuan(tx, id)", "vaiTro !== 'owner' && false", 1)], r'✗ A5 '),
  ('BV-DS-CAN-CHU-QUAN', [(L, "can_chu_quan: p.loai === 'DH' && p.trang_thai === 'cho_duyet' && await dhCanChuQuan(csdl, p.id) });", 'can_chu_quan: false });', 1)],
    r'✗ A5b '),
  ('BV-HAN-MUC-CAI-DAT', [(S, "['kho_han_muc_dat_hang', 'kho_han_muc_noi_bo'].includes(key) && !", 'false && !', 1)], r'✗ (A10|D8) '),
  # ── B / C: nhận hàng ──
  ('BV-PN-NGUOI-KHAC', [(L, "    AND trang_thai = 'cho_duyet' AND nguoi_tao <> ?`, [nguoi, luc, id, nguoi]);",
    "    AND trang_thai = 'cho_duyet' AND ? IS NOT NULL`, [nguoi, luc, id, nguoi]);", 1)], r'✗ (B1|B8/C1) '),
  ('VS-PN-CONG-LUC-TAO', [(NH, "{ loai: 'PN', tuDuyet: ep,", "{ loai: 'PN', tuDuyet: true,", 1)], r'✗ B1 '),
  ('BV-GHI-KHO-NHAN', [(L, "PN: () => require('./nhapHang').ghiKhoNhan(tx, id, luc),", 'PN: () => ({}),', 1)], r'✗ B2 '),
  ('BV-CON-LAI-TRU-PN-CHO', [(L, "AND p.trang_thai IN ('cho_duyet', 'da_duyet') AND d.loai = 'nhap'`, ids);", "AND p.trang_thai = 'da_duyet' AND d.loai = 'nhap'`, ids);", 1)],
    r'✗ B4 '),
  ('BV-DON-DA-DONG', [(NH, "if ((await duLieu.docConLaiDon(tx, donId)).du) return", 'if (false) return', 1)], r'✗ B4b '),
  ('BV-HAN-TU-DIEN', [(NH, 'd.han ?? duLieu.hanLo(luc, han.get(d.nguyen_lieu_id)?.han_ngay)', 'd.han', 1)], r'✗ B7 '),
  ('BV-LECH-PN', [(L, 'lech: dat !== undefined && Math.abs(dat - luong) > SAI_SO', 'lech: false', 1)], r'✗ G3 '),
  # ── D: phát sinh ──
  ('VS-FEFO-BO-LO-QUA-HAN', [(PS, "duLieu.conLaiTheoLo(tx, `l.${cot} = ?`, [id], LO_FEFO)",
    "duLieu.conLaiTheoLo(tx, `l.${cot} = ? AND (l.han_dung IS NULL OR l.han_dung > '2026-11-07T12:00:00')`, [id], LO_FEFO)", 1)], r'✗ D2 '),
  ('BV-HAN-MUC-NOI-BO', [(PS, "const vuot = suCo === 'noi_bo' && !tinh.trongHanMuc(", 'const vuot = false && !tinh.trongHanMuc(', 1)], r'✗ D4 '),
  ('VS-NOI-BO-KHONG-CONG-DON', [(PS, 'tong + await daDungNoiBo(tx, nguoi, luc.slice(0, 10))', 'tong + 0', 1)], r'✗ D4 '),
  ('VS-NOI-BO-CONG-NGUOI-KHAC', [(PS, 'AND p.nguoi_tao = ? AND substr', 'AND ? IS NOT NULL AND substr', 1)], r'✗ D4 '),
  ('VS-NOI-BO-CONG-NGAY-CU', [(PS, 'substr(p.tao_luc, 1, 10) = ?', 'substr(p.tao_luc, 1, 10) <= ?', 1)], r'✗ D4b '),
  ('VS-TP-THIEU-LO-GHI-AM', [(PS, '      if (manh.some((x) => x.lo_id == null)) return khongDuTon();\n', '', 1),
    (PS, "if (m.lo_id == null && cot === 'san_pham_id') return khongDuTon();", 'if (false) return khongDuTon();', 1)], r'✗ D13 '),
  # ── E: bấm hai lần · giá · sửa ──
  ('BV-MA-GUI-MOI', [(D, 'TAO[loai](tx, { ...THAN[loai](req.body || {}), ...nguoiCua(req, luc) }), timMaGui));',
    'TAO[loai](tx, { ...THAN[loai](req.body || {}), ...nguoiCua(req, luc) })));', 1)], r'✗ E1 '),
  ('BV-BOGIA-TONG-UOC-TINH', [(T, "'gia_von', 'tong_uoc_tinh']", "'gia_von']", 1)], r'✗ E3 '),
  ('VS-SUA-KHONG-HUY-CU', [(D, '  const huy = await duLieu.huyPhieu(tx, id, lyDoCua(req), req.user.username, luc);\n  if (huy.loi) return huy;\n  return TAO',
    '  return TAO', 1)], r'✗ E4b '),
  ('BV-SUA-RE-LOAI-TRUOC', [(D, "if (!cu || cu.loai === 'PX') {", 'if (true) {', 1)], r'✗ E4 '),
  # ── soát lần 1: sửa giữ trường cũ · sửa chỉ phiếu đã duyệt · thân sửa hết hạn của màn hình · duyệt kiểm lại lô chọn sẵn ──
  ('BV-SUA-GIU-TRUONG-CU', [(D, "THAN[cu.loai]({ nha_cung_cap_id: cu.nha_cung_cap_id, ghi_chu: cu.ghi_chu, su_co: cu.su_co, ...req.body })", 'THAN[cu.loai](req.body)', 1)],
    r'✗ E4c '),
  ('BV-SUA-CHI-DA-DUYET', [(D, "if (cu.trang_thai === 'cho_duyet') return", 'if (false) return', 1)], r'✗ E4d '),
  ('VS-PS-LO-KEM-KHOA', [(PS, "nguyen_lieu_id: lo ? null : Number(m?.nguyen_lieu_id) || null, san_pham_id: lo ? null : Number(m?.san_pham_id) || null,",
    'nguyen_lieu_id: Number(m?.nguyen_lieu_id) || null, san_pham_id: Number(m?.san_pham_id) || null,', 1)], r'✗ E5e '),
  ('BV-DUYET-KIEM-LO', [(PS, ") < -${tinh.SAI_SO} LIMIT 1`, [id])) {", ") < -1e9 LIMIT 1`, [id])) {", 1)], r'✗ D14 '),
  # ── soát lần 2: lô thành phẩm đã bị phiếu khác trừ · sửa PN theo đơn giữ đơn · sửa nội bộ giữ món ──
  ('BV-LO-TP-DA-BI-TRU', [(L, '  if (await loThanhPhamDaBiTru(tx, id)) {', '  if (false) {', 1)], r'✗ E6 '),
  ('BV-SUA-GIU-DON', [(D, 'donId: cu.don_id == null ? null : Number(cu.don_id),', 'donId: null,', 1)], r'✗ E4e '),
  ('BV-NOI-BO-GIU-MON', [(PS, 'dong.push({ nguyen_lieu_id: m.nguyen_lieu_id, luong: m.luong, cho_mon_id: m.cho_mon_id });', 'dong.push({ nguyen_lieu_id: m.nguyen_lieu_id, luong: m.luong });', 1)],
    r'✗ E5f '),
  # ── vòng sửa 4 (soát lần 3): sửa phiếu đã huỷ cùng mã · cho_mon_id chỉ ở đường sửa ──
  ('VS-SUA-HUY-SAI-MA', [(D, "if (cu.trang_thai === 'cho_duyet') return", "if (cu.trang_thai !== 'da_duyet') return", 1)], r'✗ E7 '),
  ('BV-CHO-MON-CHI-KHI-SUA', [(PS, 'cho_mon_id: ep ? Number(m?.cho_mon_id) || null : null };', 'cho_mon_id: Number(m?.cho_mon_id) || null };', 1)], r'✗ E8 '),
  # ── bước 007 ──
  ('BV-007-DON-ID', [(B7, "  await themCot('kho_phieu', 'don_id INTEGER');\n", '', 1)], r'✗ N1 '),
]


def ban_sao(thay):
  """Chép server/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_kho2b_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
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


def chay_bai(tmp):
  return subprocess.run(['node', os.path.join(GOC, 'cong_cu', 'thu_KHO2b.js'), '--may-chu', os.path.join(tmp, 'server')],
                        cwd=GOC, capture_output=True, text=True, timeout=300)


def chay(ten, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    r = chay_bai(tmp)
    ra = (r.stdout or '') + (r.stderr or '')
    if '--in-ra' in sys.argv: print(f'── {ten}: 12 dòng cuối ──\n' + '\n'.join(ra.strip().splitlines()[-12:]))
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if r.returncode == 2 or 'Bài thử sập' in ra:
      return ten, 'LẠC', 'bài sập: ' + (hong[-1] if hong else ra.strip().splitlines()[-1][:160] if ra.strip() else '')
    if r.returncode == 0:
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
    r = chay_bai(tmp)
    ra = (r.stdout or '') + (r.stderr or '')
    m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
    return r.returncode == 0 and m is not None and m.group(2) == '0', (m.group(0) if m else ra[-200:])
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def chay_goc(sha):
  """Bằng chứng ĐỎ trên code chưa vá: bài thử HIỆN TẠI với server/ của commit `sha` (git archive, bản chép thật)."""
  import io, tarfile
  tmp = tempfile.mkdtemp(prefix='dotbien_kho2b_goc_')
  try:
    tar = subprocess.run(['git', 'archive', sha, 'server'], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
    r = chay_bai(tmp)
    ra = ((r.stdout or '') + (r.stderr or '')).strip()
    print('\n'.join(l for l in ra.splitlines() if '✗' in l or 'đạt ·' in l or 'sập' in l))
    print(f'GỐC {sha}: thoát {r.returncode}')
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  if '--goc' in sys.argv:
    chay_goc(sys.argv[sys.argv.index('--goc') + 1]); sys.exit(0)
  chon = [a for a in sys.argv[1:] if not a.startswith('--')]
  if '--liet-ke' in sys.argv:
    for t, _, _ in DOT_BIEN: print(t)
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
