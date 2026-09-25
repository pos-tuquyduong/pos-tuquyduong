const fs=require('fs'); const _h=fs.readFileSync(require('path').join(__dirname,'..','ban_mau_pos.html'),'utf8'); const js=_h.split('<script>')[1].split('</script>')[0];
const nut={}; const el=id=>nut[id]||(nut[id]={innerHTML:'',textContent:'',style:{},className:''});
global.document={getElementById:el,addEventListener(){}};
global.setTimeout=()=>1; global.clearTimeout=()=>{}; global.setInterval=()=>0; global.clearInterval=()=>{};
eval(js+';global.VE=ve;global.A={S,them,xemTruoc,inVaGhi,inLaiLenh,inLaiLoi,moInLai,inLaiChon,donApp,daGiao,batTat,mo};');
const app=()=>nut['app'].innerHTML, may=()=>nut['mayin'].innerHTML;
const khay=ten=>{const h=may(); const i=h.indexOf(ten); return h.slice(i,h.indexOf('class="khay"',i+10));};
let d=0,x=0; const k=(t,c)=>{console.log(`  [${c?'ĐẠT':'HỎNG'}] ${t}`); c?d++:x++;};
const L=(tt,m)=>A.S.lenh.filter(l=>l.tt===tt&&(!m||l.m===m));

console.log('\n── 1a. in bình thường → sổ lệnh ghi lại ──');
A.them('DNL'); A.them('CF01'); A.xemTruoc('transfer'); A.inVaGhi(); VE();
k('3 lệnh đã in: 1 bill + 2 tem', L('da').length===3);
k('thanh báo KHÔNG còn nút IN LẠI (theo yêu cầu: cần thì vào chỗ in lại)', !app().includes('>IN LẠI<'));
k('sổ lệnh dưới mỗi máy ghi giờ · số bill · tờ gì', khay('Máy in tem').includes('tem 1/2') && khay('Máy in tem').includes('✓ đã in'));

console.log('\n── 1b. hết giấy ──');
A.S.hetGiay.tem=true;
A.them('DNL'); A.them('DNL'); A.xemTruoc('cash',100000); A.inVaGhi(); VE();
const so=A.S.don[0].so;
k('máy tem hết giấy → 2 tem báo LỖI, bill vẫn in', L('loi','tem').length===2 && L('da','quay').length===2);
k('khay tem hiện "HẾT GIẤY · 2 lỗi"', khay('Máy in tem').includes('HẾT GIẤY') && khay('Máy in tem').includes('2 lỗi'));
k('còn hết giấy thì CHƯA hiện nút in lại hàng loạt (in vào đâu?)', !khay('Máy in tem').includes('lệnh lỗi</button>'));
A.S.hetGiay.tem=false; VE();
k('nạp giấy → KHÔNG tự in lại (có thể đã ra nửa tờ) — hiện nút cho người bấm', L('loi','tem').length===2 && khay('Máy in tem').includes('In lại 2 lệnh lỗi'));
A.inLaiLoi('tem'); VE();
k('bấm → 2 tem in lại, hết lỗi', L('loi','tem').length===0 && (khay('Máy in tem').match(/class="tem"/g)||[]).length===2);
k('tem in lại ghi "IN LẠI 2" — không nhầm với đơn mới', khay('Máy in tem').includes('IN LẠI 2'));

console.log('\n── 1c. in lại chọn lọc theo đơn ──');
A.moInLai(so); VE();
k('mở In lại → liệt kê bill, phiếu pha chế, từng tem kèm số lần đã in', app().includes('Bill khách') && app().includes('2/2') && app().includes('đã in 1 lần'));
k('chưa tick gì → nút in lại bị khoá', /disabled onclick="inLaiChon\(\)"/.test(app()));
A.S.chonLai={khach:true}; A.inLaiChon(); VE();
k('chỉ in lại bill khách → đúng 1 tờ, có "IN LẠI · LẦN 2"', A.S.lenh[0].giay.loai==='khach' && khay('Máy in bill · quầy').includes('IN LẠI · LẦN 2'));

console.log('\n── 1d. máy tắt ──');
A.batTat('tem'); A.them('CF01'); A.xemTruoc('transfer'); A.inVaGhi();
k('máy tem tắt → lệnh CHỜ, không lỗi', L('cho','tem').length===1);
A.batTat('tem');
k('bật lại → tự in (vì chưa hề in lần nào)', L('cho','tem').length===0 && L('da','tem').length>=1);

console.log('\n── 2. đơn từ App KH ──');
A.donApp(); VE();
const ap=A.S.don[0];
k('đơn app về → tự in, KHÔNG ai phải bấm', A.S.lenh.filter(l=>l.so===ap.so&&l.tt==='da').length>0);
k('theo cài đặt app: tem + phiếu pha chế, KHÔNG in bill khách', A.S.lenh.some(l=>l.so===ap.so&&l.giay.loai==='pc') && !A.S.lenh.some(l=>l.so===ap.so&&l.giay.loai==='khach'));
k('3 tem (1 DNL + 2 cà phê), ghi chú "1 ly nóng" có trên tem', A.S.lenh.filter(l=>l.so===ap.so&&l.giay.loai==='tem').length===3 && khay('Máy in tem').includes('1 ly nóng'));
k('tem đơn app đánh dấu 📱 APP', khay('Máy in tem').includes('📱 APP'));
k('hiện thẻ tím 📱 trên dãy thẻ', A.mo().some(o=>o.so===ap.so) && app().includes('📱 app'));
A.S.ve=ap.so; VE();
k('mở thẻ: đã thanh toán online + khách + điểm', app().includes('Đã thanh toán online') && app().includes('Chị Lan (app)'));
A.daGiao(ap.so); VE();
k('bấm "Khách đã lấy" → thẻ đóng', !A.mo().some(o=>o.so===ap.so));

console.log('\n── 2b. đơn app về khi máy in hỏng ──');
A.batTat('tem'); A.batTat('pc'); A.S.cai.may.pc='pc';
A.donApp(); VE(); const ap2=A.S.don[0];
k('không in được → báo đỏ "CHƯA IN ĐƯỢC"', app().includes('CHƯA IN ĐƯỢC'));
k('thẻ đơn app có dấu ⚠, đơn KHÔNG mất', A.mo().some(o=>o.so===ap2.so) && app().includes('📱 app · ⚠'));
A.batTat('tem'); A.batTat('pc'); VE();
k('bật máy lại → tự in, dấu ⚠ biến mất', !ap2.inLoi && !app().includes('📱 app · ⚠'));
console.log(`\n  → ${d} đạt · ${x} hỏng\n`);
