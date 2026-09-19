#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DONG TIEN DO v2 — doan chep vao CUOI moi patch, chay SAU khi patch da ghi file xong.

Vi sao can: 10 tren 27 loi cu chi lo ra khi chu quan hoi lai, va da co lan
"so ghi 13 ma liet ke 15". Nguyen nhan chung: so viec giu bang TAY va bang TRI NHO.
Tep TIEN_DO_<HE>.json la nguon su that duy nhat, va patch tu danh dau viec cua
chinh no — khong ai phai nho.

TEP SO VIEC
    TIEN_DO_SX.json    dat o goc kho SX   (ngang hang server.js)
    TIEN_DO_POS.json   dat o goc kho POS  (ngang hang package.json)
  Script TU TIM, khong can khai bao. Moi kho chi duoc co DUNG MOT tep.

CACH DUNG trong patch:
    from dong_tien_do import ghi_tien_do
    ...cuoi ham main(), sau khi da ghi file thanh cong:
    ghi_tien_do("S4", "SX-CUAKHO-v1")

XEM NHANH:  python3 dong_tien_do.py

AN TOAN
  · Khong thay tep so viec      -> in canh bao, KHONG lam hong patch
  · Thay 2 tep cung luc         -> tu choi (khong doan bua)
  · CHAY NHAM CUA SO            -> tu choi. Patch ma "SX-..." ma tep la POS
                                   (hoac nguoc lai) thi bao ro va khong ghi gi.
  · Khong thay ma viec          -> tu choi, KHONG tu them dong moi (tranh bia viec)
  · Da danh dau xong roi        -> bo qua, khong ghi de ngay cu
  · Ghi qua tep tam roi doi ten -> dut dien giua chung khong mat tep
"""

import io
import json
import os
import glob
import datetime


def tim_tep():
    """Tim tep so viec o thu muc hien tai. Tra (duong_dan, loi)."""
    ds = sorted(set(glob.glob("TIEN_DO_*.json") + glob.glob("TIEN_DO.json")))
    if not ds:
        return None, "khong thay tep TIEN_DO_SX.json / TIEN_DO_POS.json o thu muc nay"
    if len(ds) > 1:
        return None, "thay %d tep so viec (%s) — moi kho chi duoc co MOT" % (len(ds), ", ".join(ds))
    return ds[0], None


def _doc(tep):
    with io.open(tep, encoding="utf-8") as f:
        return json.load(f)


def _ghi(tep, d):
    tam = tep + ".dangghi"
    with io.open(tam, "w", encoding="utf-8") as f:
        f.write(json.dumps(d, ensure_ascii=False, indent=2))
        f.write("\n")
    os.replace(tam, tep)


def ghi_tien_do(ma_viec, ma_patch, commit=None):
    """Danh dau mot viec la xong. Tra True neu co ghi, False neu khong."""
    tep, loi = tim_tep()
    if loi:
        print("  [tien do] %s — bo qua (patch van xong)" % loi)
        return False

    try:
        d = _doc(tep)
    except Exception as e:
        print("  [tien do] %s doc khong duoc (%s) — bo qua" % (tep, e))
        return False

    he = str(d.get("he", "")).upper()

    # Chay nham cua so Replit: patch POS chay trong kho SX hoac nguoc lai.
    he_patch = str(ma_patch).split("-")[0].upper()
    if he_patch in ("SX", "POS") and he in ("SX", "POS") and he_patch != he:
        print("  [tien do] DUNG LAI: patch %s la cua he %s, nhung so viec o day la %s."
              % (ma_patch, he_patch, he))
        print("            Rat co the ban dang chay patch trong CUA SO SAI — kiem lai truoc khi di tiep.")
        return False

    ds = d.get("viec", [])
    dong = next((v for v in ds if v.get("ma") == ma_viec), None)
    if dong is None:
        print("  [tien do] khong thay ma viec %s trong %s — bo qua." % (ma_viec, tep))
        print("            (patch KHONG tu them viec moi: them tay roi chay lai)")
        return False

    if dong.get("trang_thai") == "xong":
        print("  [tien do] %s da danh dau xong tu %s — giu nguyen" % (ma_viec, dong.get("ngay")))
        return False

    dong["trang_thai"] = "xong"
    dong["patch"] = ma_patch
    dong["ngay"] = datetime.date.today().isoformat()
    if commit:
        dong["commit"] = commit
    d["cap_nhat"] = dong["ngay"]
    d["phien_ban_so"] = int(d.get("phien_ban_so", 0)) + 1
    _ghi(tep, d)

    con = sum(1 for v in ds if v.get("trang_thai") != "xong")
    print("  [tien do] %s -> XONG (%s) trong %s. Con %d viec dang mo."
          % (ma_viec, ma_patch, tep, con))
    return True


def in_tom_tat():
    tep, loi = tim_tep()
    if loi:
        print("Khong xem duoc: %s" % loi)
        return
    d = _doc(tep)
    print("\n%s — %s — cap nhat %s" % (tep, d.get("he", "?"), d.get("cap_nhat", "?")))
    for v in d.get("viec", []):
        dau = "x" if v.get("trang_thai") == "xong" else " "
        them = ""
        if v.get("trang_thai") == "xong":
            them = "  (%s · %s)" % (v.get("patch") or "?", v.get("ngay") or "?")
        elif v.get("trang_thai") != "dang_mo":
            them = "  [%s]" % v.get("trang_thai")
        print("  [%s] %-4s %s%s" % (dau, v.get("ma"), v.get("ten", "")[:68], them))
    con = sum(1 for v in d.get("viec", []) if v.get("trang_thai") != "xong")
    print("  -> %d viec dang mo\n" % con)


if __name__ == "__main__":
    in_tom_tat()
