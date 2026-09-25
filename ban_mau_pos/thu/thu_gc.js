const fs=require('fs'); const _h=fs.readFileSync(require('path').join(__dirname,'..','ban_mau_pos.html'),'utf8'); const js=_h.split('<script>')[1].split('</script>')[0];
const nut={}; const el=id=>nut[id]||(nut[id]={innerHTML:'',textContent:'',style:{},className:''});
global.document={getElementById:el,addEventListener(){}};
const hang=[]; global.setTimeout=(f,ms)=>{ if(ms===5000) hang.push(f); return 1;}; global.clearTimeout=()=>{};
global.setInterval=()=>0; global.clearInterval=()=>{};
eval(js+';global.VE=ve;global.A={S,them,doi,lat,tach,goRieng,xemTruoc,quayLai,inVaGhi,thu,hoan,mo,temCua,ghiChuLuu,TEM_TOI_DA};');
const app=()=>nut['app'].innerHTML, may=()=>nut['mayin'].innerHTML, het=()=>{const f=hang.pop(); f&&f();};
let d=0,x=0; const k=(t,c)=>{console.log(`  [${c?'ĐẠT':'HỎNG'}] ${t}`); c?d++:x++;};
const G=i=>A.S.gio[i];

console.log('\n── hai phần ghi chú tách hẳn nhau ──');
A.them('DNL'); A.them('DNL'); A.them('DNL');
A.lat(G(0).k,'Ít đường'); A.goRieng(G(0).k,'nhiều gừng'); VE();
k('bấm nút mặc định → vào phần lựa chọn', G(0).chon.join()==='Ít đường');
k('gõ tự do → vào phần ghi chú riêng', G(0).rieng==='nhiều gừng');
A.lat(G(0).k,'Ít đường');
k('bỏ nút "Ít đường" KHÔNG đụng tới ghi chú đã gõ', G(0).chon.length===0 && G(0).rieng==='nhiều gừng');
A.lat(G(0).k,'Không đá'); A.goRieng(G(0).k,'');
k('xoá ghi chú gõ KHÔNG đụng tới nút đã bấm', G(0).chon.join()==='Không đá' && G(0).rieng==='');
A.goRieng(G(0).k,'nhiều   gừng');
k('gõ nhiều dấu cách thừa → gọn lại một dấu', G(0).rieng==='nhiều gừng');

console.log('\n── lưu xuống máy chủ vẫn MỘT cột notes ──');
k('ghép thành "Không đá⏎nhiều gừng"', A.ghiChuLuu(G(0))==='Không đá\nnhiều gừng');
k('chỉ có nút → không có dòng thừa', A.ghiChuLuu({chon:['Ít sữa'],rieng:''})==='Ít sữa');
k('chỉ có gõ tay → không có dòng trống phía trên', A.ghiChuLuu({chon:[],rieng:'ấm vừa'})==='ấm vừa');

console.log('\n── tách ly: ly mới sạch ghi chú, mở sẵn ô gõ ──');
A.tach(G(0).k); VE();
k('ly tách ra: không mang theo nút lẫn ghi chú của ly gốc', G(1).chon.length===0 && G(1).rieng==='');
k('ô ghi chú đặc biệt của ly mới mở sẵn', A.S.moGC===G(1).k && app().includes('id="gc-'+G(1).k+'"'));
A.them('DNL');
k('chạm DNL thêm → vào dòng TRỐNG, dòng có ghi chú giữ nguyên ×2', G(0).sl===2 && G(0).rieng==='nhiều gừng' && G(1).sl===2 && !G(1).rieng);

console.log('\n── lên tem, bill ──');
A.goRieng(G(1).k,'mang đi, cho thêm túi giấy vì khách đi xe máy xa');   // 48 ký tự
A.them('CF01'); A.xemTruoc('transfer'); VE();
const h=app();
k('tem: dòng ghi chú đặc biệt nổi bật (nền đỏ, dấu ✎)', /class="rg">✎ nhiều gừng/.test(h));
k(`ghi chú dài ${G(1).rieng.length} ký tự → tem cắt còn ${A.TEM_TOI_DA} kèm "…"`, /class="rg">✎ mang đi, cho thêm túi giấy vì khách đi …/.test(h));
k('bill khách vẫn in ĐỦ ghi chú dài', h.includes('✎ mang đi, cho thêm túi giấy vì khách đi xe máy xa'));
k('xem trước cảnh báo tem không in hết', h.includes('tem chỉ in được phần đầu'));
k('ly không ghi chú → tem ghi "bình thường"', h.includes('— bình thường —'));
A.inVaGhi(); VE();
k('in → máy tem ra đủ 5 tem (4 DNL + 1 cà phê)', (may().match(/class="tem"/g)||[]).length===5);
k('đơn đã lưu giữ nguyên cả hai phần ghi chú', A.S.don[0].mon.some(g=>g.chon.join()==='Không đá'&&g.rieng==='nhiều gừng'));
console.log(`\n  → ${d} đạt · ${x} hỏng\n`);
