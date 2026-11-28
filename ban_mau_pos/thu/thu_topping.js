// TOPPING-1 — topping + ghi chú theo món, tab Topping bán riêng, dòng topping trên giỏ / bill / tem / phiếu pha chế.
const fs=require('fs'); const _h=fs.readFileSync(require('path').join(__dirname,'..','ban_mau_pos.html'),'utf8'); const js=_h.split('<script>')[1].split('</script>')[0];
const nut={}; const el=id=>nut[id]||(nut[id]={innerHTML:'',textContent:'',style:{},className:''});
global.document={getElementById:el,addEventListener(){}};
global.setTimeout=()=>1; global.clearTimeout=()=>{}; global.setInterval=()=>0; global.clearInterval=()=>{};
eval(js+';global.VE=ve;global.A={S,TP,SP,them,tpThem,tpBot,khungSl,luuKhungTp,suaTp,xoaDongTp,themRieng,tongGio,temCua,billGiay,inVaGhi,xemTruoc,gcCua,TOPPING_TOI_DA_PHAN};');
const app=()=>nut['app'].innerHTML;
let d=0,x=0; const k=(t,c)=>{console.log(`  [${c?'ĐẠT':'HỎNG'}] ${t}`); c?d++:x++;};
const G=i=>A.S.gio[i], K=()=>A.S.khungTp, bao=()=>(A.S.bao||{}).chu||'';
const batDau=()=>{ A.S.gio=[]; A.S.khungTp=null; A.S.tab='tatca'; A.S.bao=null; A.S.buoc='chon'; A.S.ve='moi'; };

console.log('\n── chạm món: có topping → khung; không → vào giỏ ──');
batDau(); A.them('TDN'); VE();
k('món có topping → mở khung, giỏ chưa đổi', !!K() && A.S.gio.length===0 && app().includes('id="khung-tp"'));
k('khung chỉ hiện topping CÀI cho món (Nếp cẩm, Thạch, Long nhãn)', ['Nếp cẩm','Thạch','Long nhãn'].every(s=>app().includes(s)));
A.S.khungTp=null; A.them('DNL'); VE();
k('món không topping → chạm là vào giỏ, không khung', !K() && G(0).ma==='DNL' && G(0).sl===1);
k('ghi chú nhanh theo TỪNG món: Trà Dưỡng Nhan có "Ít ngọt", không có "Ít sữa"', A.gcCua('TDN').includes('Ít ngọt') && !A.gcCua('TDN').includes('Ít sữa'));

console.log('\n── chạm thêm phần, tối đa, bớt, hết, còn n ──');
batDau(); A.them('TDN'); A.tpThem('NC'); A.tpThem('NC');
k('chạm Nếp cẩm 2 lần → 2 phần', K().tps.find(t=>t.ma==='NC').so===2);
A.tpThem('NC'); A.tpThem('NC');
k(`tối đa ${A.TOPPING_TOI_DA_PHAN} phần — lần thứ 4 không thêm, báo rõ`, K().tps.find(t=>t.ma==='NC').so===3 && bao().includes('Tối đa 3'));
A.tpBot('NC');
k('nút − bớt một phần', K().tps.find(t=>t.ma==='NC').so===2);
A.tpBot('NC'); A.tpBot('NC');
k('bớt hết → topping ra khỏi ly', !K().tps.length);
VE();
k('topping hết (Long nhãn tồn 0) → ô mờ, ghi "Hết"', /<button class="o-tp" disabled[^>]*onclick="tpThem\('LN'\)"><span>Long nhãn<\/span><small>Hết/.test(app()));
k('còn < 5 phần → hiện "còn n phần" (Thạch còn 4)', app().includes('còn 4 phần'));
A.tpThem('LN');
k('chạm topping hết → không thêm', !K().tps.length);

console.log('\n── giá ly gồm topping; gộp / tách dòng ──');
batDau(); A.them('TDN'); A.tpThem('NC'); A.tpThem('NC'); A.khungSl(1); VE();
k('nút "Thêm vào giỏ" = (45.000 + 2×10.000) × 2 = 130.000đ', app().includes('Thêm vào giỏ · 130.000đ'));
A.luuKhungTp();
k('vào giỏ: 2 ly, 2 phần Nếp cẩm, tổng giỏ 130.000đ', G(0).sl===2 && G(0).tps[0].so===2 && A.tongGio()===130000);
A.them('TDN'); A.tpThem('NC'); A.tpThem('NC'); A.luuKhungTp();
k('cùng món + cùng topping → gộp số ly', A.S.gio.length===1 && G(0).sl===3);
A.them('TDN'); A.tpThem('TH'); A.luuKhungTp();
k('khác topping → dòng riêng', A.S.gio.length===2 && G(1).tps[0].ma==='TH');
VE();
k('giỏ: topping là dòng con dưới món "+ Nếp cẩm ×2"', app().includes('<div class="dong-tp">+ Nếp cẩm ×2'));
A.suaTp(G(1).k);
k('chạm "✎ topping" của dòng → mở lại khung với topping của dòng', K().sua===G(1).k && K().tps[0].ma==='TH');
A.tpThem('TH'); A.luuKhungTp();
k('sửa trong khung → dòng đổi, không thêm dòng', A.S.gio.length===2 && G(1).tps[0].so===2);
A.suaTp(G(1).k); A.xoaDongTp();
k('Xoá trong khung → bỏ dòng', A.S.gio.length===1);

console.log('\n── tồn topping tính trên CẢ giỏ ──');
batDau(); A.them('TDN'); A.tpThem('TH'); A.tpThem('TH'); A.luuKhungTp();   // 2 phần Thạch (tồn 4)
A.them('TDN'); A.tpThem('TH'); A.tpThem('TH');
k('dòng thứ hai lấy đúng phần còn lại (2 + 2 = 4 = tồn) → qua', K().tps[0].so===2);
A.tpThem('TH');
k('vượt tồn của cả giỏ (5 > 4) → không thêm, báo "chỉ còn"', K().tps[0].so===2 && bao().includes('chỉ còn'));
A.khungSl(1);
k('tăng số ly làm topping vượt tồn → không tăng', K().sl===1 && bao().includes('không đủ cho 2 ly'));

console.log('\n── tab Topping: bán riêng ──');
batDau(); A.S.tab='tp'; VE();
k('tab Topping chỉ hiện topping có giá bán riêng (Nếp cẩm, không Thạch)', app().includes('Nếp cẩm (phần riêng)') && !app().includes('Thạch (phần riêng)'));
A.themRieng('NC'); A.themRieng('NC');
k('chạm là vào giỏ như món, giá bán riêng 15.000đ × 2', G(0).tpRieng==='NC' && G(0).sl===2 && A.tongGio()===30000);
A.themRieng('TH');
k('topping không có giá bán riêng → không vào giỏ', A.S.gio.length===1);

console.log('\n── hoá đơn, tem, phiếu pha chế ──');
batDau(); A.them('TDN'); A.tpThem('NC'); A.tpThem('NC'); A.khungSl(1); A.luuKhungTp(); A.them('DNL');
A.xemTruoc('transfer'); A.inVaGhi();
const don=A.S.don[0], bill=A.billGiay(don,'khach',1), pc=A.billGiay(don,'pc',1), tems=A.temCua(don);
k('bill: dòng "+ Nếp cẩm x2" dưới món, giá 2 phần × 2 ly = 40.000đ', bill.includes('+ Nếp cẩm x2</span><span>40.000đ'));
k('bill: dòng món giữ giá ly (45.000 × 2 = 90.000đ)', bill.includes('Trà Dưỡng Nhan ×2</span><span>90.000đ'));
k('tem: mỗi ly một tem — 3 tem (2 trà + 1 DNL), không tem cho topping', tems.length===3);
k('tem của ly trà có dòng topping', tems[0].tp.join()==='+ Nếp cẩm x2' && !tems[2].tp.length);
k('phiếu pha chế có topping', pc.includes('+ Nếp cẩm x2'));
console.log(`\n  → ${d} đạt · ${x} hỏng\n`);
