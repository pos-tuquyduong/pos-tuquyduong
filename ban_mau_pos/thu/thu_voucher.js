// VOUCHER-2 (chủ quán Q14 12.11): ô mã khuyến mãi + chip voucher của khách ở màn Bán hàng, dòng giảm trên giỏ và bill khách; tem / phiếu pha chế KHÔNG đổi.
const fs=require('fs'); const _h=fs.readFileSync(require('path').join(__dirname,'..','ban_mau_pos.html'),'utf8'); const js=_h.split('<script>')[1].split('</script>')[0];
const nut={}; const el=id=>nut[id]||(nut[id]={innerHTML:'',textContent:'',style:{},className:''});
global.document={getElementById:el,addEventListener(){}};
global.setTimeout=()=>1; global.clearTimeout=()=>{}; global.setInterval=()=>0; global.clearInterval=()=>{};
eval(js+';global.VE=ve;global.A={S,them,doi,xemTruoc,inVaGhi,chonKhach,latVoucher,billGiay,temCua,temGiay,KHACH,VOUCHER_TOI_DA};');
const app=()=>nut['app'].innerHTML;
const chip=(ma)=>{ const v=A.KHACH[0].vc.find(x=>x.ma===ma); const h=app(); const i=h.indexOf('🎟 '+v.moTa); return i<0?'':h.slice(h.lastIndexOf('<button',i),h.indexOf('</button>',i)); };
const tongCong=()=>{ const h=app(); const i=h.indexOf('class="tongcong"'); return i<0?'':h.slice(i,h.indexOf('</div>',i)); };
let d=0,x=0; const k=(t,c)=>{console.log(`  [${c?'ĐẠT':'HỎNG'}] ${t}`); c?d++:x++;};
const moi=()=>{ A.S.gio=[]; A.S.khach=null; A.S.vc=[]; A.S.vcLoi={}; A.S.maKM=''; A.S.maGo=''; A.S.buoc='chon'; };

console.log('\n── ô mã + chip voucher ──');
moi(); A.them('DNL'); VE();
k('giỏ có món: có ô "Mã khuyến mãi"; khách lẻ → KHÔNG có chip voucher', app().includes('Mã khuyến mãi') && !app().includes('class="chips"'));
A.chonKhach('0987654321'); VE();
k('khách không có voucher (Anh Minh) → không có chip', !app().includes('class="chips"'));
A.chonKhach('0912345678'); VE();
const h=app();
k('Chị Lan có voucher → hàng chip "🎟 <câu máy chủ>" NGAY DƯỚI ô mã, trước dòng tổng', h.includes('🎟 Giảm 10.000đ · HSD 30/11/2026')
  && h.indexOf('id="o-ma"')<h.indexOf('class="chips"') && h.indexOf('class="chips"')<h.indexOf('class="tongcong"'));
k('đếm "0/3 voucher" (N = 3 mặc định)', h.includes('0/3 voucher') && A.VOUCHER_TOI_DA===3);

console.log('\n── chọn / bỏ, thứ tự tính, tối đa N ──');
moi(); A.chonKhach('0912345678'); A.them('DNL'); A.them('DNL'); A.them('CF01'); VE();   // 79.000
A.S.maGo='km10k'; A.S.maKM='KM10K'; VE();
A.latVoucher('VT7K2M'); A.latVoucher('VP3X9A'); VE();
// 79.000 − mã 10.000 = 69.000 − voucher tiền 10.000 = 59.000 − 10 % (5.900) = 53.100 (tính tay)
k('mã chung → voucher tiền → voucher % trên phần còn lại: 79.000 → 53.100', tongCong().includes('53.100đ'));
k('giỏ có dòng "Ưu đãi KM10K −10.000đ", "Voucher VT7K2M −10.000đ", "Voucher VP3X9A −5.900đ" (đúng thứ tự)', (()=>{ const a=app();
  const i1=a.indexOf('Ưu đãi KM10K'), i2=a.indexOf('Voucher VT7K2M'), i3=a.indexOf('Voucher VP3X9A');
  return i1>0&&i2>i1&&i3>i2&&a.includes('−10.000đ')&&a.includes('−5.900đ'); })());
k('chip đã chọn sáng (class on), đếm 2/3', chip('VT7K2M').includes('chip on') && app().includes('2/3 voucher'));
A.latVoucher('VT7K2M'); VE();
k('bấm lại → bỏ chọn, tiền về 79.000 − 10.000 − 6.900 = 62.100', !A.S.vc.includes('VT7K2M') && tongCong().includes('62.100đ'));
A.latVoucher('VP8H2C'); VE();
k('voucher % thứ hai → không chọn, chip viền đỏ + "Mỗi đơn chỉ dùng một voucher giảm %"', !A.S.vc.includes('VP8H2C')
  && chip('VP8H2C').includes('loi') && chip('VP8H2C').includes('Mỗi đơn chỉ dùng một voucher giảm %'));
A.latVoucher('VS5T7B'); VE();
k('voucher ship ở quầy (không giao) → viền đỏ + "Voucher giao hàng chỉ dùng cho đơn giao", không tính', !A.S.vc.includes('VS5T7B')
  && chip('VS5T7B').includes('Voucher giao hàng chỉ dùng cho đơn giao') && tongCong().includes('62.100đ'));
A.latVoucher('VM4D6E'); VE();
k('chưa đủ đơn tối thiểu → viền đỏ + lý do "Đơn chưa đủ tối thiểu 200.000đ"', !A.S.vc.includes('VM4D6E') && chip('VM4D6E').includes('Đơn chưa đủ tối thiểu 200.000đ'));
A.latVoucher('VT7K2M'); A.latVoucher('VT9Q4N'); VE();
k('đủ 3 voucher → chip còn lại MỜ (disabled), đếm 3/3', A.S.vc.length===3 && chip('VS5T7B').includes('disabled') && app().includes('3/3 voucher')
  && !chip('VT7K2M').includes('disabled'));
A.S.vcLoi={}; A.latVoucher('VM4D6E'); VE();
k('đủ N rồi bấm chip khác → không thêm (vẫn 3)', A.S.vc.length===3 && !A.S.vc.includes('VM4D6E'));

console.log('\n── giỏ đổi làm voucher hết hợp lệ · tổng giảm ≤ tiền món ──');
moi(); A.chonKhach('0912345678'); A.them('CF01'); VE();                // 19.000
A.S.maKM='KM10K'; A.latVoucher('VT7K2M'); A.latVoucher('VT9Q4N'); VE();
k('19.000 − mã 10.000 − voucher 10.000 − voucher 5.000 → giảm không quá tiền món: phải trả 0đ', tongCong().includes('>0đ<'));
moi(); A.chonKhach('0912345678'); for(let i=0;i<7;i++) A.them('DNL'); VE();   // 210.000 ≥ 200.000
A.latVoucher('VM4D6E'); VE();
k('đủ 210.000 → voucher tối thiểu 200.000 chọn được', A.S.vc.includes('VM4D6E'));
A.doi(A.S.gio[0].k,-1); VE();                                        // còn 180.000
k('bớt món còn 180.000 → máy chủ báo, tự bỏ chọn + viền đỏ kèm lý do', !A.S.vc.includes('VM4D6E') && chip('VM4D6E').includes('Đơn chưa đủ tối thiểu'));
A.S.maGo='LAMA'; A.S.maKM='LAMA'; VE();
k('mã chung không có → "Mã không áp: …", tiền không giảm', app().includes('Mã không áp') && tongCong().includes('180.000đ'));

console.log('\n── bill khách có dòng giảm; tem + phiếu pha chế KHÔNG đổi ──');
moi(); A.chonKhach('0912345678'); A.them('DNL'); A.them('CF01'); A.S.maKM='KM10K'; A.latVoucher('VT9Q4N'); VE();   // 49.000 − 10.000 − 5.000 = 34.000
A.xemTruoc('transfer'); VE();
k('xem trước: bill có "Ưu đãi KM10K" rồi "Voucher VT9Q4N −5.000đ" dưới, TỔNG 34.000đ', (()=>{ const a=app(); const i1=a.indexOf('Ưu đãi KM10K'), i2=a.indexOf('Voucher VT9Q4N');
  return i1>0 && i2>i1 && a.includes('−5.000đ') && a.includes('<span>TỔNG</span><span>34.000đ</span>'); })());
A.inVaGhi(); VE();
const don=A.S.don[0];
k('in → đơn ghi tổng 34.000 + đủ dòng giảm; điểm tính trên tiền khách trả (+3)', don.tong===34000 && don.giam.length===2 && don.khach.cong===3);
k('in xong → bỏ chọn voucher + mã cho đơn sau', A.S.vc.length===0 && A.S.maKM==='' && A.S.maGo==='');
const pc=A.billGiay(don,'pc',1), tem=A.temCua(don).map(A.temGiay).join('');
k('phiếu pha chế + tem cốc KHÔNG có dòng voucher / ưu đãi', !/Voucher|Ưu đãi|Giảm/.test(pc) && !/Voucher|Ưu đãi|Giảm/.test(tem));
const ship=A.billGiay({...don,phiGiao:30000,giamShip:15000,giam:[],tong:64000},'khach',1);
k('đơn giao có voucher ship: bill có "Phí giao 30.000đ" + "Giảm phí giao −15.000đ"', ship.includes('<span>Phí giao</span><span>30.000đ</span>')
  && ship.includes('<span>Giảm phí giao</span><span>−15.000đ</span>'));
k('đơn không giao: bill KHÔNG có dòng phí giao', !A.billGiay(don,'khach',1).includes('Phí giao'));
moi(); A.chonKhach('0912345678'); A.them('DNL'); A.latVoucher('VT7K2M'); VE();
A.S.khach=null; A.S.vc=[]; VE();
A.chonKhach('0912345678'); VE();
k('đổi / bỏ khách → voucher đã chọn bị bỏ (voucher gắn khách)', A.S.vc.length===0);
console.log(`\n  → ${d} đạt · ${x} hỏng\n`);
