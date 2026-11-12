// NHÁP — chép sang ban_mau_pos/thu/thu_hd.js khi Phạm vi ghi đúng tên file (người gác G-LUAT). Áp ban_mau.py vào ban_mau_pos.html trước.
// HUY-1 — huỷ ĐƠN ĐÃ THU ở chi tiết Lịch sử đơn và thẻ đơn App: 5 lý do, "Khác" phải ghi thêm, hoàn toàn bộ, KHÔNG hoàn tác 5 giây.
const fs=require('fs'); const _h=fs.readFileSync(require('path').join(__dirname,'..','ban_mau_pos.html'),'utf8'); const js=_h.split('<script>')[1].split('</script>')[0];
const nut={}; const el=id=>nut[id]||(nut[id]={innerHTML:'',textContent:'',style:{},className:''});
global.document={getElementById:el,addEventListener(){}};
const hang=[]; global.setTimeout=(f,ms)=>{ if(ms===5000) hang.push(f); return 1;}; global.clearTimeout=()=>{};
global.setInterval=()=>0; global.clearInterval=()=>{};
global.window={AudioContext:function(){ this.currentTime=0; this.destination={};
  this.createOscillator=()=>({frequency:{},connect(){},start(){},stop(){}});
  this.createGain=()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}); }};
eval(js+';global.VE=ve;global.A={S,them,xemTruoc,inVaGhi,donApp,moHuyDon,xacNhanHuyDon,huyDuoc};');
const app=()=>nut['app'].innerHTML, ng=()=>nut['ngan'].innerHTML;
let d=0,x=0; const k=(t,c)=>{console.log(`  [${c?'ĐẠT':'HỎNG'}] ${t}`); c?d++:x++;};

console.log('\n── huỷ đơn đã thu ở Lịch sử đơn (khách lẻ) ──');
A.them('CF01'); A.xemTruoc('cash',20000); A.inVaGhi();
const b=A.S.don[0];
A.S.man='ls'; A.S.chon=b.so; VE();
k('chi tiết đơn đã thu có nút "✕ Huỷ đơn"', ng().includes('✕ Huỷ đơn') && ng().includes(`moHuyDon(${b.so})`));
A.moHuyDon(b.so); VE();
k('mở hộp huỷ: đủ 5 lý do của phiếu', ['Pha nhầm món','Bấm nhầm','Hết nguyên liệu','Khách đổi ý','Khác'].every(l=>ng().includes(l)));
k('nút Huỷ đơn khoá khi chưa chọn lý do', /id="nut-huy-don" class="nut" style="flex:1.4;background:#dc2626" disabled/.test(ng()));
k('khách lẻ: báo "trả khách … tiền mặt từ két"', ng().includes('tiền mặt từ két'));
A.S.lyDoHuy='khac'; A.S.ghiThemHuy='   '; VE();
k('"Khác" mà ghi thêm toàn dấu cách → vẫn khoá', !A.huyDuoc() && /id="nut-huy-don"[^>]*disabled/.test(ng()));
A.xacNhanHuyDon();
k('bấm khi chưa đủ lý do → không huỷ', b.tt==='da');
A.S.ghiThemHuy='khách gọi lại'; VE();
k('"Khác" + ghi thêm → mở khoá', A.huyDuoc() && !/id="nut-huy-don"[^>]*disabled/.test(ng()));
const soHen=hang.length;
A.xacNhanHuyDon(); VE();
k('huỷ NGAY (không hẹn 5 giây, không nút HOÀN TÁC)', b.tt==='huy' && hang.length===soHen && !app().includes('HOÀN TÁC'));
k('nhật ký ghi "Huỷ đơn · khách gọi lại · trả khách … tiền mặt từ két"', b.nk.some(n=>n.viec.startsWith('Huỷ đơn · khách gọi lại · trả khách') && n.viec.includes('tiền mặt từ két')));
A.S.chon=b.so; VE();
k('đơn đã huỷ không còn nút Huỷ đơn', !ng().includes(`moHuyDon(${b.so})`));

console.log('\n── huỷ đơn App (khách có tài khoản) ──');
A.S.man='ban'; A.donApp(); const ap=A.S.don[0]; A.S.ve=ap.so; VE();
k('thẻ đơn App có nút "✕ Huỷ đơn"', app().includes(`moHuyDon(${ap.so})`));
A.moHuyDon(ap.so); A.S.lyDoHuy='het_nguyen_lieu'; VE();
k('đơn có tài khoản: báo "hoàn … vào tài khoản Chị Lan (app)"', app().includes('vào tài khoản Chị Lan (app)'));
A.xacNhanHuyDon();
k('mã có sẵn, không ghi thêm → lý do = nhãn, đóng thẻ', ap.tt==='huy' && ap.lyDo==='Hết nguyên liệu' && ap.giao===true);

console.log(`\n  ${d} đạt · ${x} hỏng`); process.exit(x?1:0);
