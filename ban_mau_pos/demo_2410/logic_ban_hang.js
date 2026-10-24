class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = this.donTrong();
    this.state.soDon = 45;
  }
  donTrong() {
    return { trang: 'mon', nhom: 'tat', gio: [], khach: null, chonKhach: false, uuDai: false, km: null, giao: false, diaChi: '', phiGiao: 0, xe: null, moSoKhac: false, soKhac: '',
      dungTK: true, dungMe: false, man: 'ban', tim: '', cach: null, dua: 0, pinOk: false, pin: '', pinSai: 0, sau: null,
      xem: 1, soTo: 2, daIn: false, cham: 0, bao: null, chon: null, demKey: 1, daChonKhach: false };
  }
  renderVals() {
    var s = this.state, self = this;
    var vnd = function (n) { return Math.round(n).toLocaleString('vi-VN') + 'đ'; };
    var dat = function (o) { self.setState(o); };
    var NOTE = {
      tra: ['Ít đá', 'Không đá', 'Ít ngọt', 'Nóng'],
      dn: ['Ít đá', 'Không đá', 'Ít ngọt', 'Nóng'],
      ep: ['Ít đá', 'Không đá', 'Không đường'],
      cam: ['Ít đá', 'Không đá', 'Không đường', 'Không hạt'],
      den: ['Ít đá', 'Không đá', 'Nóng', 'Ít đường', 'Đậm'],
      sua: ['Ít đá', 'Không đá', 'Nóng', 'Nhiều sữa', 'Ít sữa', 'Ít ngọt']
    };
    var TOP = {
      thach: { ten: 'Thạch', gia: 5000 },
      nep: { ten: 'Nếp cẩm', gia: 8000 },
      chia: { ten: 'Hạt chia', gia: 6000, het: true }
    };
    var MON = [
      { id: 'tra', ten: 'Trà thảo mộc', gia: 25000, nhom: 'tra', top: ['thach'] },
      { id: 'dn', ten: 'Trà dưỡng nhan', gia: 35000, nhom: 'tra', top: ['thach', 'nep', 'chia'] },
      { id: 'ep', ten: 'Nước ép rau củ', gia: 35000, nhom: 'ep', top: [] },
      { id: 'cam', ten: 'Nước ép cam', gia: 32000, nhom: 'ep', top: [] },
      { id: 'den', ten: 'Cà phê đen', gia: 25000, nhom: 'cf', top: [] },
      { id: 'sua', ten: 'Cà phê sữa', gia: 29000, nhom: 'cf', top: [] },
      { id: 'goi', ten: 'Gói Nước Ép 30 ngày', gia: 900000, nhom: 'goi', laGoi: true, thang: true },
      { id: 'tuGoi', ten: 'Nước ép · lấy từ gói', gia: 0, nhom: 'goi', tuGoi: true, thang: true }
    ];
    var M = {}; MON.forEach(function (m) { M[m.id] = m; });
    var KHACH = {
      hoa: { ten: 'Chị Hoa', sdt: '0912 ••• 123', hang: 'Vàng', pct: 10, tk: 50000, diem: 320, me: { ten: 'Anh Minh', tk: 200000 }, voucher: { ten: 'Mã của khách: giảm 15.000đ', giam: 15000, cong: true }, goi: 12 },
      minh: { ten: 'Anh Minh', sdt: '0987 ••• 456', hang: 'Bạc', pct: 5, tk: 200000, diem: 80, me: null, voucher: null, goi: 0 },
      lan: { ten: 'Cô Lan', sdt: '0903 ••• 789', hang: 'Thành viên', pct: 0, tk: 0, diem: 0, me: null, voucher: null, goi: 0 }
    };
    var QUA = [
      { id: 'q10', ten: 'Giảm 10% (tối đa 20.000đ)', diem: 100, cong: true, tinh: function (t) { return Math.min(Math.round(t * 0.1), 20000); } },
      { id: 'q30', ten: 'Giảm 30.000đ', diem: 250, cong: false, tinh: function () { return 30000; } },
      { id: 'q50', ten: 'Giảm 50.000đ', diem: 400, cong: false, tinh: function () { return 50000; } }
    ];
    var toanGiaoTruoc = function (g) { return g.length > 0 && g.every(function (d) { return M[d.id].tuGoi; }); };
    var kh = s.khach ? KHACH[s.khach] : null;
    var pct = kh ? kh.pct : 0;
    var tienTop = function (top) { var t = 0; for (var k in top) t += TOP[k].gia * top[k]; return t; };
    var tenTop = function (top) { var a = []; for (var k in top) if (top[k] > 0) a.push(TOP[k].ten + (top[k] > 1 ? ' x' + top[k] : '')); return a; };
    var giaHang = function (g) { return Math.round(g * (100 - pct) / 100); };

    var gio = s.gio.filter(function (d) { return d.sl > 0; });
    var tamGoc = gio.reduce(function (a, d) { return a + (M[d.id].gia + tienTop(d.top)) * d.sl; }, 0);
    var giamHang = gio.reduce(function (a, d) { var m = M[d.id]; return a + (m.thang ? 0 : (m.gia + tienTop(d.top)) * d.sl - giaHang(m.gia + tienTop(d.top)) * d.sl); }, 0);
    var giamKm = 0, tenKm = '', diemDoi = 0, kmCong = true, ghiChuKm = '';
    if (s.km) {
      var tinh = null;
      if (s.km.loai === 'qua') { var q = QUA.filter(function (x) { return x.id === s.km.id; })[0]; tinh = q.tinh; tenKm = 'Đổi ' + q.diem + ' điểm: ' + q.ten; diemDoi = q.diem; kmCong = q.cong; }
      if (s.km.loai === 'voucher' && kh && kh.voucher) { tinh = function () { return kh.voucher.giam; }; tenKm = kh.voucher.ten; kmCong = kh.voucher.cong; }
      if (s.km.loai === 'ma') { tinh = function (t) { return Math.min(Math.round(t * 0.1), 20000); }; tenKm = 'Mã THANG10 (mã demo)'; kmCong = true; }
      if (kmCong || !giamHang) giamKm = Math.min(tinh(tamGoc - giamHang), tamGoc - giamHang);
      else {
        var kmRieng = Math.min(tinh(tamGoc), tamGoc);
        if (kmRieng > giamHang) { giamKm = kmRieng; ghiChuKm = 'Ưu đãi này không cộng với giảm hạng → áp ưu đãi (lợi hơn), bỏ giảm hạng'; giamHang = 0; }
        else { giamKm = 0; ghiChuKm = 'Ưu đãi này không cộng với giảm hạng → giữ giảm hạng (lợi hơn), ưu đãi chưa dùng'; diemDoi = 0; }
      }
    }
    var shipTien = s.giao ? s.phiGiao : 0;
    var tong = tamGoc - giamHang - giamKm + shipTien;
    var DIEM_MOI = 10000;

    var truTK = kh && kh.tk > 0 && s.dungTK ? Math.min(kh.tk, tong) : 0;
    var truMe = kh && kh.me && s.dungMe ? Math.min(kh.me.tk, tong - truTK) : 0;
    var conLai = tong - truTK - truMe;
    var toanGiao = gio.length > 0 && gio.every(function (d) { return M[d.id].tuGoi; });
    var diemCong = toanGiao ? 0 : Math.floor(Math.max(0, conLai - shipTien) / DIEM_MOI);
    var soLy = gio.reduce(function (a, d) { return a + (M[d.id].laGoi ? 0 : d.sl); }, 0);
    var canPin = !toanGiao && (truTK + truMe > 0 || diemDoi > 0);
    var dangChon = !!s.chon;
    var luoiKhoa = s.man === 'pin' || s.man === 'qr' || (s.man === 'xong' && !s.daIn);

    var chip = function (on) {
      return 'min-height: 40px; padding: 0 12px; border-radius: 20px; font-size: 13px; border: 1px solid ' +
        (on ? '#1F6F4A; background: #E7F2EC; color: #164F35; font-weight: 600' : '#D6D2CA; background: #FFFFFF; color: #1C1B1A');
    };
    var giuCt = [];
    if (truTK) giuCt.push(vnd(truTK) + ' tài khoản');
    if (truMe) giuCt.push(vnd(truMe) + ' tài khoản mẹ');
    if (diemDoi) giuCt.push(diemDoi + ' điểm');

    // ---------- thanh toán
    var daTra = function (cachTra) { dat({ man: 'xong', cach: cachTra, xem: 1, daIn: false, pin: '' }); };
    var batDauTra = function (cach, dua) {
      var o = { cach: cach, dua: dua, cham: s.cham + 1, pin: '', pinSai: 0 };
      if (canPin && !s.pinOk) { o.man = 'pin'; o.sau = cach; dat(o); return; }
      if (cach === 'ck') { o.man = 'qr'; dat(o); return; }
      o.man = 'xong'; o.xem = 1; o.daIn = false; dat(o);
    };
    var veGio = function (bao) { dat({ man: 'ban', cach: null, dua: 0, pinOk: false, pin: '', pinSai: 0, sau: null, cham: 0, bao: bao || null }); };
    var bamPin = function (k) {
      if (k === 'xoa') { dat({ pin: s.pin.slice(0, -1) }); return; }
      var p = s.pin + k;
      if (p.length < 4) { dat({ pin: p }); return; }
      if (p === '1234') { if (s.sau === 'ck') dat({ pin: '', pinOk: true, man: 'qr' }); else dat({ pin: '', pinOk: true, man: 'xong', xem: 1, daIn: false }); return; }
      var sai = s.pinSai + 1;
      if (sai >= 5) { self.setState({ pin: '', pinSai: 0, man: 'ban', cach: null, dungTK: false, dungMe: false, km: s.km && s.km.loai === 'qua' ? null : s.km, cham: 0,
        bao: 'Sai PIN 5 lần — tạm khoá dùng tài khoản và điểm của khách 15 phút. Khách trả bằng tiền mặt hoặc chuyển khoản.' }); return; }
      dat({ pin: '', pinSai: sai });
    };

    // ---------- QR mẫu
    var taoQR = function (seed0, px) {
      var o = [], seed = seed0;
      var finder = function (r, c) {
        var g = [[0, 0], [0, 14], [14, 0]];
        for (var i = 0; i < 3; i++) {
          var rr = r - g[i][0], cc = c - g[i][1];
          if (rr >= 0 && rr < 7 && cc >= 0 && cc < 7) return (rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4)) ? 1 : 0;
          if (rr >= -1 && rr <= 7 && cc >= -1 && cc <= 7) return 0;
        }
        return -1;
      };
      for (var r = 0; r < 21; r++) for (var c = 0; c < 21; c++) {
        var f = finder(r, c), den;
        if (f >= 0) den = f === 1; else { seed = (seed * 1103515245 + 12345) % 2147483648; den = (seed >> 16) % 2 === 0; }
        o.push({ kieu: 'width: ' + px + 'px; height: ' + px + 'px; background: ' + (den ? '#1C1B1A' : '#FFFFFF') });
      }
      return o;
    };

    // ---------- lưới món
    var nhom = [['tat', 'Tất cả'], ['tra', 'Trà'], ['ep', 'Nước ép'], ['cf', 'Cà phê'], ['goi', 'Gói']].map(function (n) {
      var on = s.nhom === n[0];
      return { ten: n[1], chon: function () { dat({ nhom: n[0] }); },
        kieu: 'flex: 0 0 auto; min-height: 44px; padding: 0 16px; border-radius: 22px; font-size: 14px; font-weight: 600; border: 1px solid ' + (on ? '#1C1B1A; background: #1C1B1A; color: #FFFFFF' : '#D6D2CA; background: #FFFFFF; color: #1C1B1A') };
    });
    var batDauDonMoi = function () { var b = self.donTrong(); b.soDon = s.soDon + 1; return b; };
    var themThang = function (id) {
      var base = (s.man === 'xong' && s.daIn) ? batDauDonMoi() : null;
      var g = (base ? [] : s.gio).slice(), f = false;
      g = g.map(function (d) { if (d.id === id) { f = true; return Object.assign({}, d, { sl: d.sl + 1 }); } return d; });
      if (!f) g.push({ key: 'k' + s.demKey, id: id, sl: 1, top: {}, note: [], text: '' });
      if (base) { base.gio = g; base.demKey = s.demKey + 1; self.setState(base); } else dat({ gio: g, bao: null, demKey: s.demKey + 1 });
    };
    var moKhung = function (id, sua) {
      var o = { chon: sua ? { id: id, key: sua.key, sl: sua.sl, top: Object.assign({}, sua.top), note: sua.note.slice(), text: sua.text } : { id: id, key: null, sl: 1, top: {}, note: [], text: '' } };
      if (s.man === 'xong' && s.daIn) { var b = batDauDonMoi(); b.chon = o.chon; self.setState(b); return; }
      dat(o);
    };
    var mon = MON.filter(function (m) { return (s.nhom === 'tat' || m.nhom === s.nhom) && (!m.tuGoi || (kh && kh.goi > 0)); }).map(function (m) {
      var sl = gio.filter(function (d) { return d.id === m.id; }).reduce(function (a, d) { return a + d.sl; }, 0);
      var coHang = pct > 0 && !m.thang;
      return { ten: m.ten, giaGoc: vnd(m.gia), coHang: coHang, giaHang: coHang ? vnd(giaHang(m.gia)) + ' · ' + kh.hang : '',
        giaThuong: m.tuGoi ? 'còn ' + kh.goi + ' túi · 0đ' : vnd(m.gia), khongHang: !coHang,
        phu: m.top && m.top.length ? 'có topping' : (m.thang ? '' : 'ghi chú'),
        khoa: luoiKhoa, coSl: sl > 0, sl: sl,
        kieu: 'min-height: 96px; padding: 12px; border-radius: 14px; display: flex; flex-direction: column; align-items: flex-start; justify-content: space-between; gap: 2px; text-align: left; color: #1C1B1A; border: 1px solid ' + (sl ? '#1F6F4A' : '#E4E1DA') + '; background: ' + (luoiKhoa ? '#EFEDE8; opacity: 0.55' : (m.laGoi || m.tuGoi ? '#FFF8EC' : '#FFFFFF')),
        them: function () { if (luoiKhoa) return; if (m.thang) themThang(m.id); else moKhung(m.id, null); } };
    });

    // ---------- khung chọn món
    var C = s.chon, mC = C ? M[C.id] : null;
    var giaKhungGoc = C ? (mC.gia + tienTop(C.top)) * C.sl : 0;
    var khung = C ? {
      ten: mC.ten,
      gia: pct ? vnd(giaHang(mC.gia)) : vnd(mC.gia),
      giaGoc: pct ? vnd(mC.gia) : '', coHang: pct > 0,
      coTop: mC.top.length > 0,
      top: mC.top.map(function (k) {
        var t = TOP[k], n = C.top[k] || 0;
        return { ten: t.ten + (t.het ? ' — hết (kho SX)' : ''), gia: '+' + vnd(pct ? giaHang(t.gia) : t.gia), sl: n, coSl: n > 0, khoa: !!t.het,
          kieu: 'min-height: 52px; padding: 0 12px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 15px; text-align: left; border: ' +
            (t.het ? '1px dashed #D6D2CA; background: #F6F5F2; color: #8A847A' : (n ? '2px solid #1F6F4A; background: #E7F2EC; color: #164F35' : '1px solid #D6D2CA; background: #FFFFFF; color: #1C1B1A')),
          bam: function () { if (t.het) return; var tp = Object.assign({}, C.top); tp[k] = (tp[k] || 0) + 1; if (tp[k] > 3) delete tp[k]; dat({ chon: Object.assign({}, C, { top: tp }) }); } };
      }),
      note: NOTE[mC.id].map(function (c) { var on = C.note.indexOf(c) >= 0;
        return { ten: c, kieu: chip(on), bam: function () { dat({ chon: Object.assign({}, C, { note: on ? C.note.filter(function (y) { return y !== c; }) : C.note.concat([c]) }) }); } }; }),
      text: C.text,
      sl: C.sl,
      bot: function () { if (C.sl > 1) dat({ chon: Object.assign({}, C, { sl: C.sl - 1 }) }); },
      cong: function () { dat({ chon: Object.assign({}, C, { sl: C.sl + 1 }) }); },
      nhan: (C.key ? 'Cập nhật · ' : 'Thêm vào giỏ · ') + vnd(pct ? giaHang(giaKhungGoc / C.sl) * C.sl : giaKhungGoc),
      xong: function () {
        var dong = { key: C.key || ('k' + s.demKey), id: C.id, sl: C.sl, top: C.top, note: C.note, text: (C.text || '').trim() };
        var g = C.key ? s.gio.map(function (d) { return d.key === C.key ? dong : d; }) : s.gio.concat([dong]);
        dat({ gio: g, chon: null, demKey: s.demKey + 1, bao: null });
      },
      xoa: function () { dat({ gio: s.gio.filter(function (d) { return d.key !== C.key; }), chon: null }); },
      coXoa: !!C.key,
      dong: function () { dat({ chon: null }); },
      goChu: function (e) { var v = e && e.target ? e.target.value : ''; dat({ chon: Object.assign({}, C, { text: v }) }); }
    } : { ten: '', gia: '', giaGoc: '', coHang: false, coTop: false, top: [], note: [], text: '', sl: 1, nhan: '', coXoa: false };

    // ---------- giỏ
    var moTa = function (d) { var a = tenTop(d.top).map(function (x) { return '+ ' + x; }).concat(d.note); if (d.text) a.push('"' + d.text + '"'); return a.join(' · '); };
    var gioV = gio.map(function (d) {
      var m = M[d.id], don = m.gia + tienTop(d.top), coH = pct > 0 && !m.thang;
      return { ten: m.ten, sl: d.sl, moTa: moTa(d),
        tien: m.tuGoi ? 'từ gói' : vnd((coH ? giaHang(don) : don) * d.sl),
        coGoc: coH, tienGoc: vnd(don * d.sl),
        sua: function () { if (!m.thang) moKhung(d.id, d); },
        coSua: !m.thang,
        bot: function () { dat({ gio: s.gio.map(function (x) { return x.key === d.key ? Object.assign({}, x, { sl: x.sl - 1 }) : x; }).filter(function (x) { return x.sl > 0; }) }); },
        cong: function () { dat({ gio: s.gio.map(function (x) { return x.key === d.key ? Object.assign({}, x, { sl: x.sl + 1 }) : x; }) }); } };
    });

    var chonKm = function (km) { var cung = s.km && s.km.loai === km.loai && s.km.id === km.id; dat({ km: cung ? null : km }); };
    var qua = [];
    if (kh) {
      if (kh.voucher) qua.push({ ten: kh.voucher.ten, gia: 'đã có', cong: kh.voucher.cong, khoa: false, chon: function () { chonKm({ loai: 'voucher', id: 'v' }); }, on: s.km && s.km.loai === 'voucher' });
      QUA.forEach(function (q) { var du = kh.diem >= q.diem;
        qua.push({ ten: q.ten, gia: q.diem + ' điểm', cong: q.cong, khoa: !du, chon: function () { if (du) chonKm({ loai: 'qua', id: q.id }); }, on: s.km && s.km.loai === 'qua' && s.km.id === q.id }); });
      qua.forEach(function (q) {
        q.phu = q.cong ? 'cộng với giảm hạng' : 'không cộng với giảm hạng';
        q.kieu = 'min-height: 52px; padding: 6px 12px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 14px; text-align: left; border: 1px solid ' +
          (q.khoa ? '#ECEAE5; background: #F6F5F2; color: #8A847A' : (q.on ? '#1F6F4A; background: #E7F2EC; color: #164F35' : '#D6D2CA; background: #FFFFFF; color: #1C1B1A')); });
    }

    var dongTien = [{ ten: 'Tạm tính (giá gốc)', tien: vnd(tamGoc), kieu: 'color: #5F5A52', coNut: false }];
    if (giamHang) dongTien.push({ ten: 'Giảm hạng ' + kh.hang + ' ' + pct + '%', tien: '−' + vnd(giamHang), kieu: 'color: #1F6F4A', coNut: false });
    if (giamKm) dongTien.push({ ten: tenKm, tien: '−' + vnd(giamKm), kieu: 'color: #1F6F4A', coNut: true, nut: 'Gỡ', bam: function () { dat({ km: null }); } });
    if (shipTien) dongTien.push({ ten: 'Phí giao Ahamove (không giảm, không tích điểm)', tien: '+' + vnd(shipTien), kieu: 'color: #5F5A52', coNut: false });
    if (kh && kh.tk > 0 && !toanGiao) dongTien.push({ ten: s.dungTK ? 'Trừ tiền tài khoản' : 'Tiền tài khoản ' + vnd(kh.tk) + ' (không dùng)', tien: s.dungTK ? '−' + vnd(truTK) : '', kieu: 'color: #1F6F4A; font-weight: 600', coNut: true, nut: s.dungTK ? 'Bỏ' : 'Dùng', bam: function () { dat({ dungTK: !s.dungTK }); } });
    if (kh && kh.me && !toanGiao) dongTien.push({ ten: s.dungMe ? 'Trừ tài khoản mẹ (' + kh.me.ten + ')' : 'Tài khoản mẹ (' + kh.me.ten + ') ' + vnd(kh.me.tk), tien: s.dungMe ? '−' + vnd(truMe) : '', kieu: 'color: #5F5A52', coNut: true, nut: s.dungMe ? 'Bỏ' : 'Dùng', bam: function () { dat({ dungMe: !s.dungMe }); } });

    var toTien = [0, 50000, 100000, 200000, 500000].filter(function (g) { return g === 0 || g > conLai; }).slice(0, 4).map(function (g) {
      return { ten: g === 0 ? 'Đúng tiền' : vnd(g), phu: g === 0 ? vnd(conLai) : 'trả lại ' + vnd(g - conLai), chon: function () { batDauTra('tm', g); } };
    });

    // ---------- hoá đơn & tem
    var hang = 'display: flex; justify-content: space-between; gap: 8px';
    var dongBill = [{ ten: 'Giá gốc', tien: vnd(tamGoc), kieu: hang }];
    if (giamHang) dongBill.push({ ten: 'Giảm hạng ' + (kh ? kh.hang : '') + ' ' + pct + '%', tien: '−' + vnd(giamHang), kieu: hang });
    if (giamKm) dongBill.push({ ten: tenKm, tien: '−' + vnd(giamKm), kieu: hang });
    if (shipTien) dongBill.push({ ten: 'Phí giao Ahamove', tien: '+' + vnd(shipTien), kieu: hang });
    dongBill.push({ ten: 'TỔNG HÓA ĐƠN', tien: vnd(tong), kieu: hang + '; font-weight: 700; font-size: 16px; border-top: 1px solid #1C1B1A; padding-top: 4px; margin-top: 2px' });
    dongBill.push({ ten: 'THANH TOÁN', tien: '', kieu: hang + '; font-size: 11px; font-weight: 700; color: #5F5A52; border-top: 1px dashed #8A847A; padding-top: 6px; margin-top: 6px' });
    if (toanGiao) dongBill.push({ ten: 'Lấy từ gói', tien: '0đ', kieu: hang });
    if (truTK) dongBill.push({ ten: 'Từ tài khoản', tien: vnd(truTK), kieu: hang });
    if (truMe) dongBill.push({ ten: 'Từ tài khoản mẹ', tien: vnd(truMe), kieu: hang });
    if (!toanGiao && conLai > 0) dongBill.push({ ten: s.cach === 'ck' ? 'Chuyển khoản (payOS)' : 'Tiền mặt', tien: vnd(conLai), kieu: hang });
    if (s.cach === 'tm' && s.dua > conLai) dongBill.push({ ten: 'Khách đưa / Trả lại', tien: vnd(s.dua) + ' / ' + vnd(s.dua - conLai), kieu: hang });
    if (toanGiao && kh) dongBill.push({ ten: 'Gói còn lại', tien: (kh.goi - gio.reduce(function (a, d) { return a + d.sl; }, 0)) + ' túi', kieu: hang + '; color: #5F5A52' });
    if (kh && !toanGiao) {
      dongBill.push({ ten: 'ĐIỂM THƯỞNG', tien: '', kieu: hang + '; font-size: 11px; font-weight: 700; color: #5F5A52; border-top: 1px dashed #8A847A; padding-top: 6px; margin-top: 6px' });
      dongBill.push({ ten: 'Điểm trước đơn', tien: kh.diem + '', kieu: hang });
      if (diemDoi) dongBill.push({ ten: 'Đổi quà', tien: '−' + diemDoi, kieu: hang });
      dongBill.push({ ten: 'Cộng đơn này', tien: '+' + diemCong, kieu: hang });
      dongBill.push({ ten: 'Điểm hiện có', tien: (kh.diem - diemDoi + diemCong) + '', kieu: hang + '; font-weight: 700' });
    }
    var maDiem = 'K7M2Q' + String.fromCharCode(65 + (s.soDon % 26));
    var tem = [];
    gio.forEach(function (d) { var m = M[d.id]; if (m.laGoi) return;
      for (var i = 0; i < d.sl; i++) tem.push({ ten: m.ten, moTa: moTa(d) || 'Không tuỳ chỉnh' }); });
    tem = tem.map(function (t, i) { return { so: '0' + s.soDon, thu: (i + 1) + '/' + tem.length, ten: t.ten, moTa: t.moTa }; });

    var buoc = ['Khách', 'Chọn món', 'PIN', 'Thu tiền', 'Hoá đơn & tem'];
    var buocHien = s.man === 'khach' ? 0 : (s.man === 'ban' ? 1 : (s.man === 'pin' ? 2 : (s.man === 'qr' ? 3 : 4)));
    var buocV = buoc.map(function (b, i) {
      var bo = i === 2 && !canPin && s.man !== 'pin';
      var xong = i < buocHien || (s.man === 'xong' && s.daIn);
      var dang = i === buocHien && !(s.man === 'xong' && s.daIn);
      return { ten: (i + 1) + '. ' + b + (bo ? ' (bỏ qua)' : ''),
        kieu: 'flex: 1; padding: 6px 2px; text-align: center; font-size: 11px; font-weight: 600; border-radius: 8px; ' +
          (dang ? 'background: #1C1B1A; color: #FFFFFF' : (xong ? 'background: #E7F2EC; color: #164F35' : 'background: #F2F1EE; color: ' + (bo ? '#9A948A' : '#5F5A52'))) };
    });

    var tomTat = [];
    if (giamKm) tomTat.push('−' + vnd(giamKm));
    var tieuDeXong = toanGiao ? 'Đã xác nhận giao từ gói' : (s.cach === 'ck' ? 'payOS đã xác nhận tiền về' : (conLai === 0 ? 'Đã trừ tài khoản' : 'Đã nhận tiền mặt'));

    return {
      nhom: nhom, mon: mon, luoiKhoa: luoiKhoa,
      lyDoKhoa: s.man === 'xong' ? 'Đơn đã thanh toán — bấm In hoá đơn + tem để kết thúc giao dịch.' : 'Đang thu tiền đơn #0' + s.soDon + ' — xong hoặc huỷ để bán tiếp.',
      buoc: buocV, coBao: !!s.bao && s.man === 'ban', bao: s.bao || '',
      coGiu: s.pinOk && giuCt.length > 0 && s.man !== 'xong',
      nhanGiu: 'Đang GIỮ ' + giuCt.join(' + ') + ' — chưa trừ. Trừ thật khi tiền về; huỷ thì tự nhả.',

      dangChon: dangChon, khung: khung,

      hienThanhKhach: s.man === 'ban', chuaKhach: !kh,
      tim: s.tim,
      goTim: function (e) { dat({ tim: e && e.target ? e.target.value : '' }); },
      coGoiY: !kh && s.tim.trim().length > 0,
      quetThe: function () { dat({ khach: 'hoa', tim: '', dungTK: true, dungMe: false, km: null }); },
      dsKhach: ['hoa', 'minh', 'lan'].filter(function (id) { var k = KHACH[id], q = s.tim.trim().toLowerCase(); if (!q) return false;
          var so = q.replace(/[^0-9]/g, ''); return k.ten.toLowerCase().indexOf(q) >= 0 || (so && k.sdt.replace(/[^0-9]/g, '').indexOf(so) >= 0) || (so && '0912123 0987456 0903789'.indexOf(so) >= 0 && (id === 'hoa' ? '0912123' : id === 'minh' ? '0987456' : '0903789').indexOf(so) >= 0); })
        .map(function (id) { var k = KHACH[id];
        return { ten: k.ten, sdt: k.sdt, phu: 'Hạng ' + k.hang + (k.pct ? ' (−' + k.pct + '%)' : '') + ' · tài khoản ' + vnd(k.tk) + ' · ' + k.diem + ' điểm' + (k.goi ? ' · gói còn ' + k.goi + ' túi' : ''),
          chon: function () { dat({ khach: id, tim: '', dungTK: true, dungMe: false, km: null, gio: s.gio.filter(function (d) { return !M[d.id].tuGoi || KHACH[id].goi > 0; }) }); } }; }),
      vungGio: s.man === 'ban',
      coKhach: !!kh,
      tenKhach: kh ? kh.ten + ' · ' + kh.sdt : 'Khách lẻ',
      phuKhach: kh ? 'Hạng ' + kh.hang + (kh.pct ? ' −' + kh.pct + '%' : '') + ' · tài khoản ' + vnd(kh.tk) + ' · ' + kh.diem + ' điểm' : 'Chọn khách để có giá hạng, tích điểm, dùng tài khoản',
      nhanNutKhach: kh ? 'Đổi khách' : 'Chọn khách',
      moKhach: function () { dat({ khach: null, tim: '' }); },
      boKhach: function () { dat({ khach: null, tim: '', km: s.km && s.km.loai === 'ma' ? s.km : null, gio: s.gio.filter(function (d) { return !M[d.id].tuGoi; }) }); },
      gioTrong: gio.length === 0, coGio: gio.length > 0, gio: gioV,
      batUuDai: function () { dat({ uuDai: !s.uuDai }); }, moUuDai: s.uuDai,
      nhanUuDai: kh && kh.diem > 0 ? '＋ Ưu đãi · đổi điểm' : '＋ Ưu đãi · mã giảm giá',
      tomTatUuDai: tomTat.length ? tomTat.join(' · ') : (kh && kh.diem > 0 ? 'khách có ' + kh.diem + ' điểm' : 'mở khi cần'),
      nhanDiem: kh ? 'Đổi điểm lấy quà · khách có ' + kh.diem + ' điểm' : '',
      qua: qua,
      coGhiChuKm: !!ghiChuKm, ghiChuKm: ghiChuKm,
      chonMa: function () { chonKm({ loai: 'ma', id: 'm' }); },
      nhanMa: s.km && s.km.loai === 'ma' ? '✓ THANG10 (bấm để gỡ)' : 'Nhập mã: THANG10 (mã demo, cộng với giảm hạng)',
      kieuMa: chip(s.km && s.km.loai === 'ma'),
      dongTien: dongTien, conLai: vnd(conLai),
      coNhacPin: canPin, nhacPin: 'Đơn có dùng tài khoản/điểm → khách nhập PIN trước khi thu',
      baNut: gio.length > 0 && !toanGiao && conLai > 0 && !(s.giao && !(s.phiGiao > 0)),
      motNut: gio.length > 0 && (toanGiao || conLai === 0) && !(s.giao && !(s.phiGiao > 0)),
      toTien: toTien,
      chonCK: function () { batDauTra('ck', 0); },
      nhanMotNut: toanGiao ? 'Xác nhận giao từ gói' : 'Trả đủ bằng tài khoản',
      bamMotNut: function () { batDauTra(toanGiao ? 'giao' : 'tk', 0); },

      vungPin: s.man === 'pin',
      lyDoPin: 'Khách nhập PIN để dùng: ' + giuCt.join(' + '),
      chamPin: [0, 1, 2, 3].map(function (i) { return { kieu: 'width: 20px; height: 20px; border-radius: 10px; border: 2px solid #1F4E79; background: ' + (i < s.pin.length ? '#1F4E79' : '#FFFFFF') }; }),
      baoPin: s.pinSai ? 'Sai PIN — còn ' + (5 - s.pinSai) + ' lần thử' : '',
      phim: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'xoa'].map(function (k) {
        return { ten: k === 'xoa' ? 'Xoá' : k, bam: function () { if (k !== '') bamPin(k); },
          kieu: 'height: 60px; border-radius: 12px; font-size: ' + (k === 'xoa' ? '14px' : '24px') + '; font-weight: 600; border: ' + (k === '' ? 'none; background: transparent' : '1px solid #C9C4BA; background: #FFFFFF; color: #1C1B1A') };
      }),
      huyPin: function () { veGio(null); },

      vungQR: s.man === 'qr',
      qrLon: taoQR(s.soDon * 31 + conLai, 9),
      tienQR: vnd(conLai), noiDungCK: 'TQD0' + s.soDon,
      giaLapTienVe: function () { daTra('ck'); },
      giaLapHetHan: function () { veGio('QR đơn #0' + s.soDon + ' hết hạn — không có tiền về.' + (giuCt.length && s.pinOk ? ' Đã nhả ' + giuCt.join(' + ') + ' đang giữ, tài khoản khách nguyên vẹn.' : '')); },
      huyQR: function () { veGio(giuCt.length && s.pinOk ? 'Đã huỷ chuyển khoản — đã nhả ' + giuCt.join(' + ') + ' đang giữ.' : 'Đã huỷ chuyển khoản.'); },


      // ---- số khác (tiền mặt)
      moSoKhac: s.moSoKhac,
      batSoKhac: function () { dat({ moSoKhac: !s.moSoKhac, soKhac: '' }); },
      soKhacHien: s.soKhac ? vnd(parseInt(s.soKhac, 10)) : '0đ',
      traLaiSoKhac: (function () { var v = parseInt(s.soKhac || '0', 10); return v >= conLai ? 'Trả lại ' + vnd(v - conLai) : 'Còn thiếu ' + vnd(conLai - v); })(),
      duSoKhac: parseInt(s.soKhac || '0', 10) >= conLai,
      chuaDuSoKhac: parseInt(s.soKhac || '0', 10) < conLai,
      phimSo: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'xoa'].map(function (k) {
        return { ten: k === 'xoa' ? 'Xoá' : k, bam: function () {
          var v = k === 'xoa' ? s.soKhac.slice(0, -1) : (s.soKhac + k).replace(/^0+/, '');
          if (v.length > 8) return; dat({ soKhac: v }); },
          kieu: 'height: 52px; border-radius: 10px; font-size: ' + (k === 'xoa' ? '14px' : '20px') + '; font-weight: 600; border: 1px solid #C9C4BA; background: #FFFFFF; color: #1C1B1A' };
      }),
      xacNhanSoKhac: function () { var v = parseInt(s.soKhac || '0', 10); if (v >= conLai) { dat({ moSoKhac: false }); batDauTra('tm', v); } },
      kieuXacNhanSoKhac: 'min-height: 52px; border-radius: 12px; border: none; font-size: 16px; font-weight: 700; ' + (parseInt(s.soKhac || '0', 10) >= conLai ? 'background: #1F6F4A; color: #FFFFFF' : 'background: #ECEAE5; color: #6B655C'),
      // ---- giao hàng Ahamove
      giao: s.giao, khongGiao: !s.giao,
      hinhThuc: [[false, 'Mang đi / tại quán'], [true, 'Giao hàng · Ahamove']].map(function (x) {
        return { ten: x[1], kieu: 'flex: 1; min-height: 46px; border-radius: 10px; font-size: 14px; font-weight: 600; border: 1px solid ' + (s.giao === x[0] ? '#1C1B1A; background: #1C1B1A; color: #FFFFFF' : '#D6D2CA; background: #FFFFFF; color: #1C1B1A'),
          chon: function () { dat({ giao: x[0], phiGiao: x[0] ? s.phiGiao : 0 }); } }; }),
      diaChi: s.diaChi,
      goDiaChi: function (e) { dat({ diaChi: e && e.target ? e.target.value : '', phiGiao: 0 }); },
      dienMau: function () { dat({ diaChi: '12 Nguyễn Trãi, P. Bến Thành, Q.1 · Chị Hoa 0912 ••• 123', phiGiao: 0 }); },
      tinhPhi: function () { if ((s.diaChi || '').trim().length > 5) dat({ phiGiao: 23000 }); },
      daCoPhi: s.giao && s.phiGiao > 0, chuaCoPhi: s.giao && !(s.phiGiao > 0),
      nhanPhi: 'Phí Ahamove: ' + vnd(s.phiGiao) + ' · xe máy · khoảng 25 phút (số demo)',
      khoaThuGiao: s.giao && !(s.phiGiao > 0),
      // ---- điểm
      coKhachDiem: !!kh && !toanGiao,
      dongDiem: kh ? 'Điểm: ' + kh.diem + (diemDoi ? ' − ' + diemDoi + ' (đổi quà)' : '') + ' + ' + diemCong + ' (đơn này) = ' + (kh.diem - diemDoi + diemCong) + ' điểm' : '',
      coLeDiem: !kh && !toanGiao && gio.length > 0,
      dongDiemLe: 'Khách lẻ: đơn này được +' + diemCong + ' điểm — nhận bằng mã in trên hoá đơn',
      quyTacDiem: '1 điểm / 10.000đ (theo Cài đặt) · chỉ tính tiền khách trả thật (tiền mặt / chuyển khoản), không tính phần trừ tài khoản và phí giao',
      diemCongBill: '+' + diemCong + ' điểm',
      // ---- giao trên hoá đơn & màn xong
      coGiaoBill: s.giao, giaoBill: 'GIAO HÀNG: ' + (s.diaChi || ''),
      xeChuaGoi: s.giao && !s.xe, xeDaGoi: s.giao && !!s.xe,
      goiXe: function () { dat({ xe: 'AHM-' + (40000 + s.soDon * 7) }); },
      nhanXe: s.xe ? 'Đã đặt xe Ahamove · mã chuyến ' + s.xe + ' · đang tìm tài xế (demo). Theo dõi ở Lịch sử đơn.' : '',
      vungXong: s.man === 'xong',
      tieuDeXong: tieuDeXong,
      coTraLai: s.cach === 'tm' && s.dua > conLai, traLai: vnd(Math.max(0, s.dua - conLai)),
      soDon: '0' + s.soDon,
      dongBill: dongBill,
      qrBill: taoQR(4242, 4),
      tabXem: [[1, 'Hoá đơn · tờ khách'], [2, 'Hoá đơn · tờ lưu'], [3, 'Tem ly (' + tem.length + ')']].filter(function (l) { return !(l[0] === 2 && s.soTo === 1) && !(l[0] === 3 && tem.length === 0); }).map(function (l) {
        return { ten: l[1], kieu: chip(s.xem === l[0]), chon: function () { dat({ xem: l[0] }); } }; }),
      xemBill: s.xem !== 3, xemTem: s.xem === 3,
      nhanLien: s.xem === 2 ? 'LƯU QUẦY' : 'GIAO KHÁCH',
      coMaDiem: !kh && !toanGiao, maDiem: maDiem,
      chuQR: kh ? 'Quét để mở web Tứ Quý Đường' : 'Quét để đăng ký tài khoản — mã điểm điền sẵn',
      chanBill: s.xem === 2 ? 'Tờ lưu quầy — không đưa khách' : (kh ? 'Cảm ơn ' + kh.ten + '!' : 'Cảm ơn quý khách!'),
      tem: tem,
      chonSoTo: [[2, '2 tờ'], [1, '1 tờ']].map(function (x) { return { ten: x[1], kieu: chip(s.soTo === x[0]), chon: function () { dat({ soTo: x[0], xem: 1 }); } }; }),
      chuaIn: !s.daIn, daIn: s.daIn,
      nhanIn: 'In hoá đơn (' + s.soTo + ' tờ)' + (tem.length ? ' + ' + tem.length + ' tem' : ''),
      inBill: function () { dat({ daIn: true, cham: s.cham + 1 }); },
      tomTatIn: 'Đã gửi lệnh in: ' + s.soTo + ' tờ hoá đơn' + (tem.length ? ' (máy bill) + ' + tem.length + ' tem (máy tem)' : '') + '. Nhân viên bấm ' + (s.cham) + ' lần cho thanh toán + in.',
      donMoi: function () { self.setState(batDauDonMoi()); },

      trangMon: s.trang === 'mon' && s.man === 'ban',
      trangGio: !(s.trang === 'mon' && s.man === 'ban'),
      nhanGio: gio.length ? 'Xem giỏ · ' + gio.reduce(function (a, d) { return a + d.sl; }, 0) + ' món · ' + vnd(conLai) : 'Giỏ trống — chạm món để thêm',
      khongGioNho: gio.length === 0,
      moGio: function () { dat({ trang: 'gio' }); },
      veMon: function () { dat({ trang: 'mon' }); },
      tieuDePhai: 'Giỏ & thanh toán',
      coVe: s.man === 'ban'
    };
  }
}
