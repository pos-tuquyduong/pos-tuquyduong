#!/usr/bin/env python3
"""BAO-1b — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/BAO-1b/dot_bien.py [tên...]            (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/BAO-1b/dot_bien.py --liet-ke            (chỉ in danh sách)
    python3 viec/BAO-1b/dot_bien.py --goc <sha> <bài...>  (bằng chứng ĐỎ: bài HIỆN TẠI trên client/src/ của commit sha)

Khuôn viec/BAO-1a/dot_bien.py: chép client/src/ + cong_cu/ ra thư mục tạm (BẢN CHÉP THẬT), thay chuỗi (mỗi chuỗi khớp ĐÚNG số lần
ghi sẵn — không khớp là HỎNG, K3), chạy `node <tạm>/cong_cu/thu_BAO1b.js`. BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt.
Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
"""
import io, os, re, shutil, subprocess, sys, tarfile, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
C = 'client/src/components/'
CD = 'client/src/pages/CaiDat/'
KC = C + 'kiemCaiDat.js'
KHO, TL, HP, LP, LO, UTD, CSS = C + 'thayDoiKho.js', C + 'ThanhLuu.jsx', C + 'HoiPin.jsx', C + 'loiPin.js', C + 'LoiO.jsx', C + 'useThayDoi.js', 'client/src/index.css'
ST, CH = 'client/src/pages/Settings.jsx', C + 'CaiDatChuong.jsx'
CHEP = ['client/src', 'cong_cu', 'kiem_tra_truoc_khi_giao.js']
T = 'thu_BAO1b.js'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗, bài)
DOT_BIEN = [
  # ── C: sổ thay đổi + thanh lưu ──
  ('BV-THAYDOI-KHONG-GO', [(KHO, 'if (coDoi) dangDoi.add(id); else dangDoi.delete(id);', 'if (coDoi) dangDoi.add(id);', 1)], r'✗ C1[bcd]', T),
  ('VS-THAYDOI-GO-HET', [(KHO, 'else dangDoi.delete(id);', 'else dangDoi.clear();', 1)], r'✗ C1c', T),
  ('BV-THANHLUU-KHONG-DANG-KY', [(TL, '    datChuaLuu(id, coDoi);\n    return () => datChuaLuu(id, false);', '    return undefined;', 1)], r'✗ C2c', T),
  ('VS-THANHLUU-KHONG-GO-KHI-DONG', [(TL, 'return () => datChuaLuu(id, false);', 'return undefined;', 1)], r'✗ C2c', T),
  ('VS-THANHLUU-LUON-HIEN', [(TL, 'if (!coDoi) return null;', 'if (false) return null;', 1)], r'✗ C2b', T),
  ('BV-THANHLUU-MO-NUT', [(TL, ' disabled={dangLuu} onClick={onBo}', ' onClick={onBo}', 1), (TL, ' disabled={dangLuu} onClick={onLuu}', ' onClick={onLuu}', 1)], r'✗ C2d', T),
  ('BV-THANHLUU-NUT-BO-GOI-LUU', [(TL, 'onClick={onBo}', 'onClick={onLuu}', 1)], r'✗ C2a', T),
  ('BV-USETHAYDOI-CHUA-CHUP', [(UTD, 'goc !== null && JSON.stringify(giaTri) !== goc', 'JSON.stringify(giaTri) !== goc', 1)], r'✗ C4a', T),
  ('VS-USETHAYDOI-SO-SAI', [(UTD, 'JSON.stringify(giaTri) !== goc', 'JSON.stringify(giaTri) === goc', 1)], r'✗ C4a', T),
  ('BV-GIOHD-BO-THANHLUU', [(CD + 'GioHoatDong.jsx', '<ThanhLuu id="gio-hoat-dong"', '<Khong id="gio-hoat-dong"', 1)], r'✗ C4 CaiDat/GioHoatDong', T),
  ('BV-MANKHACH-BO-THAYDOI', [(CD + 'ManKhach.jsx', 'useThayDoi({ trang, diaChi, hienTen })', 'useState(null)', 1)], r'✗ C4 CaiDat/ManKhach', T),
  ('BV-SETTINGS-DOITHE-KHONG-HOI', [(ST, "tab !== 'products' && coChuaLuu() &&", "tab !== 'products' &&", 1)], r'✗ C5', T),
  ('BV-CSS-THANHLUU-KHONG-CODINH', [(CSS, '.thanh-luu { position: fixed;', '.thanh-luu { position: static;', 1)], r'✗ C3', T),
  # ── D: PIN ──
  ('VS-LOIPIN-CHI-SAI', [(LP, '/^(PIN_CHU_QUAN_|CHUA_CO_PIN_)/', '/^PIN_CHU_QUAN_SAI$/', 1)], r'✗ D1a', T),
  ('VS-LOIPIN-NOI-LONG', [(LP, '/^(PIN_CHU_QUAN_|CHUA_CO_PIN_)/', '/PIN|MAT_KHAU|CHUA_CO/', 1)], r'✗ D1b', T),
  ('VS-LOIPIN-KHONG-NEO-DAU', [(LP, '/^(PIN_CHU_QUAN_|CHUA_CO_PIN_)/', '/(PIN_CHU_QUAN_|CHUA_CO_PIN_)/', 1)], r'✗ D1b', T),
  ('BV-HOIPIN-DONG-KHI-PIN-SAI', [(HP, 'if (laLoiPin(e)) { setLoi(', 'if (laLoiPin(e)) { dong(); setLoi(', 1)], r'✗ D2c', T),
  ('VS-HOIPIN-LOI-KHAC-O-LAI', [(HP, '} else { dong(); loiKhac(e); }', '} else { loiKhac(e); }', 1)], r'✗ D2c', T),
  ('BV-HOIPIN-BO-LOI-O', [(HP, '<LoiO loi={loi} />', '', 1)], r'✗ D2b', T),
  ('BV-HOIPIN-BO-THONGBAO', [(HP, "baoLoi(`Chưa ${ten || 'lưu'} được`, lyDoLoi(e));", '', 1)], r'✗ D2b', T),
  ('BV-HOIPIN-NUT-KHONG-KHOA', [(HP, 'disabled={dang} onClick={dong}', 'onClick={dong}', 1), (HP, 'disabled={dang}>{dang ?', '>{dang ?', 1)], r'✗ D2a', T),
  ('BV-HOIPIN-GIU-PIN-CU', [(HP, "if (mo) { setPin(''); setLoi(''); }", "if (mo) { setLoi(''); }", 1)], r'✗ D2d', T),
  ('VS-HANG-LUU-MO-VI-PIN', [(CD + 'HangThe.jsx', 'onClick={batLuu} disabled={dangLuu}', 'onClick={batLuu} disabled={dangLuu || !coPin}', 1)], r'✗ D3b', T),
  ('BV-HANG-BO-HOIPIN', [(CD + 'HangThe.jsx', '<HoiPin mo=', '<Khong mo=', 1)], r'✗ D3a', T),
  ('BV-HANG-PIN-LUON-O-CANH-NUT', [(CD + 'HangThe.jsx', '<button className="btn btn-outline" onClick={them}>', '<input aria-label="PIN chủ quán để lưu / xoá hạng" /><button className="btn btn-outline" onClick={them}>', 1)], r'✗ D3a', T),
  ('BV-HANG-PIN-KHONG-LOI-DUOI-O', [(CD + 'HangThe.jsx', '<LoiO loi={loiPin} />', '', 1)], r'✗ D3f', T),
  ('BV-GOINAP-PIN-DAU-THE', [(CD + 'GoiNap.jsx', '<LoiO loi={taiLoi &&', '<input aria-label="PIN chủ quán để thêm / sửa" /><LoiO loi={taiLoi &&', 1)], r'✗ D3d', T),
  ('VS-GIOHD-HOI-PIN', [(CD + 'GioHoatDong.jsx', "import LoiO from '../../components/LoiO';", "import LoiO from '../../components/LoiO';\nimport HoiPin from '../../components/HoiPin';", 1)], r'✗ D3g', T),
  # ── A / B: thông báo chung + lỗi dưới ô ──
  ('BV-SETTINGS-MESSAGE-TRO-LAI', [(ST, "import { coChuaLuu } from '../components/thayDoiKho.js';", "import { coChuaLuu } from '../components/thayDoiKho.js';\nconst setMessage = () => {};", 1)], r'✗ A1 Settings', T),
  ('BV-SETTINGS-ALERT-TRO-LAI', [(ST, "if (!file.name.endsWith('.xlsx')) {", "if (!file.name.endsWith('.xlsx')) { alert('x');", 1)], r'✗ A1c', T),
  ('BV-HANG-THONGDIEP-TRO-LAI', [(CD + 'HangThe.jsx', 'const [dangPin, setDangPin] = useState(false);', "const [dangPin, setDangPin] = useState(false);\n  const [thongDiep] = useState('');", 1)], r'✗ A3 CaiDat/HangThe', T),
  ('BV-TICHDIEM-BO-NOI-THONGBAO', [(CD + 'TichDiem.jsx', "import { baoXong, baoLoiTu, lyDoLoi } from '../../components/thongBaoKho.js';", "import { lyDoLoi } from '../../components/thongBaoKho.js';", 1)], r'✗ A4 CaiDat/TichDiem', T),
  ('BV-CHUONG-THONGDIEP-TRO-LAI', [(CH, "const [loi, setLoi] = useState('');", "const [loi, setLoi] = useState('');\n  const [thongDiep] = useState('');", 1)], r'✗ A2', T),
  ('BV-GOINAP-BO-LOI-O-TEN', [(CD + 'GoiNap.jsx', '<LoiO loi={loiO.ten} />', '', 1)], r'✗ B3 CaiDat/GoiNap', T),
  ('BV-GIAOHANG-BO-LOI-O', [(CD + 'GiaoHang.jsx', '<LoiO loi={loiO[k]} />', '', 1)], r'✗ B3 CaiDat/GiaoHang', T),
  ('BV-LOIO-LUON-TRA', [(LO, 'if (!loi) return null;', '', 1)], r'✗ B1', T),
  ('BV-CSS-LOIO-KHONG-DO', [(CSS, 'line-height: 1.4; color: #b91c1c; }', 'line-height: 1.4; color: #16a34a; }', 1)], r'✗ B2', T),
  # ── B4: phép kiểm ô ──
  ('BV-KIEM-HANG-KHONG-KIEM', [(KC, 'export function kiemHang(ds) {\n  const l = {};', 'export function kiemHang(ds) {\n  const l = {};\n  return l;', 1)], r'✗ B4[a-f]', T),
  ('VS-KIEM-PT-NOI-900', [(KC, 'PT_TOI_DA = 90,', 'PT_TOI_DA = 900,', 1)], r'✗ B4[bc]', T),
  ('VS-KIEM-PT-CHAN-89', [(KC, 'PT_TOI_DA = 90,', 'PT_TOI_DA = 89,', 1)], r'✗ B4[bc]', T),
  ('VS-KIEM-THANG-NOI-61', [(KC, 'THANG_TOI_DA = 60,', 'THANG_TOI_DA = 61,', 1)], r'✗ B4e', T),
  ('VS-KIEM-THANG-CHAN-2', [(KC, 'THANG_TOI_THIEU = 1,', 'THANG_TOI_THIEU = 2,', 1)], r'✗ B4e', T),
  ('BV-KIEM-GOI-TRUNG-THANG', [(KC, "else if (new Set(h.goi.map((g) => Number(g.so_thang))).size < h.goi.length)", 'else if (false)', 1)], r'✗ B4f', T),
  ('VS-KIEM-GIAY-NOI-121', [(KC, 'GIAY_TOI_DA = 120,', 'GIAY_TOI_DA = 121,', 1)], r'✗ B4g', T),
  ('VS-KIEM-GIAY-CHAN-4', [(KC, 'GIAY_TOI_THIEU = 3,', 'GIAY_TOI_THIEU = 4,', 1)], r'✗ B4g', T),
  ('VS-KIEM-NGUNG-NOI-601', [(KC, 'NGUNG_TOI_DA = 600;', 'NGUNG_TOI_DA = 601;', 1)], r'✗ B4h', T),
  ('VS-KIEM-SO-LE-QUA', [(KC, 'Number.isInteger(Number(v)) && Number(v) >= a', 'Number(v) >= a', 1)], r'✗ B4[eg]', T),
  ('BV-HANG-TU-VIET-LAI-NGUONG', [(CD + 'HangThe.jsx', 'const l = kiemHang(ds);', 'const l = kiemHang(ds); if (ds.some((h) => h.discount_percent <= 90)) { /* <= 90 */ }', 1)], r'✗ B5', T),
  ('BV-MANKHACH-LUU-KHONG-CHAN-TAILOI', [(CD + 'ManKhach.jsx', '    if (taiLoi) return;   // cùng chốt', '    // cùng chốt', 1)], r'✗ K4a', T),
  ('VS-HOIPIN-GIU-PIN-SAU-KHI-XONG', [(HP, "await chay(pin); setPin(''); dong();", 'await chay(pin); dong();', 1)], r'✗ D4', T),
  ('BV-HOIPIN-TIEU-DE-CUNG', [(HP, "baoLoi(`Chưa ${ten || 'lưu'} được`", "baoLoi('Chưa lưu được'", 1)], r'✗ D4', T),
  ('BV-GOINAP-SO-LE-QUA', [(CD + 'GoiNap.jsx', 'Number.isInteger(so(form.khach_tra)) && ', '', 1)], r'✗ B6', T),
  ('BV-THANHLUU-CHE-NUT', [(CSS, '.thanh-luu-cho { height: 72px; }', '.thanh-luu-cho { }', 1)], r'✗ C6', T),
  # ── E: lưu xong nạp lại + nút khoá ──
  ('BV-HANG-BO-TAI-LAI', [(CD + 'HangThe.jsx', '      await tai();\n    } finally { setDangLuu(false); }', '    } finally { setDangLuu(false); }', 1)], r'✗ E1 CaiDat/HangThe', T),
  ('BV-GIOHD-BO-TAI-LAI', [(CD + 'GioHoatDong.jsx', '      await tai();\n    } catch (err) { setLoiO({ luu:', '    } catch (err) { setLoiO({ luu:', 1)], r'✗ E1 CaiDat/GioHoatDong', T),
  ('BV-MANKHACH-BO-TAI-LAI', [(CD + 'ManKhach.jsx', '      await tai();\n    } catch (e) { setLoiO({ luu:', '    } catch (e) { setLoiO({ luu:', 1)], r'✗ E1 CaiDat/ManKhach', T),
  ('BV-GIAOHANG-BO-TAI-LAI', [(CD + 'GiaoHang.jsx', "baoXong('Đã lưu cài đặt giao hàng'); await tai();", "baoXong('Đã lưu cài đặt giao hàng');", 1)], r'✗ E1 CaiDat/GiaoHang', T),
  ('BV-INPHIEU-BO-TAI-LAI', [(CD + 'InPhieu.jsx', "      await tai();\n    } catch (e) { setLoi(lyDoLoi(e)); baoLoiTu('lưu cài đặt in phiếu', e); }", "    } catch (e) { setLoi(lyDoLoi(e)); baoLoiTu('lưu cài đặt in phiếu', e); }", 1)], r'✗ E1b', T),
  ('BV-GIAOHANG-NUT-LUU-KHONG-KHOA', [(CD + 'GiaoHang.jsx', 'onClick={luu} disabled={dangLuu}>', 'onClick={luu}>', 1)], r'✗ E4', T),
  ('BV-INPHIEU-CHU-DANG-LUU', [(CD + 'InPhieu.jsx', "{dangLuu ? 'Đang lưu…' : 'Lưu'}", "{'Lưu'}", 1)], r'✗ E3 CaiDat/InPhieu', T),
  ('BV-TICHDIEM-MO-CONG-TAC', [(CD + 'TichDiem.jsx', 'disabled={!duocSua || dangLuu}', 'disabled={!duocSua}', 1)], r'✗ E2 CaiDat/TichDiem', T),
]


def lam_cay(tmp):
  nm = os.path.join(GOC, 'node_modules')
  if os.path.isdir(nm):
    os.symlink(nm, os.path.join(tmp, 'node_modules'))


def chep(nguon_sha, tmp, phan):
  """Đổ `phan` vào tmp: nguon_sha None = cây làm việc hiện tại (copytree), có sha = git archive commit đó."""
  if nguon_sha is None:
    for p in phan:
      a, b = os.path.join(GOC, p), os.path.join(tmp, p)
      os.makedirs(os.path.dirname(b), exist_ok=True)
      (shutil.copytree(a, b, ignore=shutil.ignore_patterns('node_modules')) if os.path.isdir(a) else shutil.copyfile(a, b))
  else:
    tar = subprocess.run(['git', 'archive', nguon_sha, *phan], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')


def ban_sao(thay):
  tmp = tempfile.mkdtemp(prefix='dotbien_bao1b_')
  chep(None, tmp, CHEP)
  lam_cay(tmp)
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
  r = subprocess.run(['node', os.path.join(tmp, 'cong_cu', bai)], cwd=tmp, capture_output=True, text=True, timeout=300)
  return r.returncode, (r.stdout or '') + (r.stderr or '')


def chay(ten, thay, mau, bai):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    ma, ra = chay_bai(tmp, bai)
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if ma == 2 or 'BÀI SẬP' in ra or 'Bài thử sập' in ra:
      return ten, 'LẠC', 'bài sập: ' + (hong[-1] if hong else ra.strip().splitlines()[-1][:160] if ra.strip() else '')
    if ma == 0:
      return ten, 'SỐNG', 'bài xanh trọn'
    khop = [l for l in hong if re.search(mau, l)]
    return (ten, 'BẮT', khop[0][:140]) if khop else (ten, 'LẠC', f'đỏ nhưng không khớp {mau}: ' + ' | '.join(h[:60] for h in hong[:3]))
  except subprocess.TimeoutExpired:
    return ten, 'LẠC', 'quá hạn 300 s'
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def doi_chung(bai_ds):
  tmp, _ = ban_sao([])
  try:
    kq = []
    for bai in bai_ds:
      ma, ra = chay_bai(tmp, bai)
      dong = [l.strip() for l in ra.splitlines() if re.search(r'\d+ đạt · \d+ hỏng', l)]
      kq.append((bai, ma, dong[-1] if dong else ra.strip()[-160:]))
    return all(m == 0 for _, m, _ in kq), kq
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def bang_chung(sha, bai_ds):
  """Bài HIỆN TẠI (cong_cu/ của cây làm việc) trên client/src/ của commit sha."""
  tmp = tempfile.mkdtemp(prefix='dotbien_bao1b_goc_')
  try:
    chep(sha, tmp, ['client/src'])
    chep(None, tmp, ['cong_cu'])
    lam_cay(tmp)
    for bai in bai_ds:
      ma, ra = chay_bai(tmp, bai)
      print(f'── {bai} (bài HIỆN TẠI trên code {sha}):')
      print('\n'.join('  ' + l.strip() for l in ra.splitlines() if '✗' in l or re.search(r'\d+ đạt · \d+ hỏng', l) or 'SẬP' in l))
      print(f'  thoát {ma}')
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  if '--goc' in sys.argv:
    i = sys.argv.index('--goc')
    bang_chung(sys.argv[i + 1], sys.argv[i + 2:]); sys.exit(0)
  if '--liet-ke' in sys.argv:
    for t, *_ in DOT_BIEN: print(t)
    sys.exit(0)
  chon = [a for a in sys.argv[1:] if not a.startswith('--')]
  ds = [d for d in DOT_BIEN if not chon or d[0] in chon]
  if chon and len(ds) != len(chon):
    sys.exit('tên không có trong danh sách: ' + ', '.join(set(chon) - {d[0] for d in ds}))
  ok, kq_dc = doi_chung(sorted({d[3] for d in ds}))
  for bai, ma, dong in kq_dc: print(f'ĐỐI CHỨNG {bai}: thoát {ma} · {dong}')
  if not ok:
    sys.exit('đối chứng đỏ — không chạy đột biến (K3)')
  with ThreadPoolExecutor(max_workers=4) as ex:
    kq = list(ex.map(lambda d: chay(*d), ds))
  for ten, tt, ghi in kq: print(f'{tt:5} {ten} — {ghi}')
  dem = {t: sum(1 for _, x, _ in kq if x == t) for t in ('BẮT', 'SỐNG', 'HỎNG', 'LẠC')}
  print(f'TỔNG {len(kq)} đột biến · BẮT {dem["BẮT"]} · SỐNG {dem["SỐNG"]} · HỎNG {dem["HỎNG"]} · LẠC {dem["LẠC"]}')
  sys.exit(0 if dem['BẮT'] == len(kq) else 1)
