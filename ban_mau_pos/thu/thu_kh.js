const fs=require('fs'); const _h=fs.readFileSync(require('path').join(__dirname,'..','ban_mau_pos.html'),'utf8'); const js=_h.split('<script>')[1].split('</script>')[0];
const nut={}; const el=id=>nut[id]||(nut[id]={innerHTML:'',textContent:'',style:{},className:''});
global.document={getElementById:el,addEventListener(){}};
global.setTimeout=()=>1; global.clearTimeout=()=>{}; global.setInterval=()=>0; global.clearInterval=()=>{};
eval(js+';global.VE=ve;global.A={S,them,xemTruoc,inVaGhi,chonKhach,KHACH,veKQ};');
const app=()=>nut['app'].innerHTML, may=()=>nut['mayin'].innerHTML;
const billQuay=()=>{const h=may(); const i=h.indexOf('Máy in bill · quầy'); return h.slice(i,h.indexOf('class="khay"',i+10));};
let d=0,x=0; const k=(t,c)=>{console.log(`  [${c?'ĐẠT':'HỎNG'}] ${t}`); c?d++:x++;};

console.log('\n── khách quen ──');
VE();
k('mặc định: ô tìm khách quen + dòng giải thích khách lẻ/mới', app().includes('Khách quen: tên hoặc SĐT') && app().includes('khách lẻ / khách mới'));
A.S.timKH='lan'; A.veKQ();
k('gõ "lan" → ra Chị Lan', nut['kq-kh'].innerHTML.includes('Chị Lan'));
A.S.timKH='0912'; A.veKQ();
k('gõ số điện thoại → ra đúng khách', nut['kq-kh'].innerHTML.includes('Chị Lan'));
A.S.timKH='xyz'; A.veKQ();
k('không thấy → nhắc "khách mới thì cứ bán"', nut['kq-kh'].innerHTML.includes('Khách mới thì cứ bán'));
A.chonKhach('0912345678'); A.them('DNL'); A.them('DNL'); A.them('CF01'); VE();   // 79.000đ → 7 điểm
k('chọn Chị Lan → hiện 45 điểm, đơn này +7', app().includes('45 điểm') && app().includes('+7'));
A.xemTruoc('transfer'); VE();
k('xem trước: bill có Khách · +7 · tổng 52, KHÔNG có mã', app().includes('+7') && app().includes('>52<') && !app().includes('MÃ NHẬN ĐIỂM'));
A.inVaGhi(); VE();
k('in → Chị Lan thật sự lên 52 điểm', A.KHACH[0].diem===52);
k('bill in ra có dòng điểm', billQuay().includes('Tổng điểm'));
k('in xong → bỏ chọn khách, đơn sau là khách lẻ', A.S.khach===null);

console.log('\n── khách lẻ / khách mới ──');
A.them('DNL'); A.xemTruoc('cash',50000); VE();
k('xem trước: có khối MÃ NHẬN ĐIỂM + QR, không có dòng điểm tài khoản', app().includes('MÃ NHẬN ĐIỂM') && app().includes('QR<br>nhận điểm') && !app().includes('Tổng điểm'));
k('ghi rõ được bao nhiêu điểm: 30.000đ → 3 điểm × 2 = 6', app().includes('<b>6 điểm</b>'));
A.inVaGhi(); VE();
const ma=A.S.don[0].ma;
k(`in → máy chủ cấp mã thật dạng XXXX-XXXX (${ma})`, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(ma));
k('bill in ra mang đúng mã đó', billQuay().includes(ma));
k('không ai bị cộng điểm', A.KHACH.map(k=>k.diem).join()==='52,12,130');

console.log('\n── đơn dưới 10.000đ ──');
A.S.gio=[{k:99,ma:'X',ten:'Nước lọc',gia:5000,sl:1,chon:[],rieng:''}];
A.xemTruoc('transfer'); A.inVaGhi(); VE();
k('đơn 5.000đ không đủ 1 điểm → KHÔNG in mã (tránh mã rỗng)', !A.S.don[0].ma && !billQuay().includes('MÃ NHẬN ĐIỂM'));

console.log('\n── mang ra bàn cũng vậy ──');
A.chonKhach('0987654321'); A.them('CF01'); A.xemTruoc('cho'); A.inVaGhi(); VE();
k('khách quen + mang ra bàn → vẫn cộng điểm ngay', A.KHACH[1].diem===13);
console.log(`\n  → ${d} đạt · ${x} hỏng\n`);
