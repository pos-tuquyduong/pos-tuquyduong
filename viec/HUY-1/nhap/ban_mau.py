import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()

def thay(cu, moi):
    global s
    assert s.count(cu) == 1, (cu[:70], s.count(cu))
    s = s.replace(cu, moi)

# 1. trạng thái
thay("const S={man:'ban',khach:null,timKH:'',quet:null,amThanh:true,loc:'tatca',chon:null,doi:null,lyDoi:null,huy:null,lyDo:null,",
     "const S={man:'ban',khach:null,timKH:'',quet:null,amThanh:true,loc:'tatca',chon:null,doi:null,lyDoi:null,huy:null,lyDo:null,huyDon:null,lyDoHuy:null,ghiThemHuy:'',")

# 2. hàm huỷ đơn đã thu (HUY-1) — đặt ngay sau daGiao
thay("function thongBao(chu){",
"""// HUY-1 (chủ quán 05.11): huỷ ĐƠN ĐÃ THU — ở chi tiết Lịch sử đơn và thẻ đơn App. Huỷ CẢ đơn; lý do bắt buộc ("Khác" phải ghi thêm);
// hoàn TOÀN BỘ đã trả vào tài khoản khách (khách lẻ: trả tiền mặt từ két). KHÔNG hoàn tác 5 giây — tiền đã vào tài khoản khách.
const LY_DO_HUY=[['pha_nham','Pha nhầm món'],['bam_nham','Bấm nhầm'],['het_nguyen_lieu','Hết nguyên liệu'],['khach_doi_y','Khách đổi ý'],['khac','Khác']];
const huyDuoc=()=>!!S.lyDoHuy&&(S.lyDoHuy!=='khac'||!!S.ghiThemHuy.trim());
const hoanCua=d=>d.khach?`hoàn ${t(d.tong)} vào tài khoản ${d.khach.ten}`:`trả khách ${t(d.tong)} tiền mặt từ két`;
function moHuyDon(so){ S.huyDon=so; S.lyDoHuy=null; S.ghiThemHuy=''; ve(); }
function khungHuyDon(d){
  return `<div style="background:#fef2f2;border-radius:10px;padding:10px;margin-top:8px">
    <div style="font-size:.8rem;font-weight:800;color:#991b1b;margin-bottom:6px">Huỷ đơn ${so3(d.so)} — lý do (bắt buộc)</div>
    <div style="display:flex;gap:5px;flex-wrap:wrap">${LY_DO_HUY.map(([ma,nhan])=>`<button class="nv" style="${S.lyDoHuy===ma?'background:#fee2e2;border-color:#dc2626':''}" onclick="S.lyDoHuy='${ma}';ve()">${nhan}</button>`).join('')}</div>
    <input id="ghi-them-huy" placeholder="${S.lyDoHuy==='khac'?'Ghi rõ lý do (bắt buộc)':'Ghi thêm (không bắt buộc)'}" value="${S.ghiThemHuy}" style="width:100%;margin-top:7px;padding:7px;border:1px solid #fecaca;border-radius:8px;box-sizing:border-box"
      oninput="S.ghiThemHuy=this.value;document.getElementById('nut-huy-don').disabled=!huyDuoc()">
    <div style="font-size:.76rem;color:#7f1d1d;margin:7px 0">Huỷ cả đơn: ${hoanCua(d)}; trả hàng về kho. Không hoàn tác được.</div>
    <div style="display:flex;gap:6px"><button class="nut xam" style="flex:1" onclick="S.huyDon=null;ve()">Không huỷ</button>
      <button id="nut-huy-don" class="nut" style="flex:1.4;background:#dc2626" ${huyDuoc()?'':'disabled'} onclick="xacNhanHuyDon()">Huỷ đơn</button></div></div>`;
}
function xacNhanHuyDon(){ const d=S.don.find(x=>x.so===S.huyDon); if(!d||d.tt!=='da'||!huyDuoc()) return;
  const nhan=LY_DO_HUY.find(x=>x[0]===S.lyDoHuy)[1], them=S.ghiThemHuy.trim();
  const ly=S.lyDoHuy==='khac'?them:them?`${nhan} · ${them}`:nhan, hoan=hoanCua(d);
  d.tt='huy'; d.lyDo=ly; d.giao=true; ghi(d,'h',`Huỷ đơn · ${ly} · ${hoan} · trả hàng về kho`);
  S.huyDon=null; S.lyDoHuy=null; S.ghiThemHuy=''; if(S.ve===d.so) S.ve='moi';
  thongBao(`${so3(d.so)} đã huỷ — ${hoan}`); }
function thongBao(chu){""")

# 3. thẻ đơn App: nút Huỷ đơn + khung
thay("""      <button class="nutto" style="background:#475569" onclick="moInLai(${d.so})">🖨 In lại…<small>chọn tờ cần in</small></button>
    </div>`;
}""",
"""      <button class="nutto" style="background:#475569" onclick="moInLai(${d.so})">🖨 In lại…<small>chọn tờ cần in</small></button>
    </div>
    ${S.huyDon===d.so?khungHuyDon(d):`<button class="nv" style="width:100%;margin-top:8px;color:#b91c1c" onclick="moHuyDon(${d.so})">✕ Huỷ đơn</button>`}`;
}""")

# 4. Lịch sử đơn: khung huỷ + nút
thay("  if(S.inLai===d.so) chan=khungInLai(d);\n",
     "  if(S.inLai===d.so) chan=khungInLai(d);\n  else if(S.huyDon===d.so) chan=khungHuyDon(d);\n")
thay("""      ${d.tt==='da'?`<button class="nut xam">↩ Hoàn tiền <small style="font-weight:400">(đã có trong POS)</small></button>`:''}</div>`;""",
     """      ${d.tt==='da'?`<button class="nut xam">↩ Hoàn tiền <small style="font-weight:400">(đã có trong POS)</small></button>`:''}
      ${d.tt==='da'?`<button class="nut" style="background:#fef2f2;color:#b91c1c" onclick="moHuyDon(${d.so})">✕ Huỷ đơn</button>`:''}</div>`;""")
open(p, 'w', encoding='utf-8').write(s)
print('xong')
