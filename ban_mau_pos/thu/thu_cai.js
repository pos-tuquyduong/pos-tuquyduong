const fs=require('fs'); const _h=fs.readFileSync(require('path').join(__dirname,'..','ban_mau_pos.html'),'utf8'); const js=_h.split('<script>')[1].split('</script>')[0];
const nut={}; const el=id=>nut[id]||(nut[id]={innerHTML:'',textContent:'',style:{},className:''});
global.document={getElementById:el,addEventListener(){}};
global.setTimeout=()=>1; global.clearTimeout=()=>{}; global.setInterval=()=>0; global.clearInterval=()=>{};
eval(js+';global.VE=ve;global.A={S,them,xemTruoc,inVaGhi,batTat};');
const app=()=>nut['app'].innerHTML, may=()=>nut['mayin'].innerHTML;
const khay=ten=>{ const h=may(); const i=h.indexOf(ten); const j=h.indexOf('class="khay"',i); return h.slice(i, j<0?undefined:j); };
let d=0,x=0; const k=(t,c)=>{console.log(`  [${c?'ĐẠT':'HỎNG'}] ${t}`); c?d++:x++;};
const ban=(kieu,dua)=>{ A.them('DNL'); A.them('CF01'); A.xemTruoc(kieu,dua); };

console.log('\n── mặc định ──');
ban('transfer'); VE();
k('xem trước: tick bill khách + tem, bỏ phiếu pha chế — đúng cài đặt', A.S.inKhach && A.S.inTem && !A.S.inPC);
k('mỗi dòng ghi rõ in ra máy nào', app().includes('→ Máy in bill · quầy') && app().includes('→ Máy in tem · pha chế'));
A.inVaGhi(); VE();
k('bill khách ra máy QUẦY', /TỨ QUÝ ĐƯỜNG/.test(khay('Máy in bill · quầy')));
k('2 tem ra máy TEM', (khay('Máy in tem · pha chế').match(/class="tem"/g)||[]).length===2);
k('máy bill pha chế không in gì', khay('Máy in bill · pha chế').includes('Chưa in gì'));

console.log('\n── đổi cài đặt: phiếu pha chế in ra máy pha chế, mang ra bàn mặc định bật ──');
A.S.cai.may.pc='pc'; A.S.cai.ngoai.pc=true;
ban('cho'); VE();
k('mang ra bàn → phiếu pha chế TỰ tick theo cài đặt mới', A.S.inPC===true);
k('trả tại quầy vẫn giữ mặc định cũ (không tick)', (A.xemTruoc('cash',100000), A.S.inPC===false));
A.xemTruoc('cho'); A.inVaGhi(); VE();
k('phiếu pha chế ra đúng máy PHA CHẾ, không ra máy quầy',
  khay('Máy in bill · pha chế').includes('PHIẾU PHA CHẾ') && !khay('Máy in bill · quầy').includes('PHIẾU PHA CHẾ'));

console.log('\n── bỏ tick ở xem trước chỉ áp cho đơn đó ──');
ban('transfer'); A.S.inTem=false; A.inVaGhi(); VE();
k('đơn này không in tem', khay('Máy in tem · pha chế').includes('Chưa in gì'));
ban('transfer'); VE();
k('đơn sau: tem lại được tick sẵn (cài đặt không bị đổi)', A.S.inTem===true && A.S.cai.quay.tem===true);
A.inVaGhi();

console.log('\n── số bản ──');
A.S.cai.ban.khach=2; ban('transfer'); A.inVaGhi(); VE();
k('bill khách 2 bản → máy quầy ra 2 tờ', (khay('Máy in bill · quầy').match(/TỨ QUÝ ĐƯỜNG/g)||[]).length===2);
A.S.cai.ban.khach=1;

console.log('\n── máy tắt: lệnh không mất ──');
A.batTat('tem'); ban('transfer'); VE();
k('xem trước cảnh báo "máy đang tắt"', app().includes('đang tắt') && app().includes('không mất'));
A.inVaGhi(); VE();
k('in → 2 tem nằm CHỜ ở máy tem', A.S.lenh.filter(l=>l.m==='tem'&&l.tt==='cho').length===2);
A.batTat('tem'); VE();
k('bật máy → 2 tem tự in ra, hàng chờ trống', (khay('Máy in tem · pha chế').match(/class="tem"/g)||[]).length===2 && A.S.lenh.filter(l=>l.m==='tem'&&l.tt==='cho').length===0);

console.log('\n── chỉ chọn được máy đúng khổ ──');
A.S.man='cai'; VE();
const h=app(); const oTem=h.slice(h.indexOf('Tem cốc'), h.indexOf('Phiếu pha chế'));
k('ô "in ra máy" của tem cốc CHỈ có máy tem', oTem.includes('Máy in tem') && !oTem.includes('Máy in bill'));
console.log(`\n  → ${d} đạt · ${x} hỏng\n`);
