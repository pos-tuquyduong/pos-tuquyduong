class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { v: this.macDinh(), an: {}, mau: 'quen', lien: 1, daLuu: false };
  }
  macDinh() {
    return {
      ten_quan: 'TỨ QUÝ ĐƯỜNG', dia_chi: '[Địa chỉ quán] · [SĐT quán]', so_bill: 'SỐ BILL', lien_khach: 'GIAO KHÁCH', lien_luu: 'LƯU QUẦY',
      chu_qr: 'Quét để đăng ký tài khoản — mã điểm điền sẵn',
      gia_goc: 'Giá gốc', giam_hang: 'Giảm hạng {hang} {phan_tram}%', phi_giao: 'Phí giao Ahamove', tong: 'TỔNG HÓA ĐƠN',
      tieu_de_tt: 'THANH TOÁN', tu_tk: 'Từ tài khoản', ck: 'Chuyển khoản (payOS)', tm: 'Tiền mặt', dua_tra: 'Khách đưa / Trả lại',
      tieu_de_diem: 'ĐIỂM THƯỞNG', diem_truoc: 'Điểm trước đơn', diem_cong: 'Cộng đơn này', diem_co: 'Điểm hiện có',
      ma_diem: 'MÃ NHẬN ĐIỂM · +{diem} điểm (nhập trong 24 giờ)',
      cam_on: 'Cảm ơn {ten_khach}!', chinh_sach: 'Ly có vấn đề? Báo quầy trong ngày để đổi.', ghi_chu: ''
    };
  }
  renderVals() {
    var s = this.state, self = this;
    var dat = function (o) { self.setState(o); };
    var NHOM = [
      ['Đầu hoá đơn', [['ten_quan', 'Tên quán'], ['dia_chi', 'Địa chỉ · SĐT'], ['so_bill', 'Chữ trên số bill'], ['lien_khach', 'Nhãn tờ khách'], ['lien_luu', 'Nhãn tờ lưu'], ['chu_qr', 'Chữ cạnh QR']]],
      ['Tiền hàng', [['gia_goc', 'Dòng giá gốc'], ['giam_hang', 'Dòng giảm hạng'], ['phi_giao', 'Dòng phí giao'], ['tong', 'Dòng tổng']]],
      ['Thanh toán', [['tieu_de_tt', 'Tiêu đề mục'], ['tu_tk', 'Trả từ tài khoản'], ['ck', 'Chuyển khoản'], ['tm', 'Tiền mặt'], ['dua_tra', 'Khách đưa / trả lại']]],
      ['Điểm thưởng', [['tieu_de_diem', 'Tiêu đề mục'], ['diem_truoc', 'Điểm trước đơn'], ['diem_cong', 'Điểm cộng'], ['diem_co', 'Điểm hiện có'], ['ma_diem', 'Ô mã nhận điểm (khách lẻ)']]],
      ['Chân hoá đơn', [['cam_on', 'Lời cảm ơn'], ['chinh_sach', 'Chính sách'], ['ghi_chu', 'Ghi chú thêm']]]
    ];
    var KHONG_AN = { ten_quan: 1, so_bill: 1, tong: 1, tieu_de_tt: 1, tu_tk: 1, ck: 1, tm: 1 };
    var GIOI_HAN = 42;
    var mau = s.mau === 'quen'
      ? { ten_khach: 'Chị Hoa', hang: 'Vàng', phan_tram: '10', diem: '1' }
      : { ten_khach: 'quý khách', hang: '', phan_tram: '0', diem: '7' };
    var dien = function (key) {
      var t = s.v[key] || '';
      return t.replace(/\{ten_khach\}/g, mau.ten_khach).replace(/\{hang\}/g, mau.hang).replace(/\{phan_tram\}/g, mau.phan_tram).replace(/\{diem\}/g, mau.diem);
    };
    var hien = function (key) { return !s.an[key] && (s.v[key] || '').trim().length > 0; };

    var nhom = NHOM.map(function (n) {
      return { ten: n[0], dong: n[1].map(function (d) {
        var key = d[0], dai = (s.v[key] || '').length;
        return { nhan: d[1], gia: s.v[key], key: key,
          go: function (e) { var nv = Object.assign({}, s.v); nv[key] = e && e.target ? e.target.value : ''; dat({ v: nv, daLuu: false }); },
          coAn: !KHONG_AN[key], an: !!s.an[key],
          nutAn: s.an[key] ? 'Đang ẩn' : 'Hiện',
          kieuAn: 'min-height: 40px; min-width: 84px; border-radius: 20px; font-size: 13px; border: 1px solid ' + (s.an[key] ? '#D6D2CA; background: #F2F1EE; color: #6B655C' : '#1F6F4A; background: #E7F2EC; color: #164F35; font-weight: 600'),
          batAn: function () { var a = Object.assign({}, s.an); a[key] = !a[key]; dat({ an: a, daLuu: false }); },
          dem: dai + '/' + GIOI_HAN, qua: dai > GIOI_HAN,
          kieuDem: 'font-size: 11px; color: ' + (dai > GIOI_HAN ? '#B42318; font-weight: 700' : '#8A847A')
        };
      }) };
    });

    var hang = 'display: flex; justify-content: space-between; gap: 8px';
    var t = [];
    t.push({ ten: dien('gia_goc'), tien: '72.000đ', kieu: hang, hien: hien('gia_goc') });
    if (s.mau === 'quen') t.push({ ten: dien('giam_hang'), tien: '−7.200đ', kieu: hang, hien: hien('giam_hang') });
    t.push({ ten: dien('phi_giao'), tien: '+23.000đ', kieu: hang, hien: hien('phi_giao') });
    t.push({ ten: dien('tong'), tien: s.mau === 'quen' ? '87.800đ' : '95.000đ', kieu: hang + '; font-weight: 700; font-size: 15px; border-top: 1px solid #1C1B1A; padding-top: 4px', hien: true });
    t.push({ ten: dien('tieu_de_tt'), tien: '', kieu: hang + '; font-size: 11px; font-weight: 700; color: #5F5A52; border-top: 1px dashed #8A847A; padding-top: 6px; margin-top: 6px', hien: true });
    if (s.mau === 'quen') t.push({ ten: dien('tu_tk'), tien: '50.000đ', kieu: hang, hien: true });
    t.push({ ten: dien('tm'), tien: s.mau === 'quen' ? '37.800đ' : '95.000đ', kieu: hang, hien: true });
    t.push({ ten: dien('dua_tra'), tien: s.mau === 'quen' ? '50.000đ / 12.200đ' : '100.000đ / 5.000đ', kieu: hang, hien: hien('dua_tra') });
    if (s.mau === 'quen') {
      t.push({ ten: dien('tieu_de_diem'), tien: '', kieu: hang + '; font-size: 11px; font-weight: 700; color: #5F5A52; border-top: 1px dashed #8A847A; padding-top: 6px; margin-top: 6px', hien: hien('tieu_de_diem') });
      t.push({ ten: dien('diem_truoc'), tien: '320', kieu: hang, hien: hien('diem_truoc') });
      t.push({ ten: dien('diem_cong'), tien: '+1', kieu: hang, hien: hien('diem_cong') });
      t.push({ ten: dien('diem_co'), tien: '321', kieu: hang + '; font-weight: 700', hien: hien('diem_co') });
    }
    var chip = function (on) { return 'min-height: 40px; padding: 0 14px; border-radius: 20px; font-size: 13px; border: 1px solid ' + (on ? '#1C1B1A; background: #1C1B1A; color: #FFFFFF' : '#D6D2CA; background: #FFFFFF; color: #1C1B1A'); };
    var qr = [], seed = 4242;
    for (var r = 0; r < 21; r++) for (var c = 0; c < 21; c++) {
      var f = (r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7), den;
      if (f) { var rr = r % 14 > 6 ? r - 14 : r, cc = c > 13 ? c - 14 : c; rr = r > 13 ? r - 14 : r; den = rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4); }
      else { seed = (seed * 1103515245 + 12345) % 2147483648; den = (seed >> 16) % 2 === 0; }
      qr.push({ kieu: 'width: 4px; height: 4px; background: ' + (den ? '#1C1B1A' : '#FFFFFF') });
    }
    return {
      nhom: nhom,
      mauKhach: [['quen', 'Xem với khách quen'], ['le', 'Xem với khách lẻ']].map(function (x) { return { ten: x[1], kieu: chip(s.mau === x[0]), chon: function () { dat({ mau: x[0] }); } }; }),
      mauLien: [[1, 'Tờ khách'], [2, 'Tờ lưu']].map(function (x) { return { ten: x[1], kieu: chip(s.lien === x[0]), chon: function () { dat({ lien: x[0] }); } }; }),
      tenQuan: dien('ten_quan'), diaChi: dien('dia_chi'), coDiaChi: hien('dia_chi'),
      soBill: dien('so_bill'), nhanLien: s.lien === 1 ? dien('lien_khach') : dien('lien_luu'), coNhanLien: s.lien === 1 ? hien('lien_khach') : hien('lien_luu'),
      chuQR: dien('chu_qr'), coChuQR: hien('chu_qr'), qr: qr,
      khach: s.mau === 'quen' ? 'Chị Hoa · 0912 ••• 123' : 'Khách lẻ',
      giaoBill: 'GIAO HÀNG: 12 Nguyễn Trãi, Q.1', 
      dong: t.filter(function (x) { return x.hien; }),
      coMaDiem: s.mau === 'le' && hien('ma_diem'), maDiem: dien('ma_diem'),
      camOn: dien('cam_on'), coCamOn: hien('cam_on') && s.lien === 1,
      chinhSach: dien('chinh_sach'), coChinhSach: hien('chinh_sach') && s.lien === 1,
      ghiChu: dien('ghi_chu'), coGhiChu: hien('ghi_chu'),
      khoiPhuc: function () { dat({ v: self.macDinh(), an: {}, daLuu: false }); },
      luu: function () { dat({ daLuu: true }); },
      daLuu: s.daLuu,
      coQuaDai: nhom.some(function (n) { return n.dong.some(function (d) { return d.qua; }); })
    };
  }
}
