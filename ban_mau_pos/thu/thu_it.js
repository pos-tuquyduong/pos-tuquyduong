const fs=require('fs'); const _h=fs.readFileSync(require('path').join(__dirname,'..','ban_mau_pos.html'),'utf8'); const js=_h.split('<script>')[1].split('</script>')[0];
const nut={}; const el=id=>nut[id]||(nut[id]={innerHTML:'',textContent:'',style:{},className:''});
global.document={getElementById:el,addEventListener(){}};
const hang=[]; global.setTimeout=(f,ms)=>{ if(ms===5000) hang.push(f); return 1;}; global.clearTimeout=()=>{};
global.setInterval=()=>0; global.clearInterval=()=>{};
eval(js+';global.VE=ve;global.A={S,them,doi,lat,tach,xemTruoc,quayLai,inVaGhi,thu,hoan,mo,temCua};');
const app=()=>nut['app'].innerHTML, may=()=>nut['mayin'].innerHTML, het=()=>{const f=hang.pop(); f&&f();};
let d=0,x=0; const k=(t,c)=>{console.log(`  [${c?'ĐẠT':'HỎNG'}] ${t}`); c?d++:x++;};

console.log('\n── tách ly, mỗi ly ghi chú riêng ──');
A.them('DNL'); A.them('DNL'); A.them('DNL'); A.them('CF01');
k('bấm DNL 3 lần → 1 dòng ×3', A.S.gio.length===2 && A.S.gio[0].sl===3);
A.tach(A.S.gio[0].k);
k('tách ly → DNL×2 + DNL×1 (dòng riêng)', A.S.gio.length===3 && A.S.gio[0].sl===2 && A.S.gio[1].sl===1);
A.lat(A.S.gio[0].k,'Ít đường'); A.lat(A.S.gio[1].k,'Không đá'); A.lat(A.S.gio[1].k,'Ít sữa');
k('hai dòng DNL mang ghi chú khác nhau', A.S.gio[0].chon.join(', ')==='Ít đường' && A.S.gio[1].chon.join(', ')==='Không đá, Ít sữa');

console.log('\n── xem trước, chưa ghi gì ──');
A.xemTruoc('cash',100000);
k('khách đưa 100.000đ < tổng 109.000đ → KHÔNG cho sang xem trước', A.S.buoc==='chon');
A.xemTruoc('cash',200000);
k('bấm tờ tiền → ra màn XEM TRƯỚC, chưa có đơn nào', A.S.buoc==='xem' && A.S.don.length===0);
k('xem trước có bill khách + 4 tem', app().includes('TỨ QUÝ ĐƯỜNG') && (app().match(/class="tem"/g)||[]).length===4);
k('bill ghi đã thanh toán + tiền thối 91.000đ', app().includes('ĐÃ THANH TOÁN') && app().includes('91.000đ'));
k('tem đánh số 1/4 … 4/4', app().includes('>1/4<') && app().includes('>4/4<'));
k('tem ly 3 ghi đúng "Không đá, Ít sữa"', app().includes('Không đá, Ít sữa'));
A.quayLai();
k('← Quay lại → về chọn cách trả, giỏ còn nguyên 3 dòng', A.S.buoc==='chon' && A.S.gio.length===3 && A.S.don.length===0);

console.log('\n── bấm In ──');
A.xemTruoc('transfer'); A.inVaGhi(); VE();
k('bấm In → ghi 1 đơn đã thu chuyển khoản', A.S.don.length===1 && A.S.don[0].tt==='da' && A.S.don[0].cach==='transfer');
k('máy in QUẦY ra bill khách', /Máy in bill[\s\S]*TỨ QUÝ ĐƯỜNG/.test(may()));
k('máy in TEM ra đúng 4 tem', (may().match(/class="tem"/g)||[]).length===4);
k('mặc định KHÔNG in phiếu pha chế (tem thay rồi)', !may().includes('PHIẾU PHA CHẾ'));
k('giỏ trống, bán tiếp', A.S.gio.length===0 && A.S.buoc==='chon');

console.log('\n── bật phiếu pha chế, tắt tem ──');
A.them('CF01'); A.xemTruoc('cho'); A.S.inPC=true; A.S.inTem=false; VE();
k('xem trước có bill khách + phiếu pha chế, không tem', app().includes('PHIẾU PHA CHẾ') && !(app().match(/class="tem"/g)||[]).length);
k('bill mang ra bàn: CHƯA THANH TOÁN + chỗ QR', app().includes('CHƯA THANH TOÁN') && app().includes('QR payOS'));
A.inVaGhi(); VE();
k('in xong → có thẻ bill mở trên giỏ', A.mo().length===1);
k('máy quầy ra 2 tờ: bill khách + phiếu pha chế', /Máy in bill[\s\S]*TỨ QUÝ ĐƯỜNG[\s\S]*PHIẾU PHA CHẾ/.test(may()));

console.log('\n── thu bill ngoài bàn ──');
const so=A.mo()[0].so; A.S.ve=so; VE();
k('mở thẻ → hiện ghi chú món + nút thu', app().includes('Cần thu'));
A.thu(so,'cash'); A.hoan();
k('hoàn tác thu → thẻ quay lại', A.mo().length===1 && A.S.ve===so);
A.thu(so,'cash'); het();
k('thu xong → hết thẻ mở, không in thêm', A.mo().length===0);
console.log(`\n  → ${d} đạt · ${x} hỏng\n`);
