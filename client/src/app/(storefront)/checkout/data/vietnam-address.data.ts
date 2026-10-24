export interface WardItem {
  id: string;
  name: string;
}

export interface DistrictItem {
  id: string;
  name: string;
  wards: WardItem[];
}

export interface ProvinceItem {
  id: string;
  name: string;
  districts: DistrictItem[];
}

export const VIETNAM_ADDRESSES: ProvinceItem[] = [
  {
    id: "hcm",
    name: "TP. Hồ Chí Minh",
    districts: [
      {
        id: "q1",
        name: "Quận 1",
        wards: [
          { id: "bn", name: "Phường Bến Nghé" },
          { id: "bt", name: "Phường Bến Thành" },
          { id: "dk", name: "Phường Đa Kao" },
          { id: "td", name: "Phường Tân Định" },
          { id: "pnl", name: "Phường Phạm Ngũ Lão" },
          { id: "nct", name: "Phường Nguyễn Cư Trinh" },
          { id: "ck", name: "Phường Cầu Kho" },
          { id: "col", name: "Phường Cầu Ông Lãnh" },
          { id: "cg", name: "Phường Cô Giang" },
        ],
      },
      {
        id: "q3",
        name: "Quận 3",
        wards: [
          { id: "vts", name: "Phường Võ Thị Sáu" },
          { id: "p1", name: "Phường 1" },
          { id: "p2", name: "Phường 2" },
          { id: "p3", name: "Phường 3" },
          { id: "p4", name: "Phường 4" },
          { id: "p5", name: "Phường 5" },
          { id: "p9", name: "Phường 9" },
          { id: "p11", name: "Phường 11" },
          { id: "p14", name: "Phường 14" },
        ],
      },
      {
        id: "q5",
        name: "Quận 5",
        wards: [
          { id: "q5_p1", name: "Phường 1" },
          { id: "q5_p2", name: "Phường 2" },
          { id: "q5_p4", name: "Phường 4" },
          { id: "q5_p7", name: "Phường 7" },
          { id: "q5_p10", name: "Phường 10" },
          { id: "q5_p12", name: "Phường 12" },
        ],
      },
      {
        id: "q7",
        name: "Quận 7",
        wards: [
          { id: "tp", name: "Phường Tân Phong" },
          { id: "pm", name: "Phường Phú Mỹ" },
          { id: "ttd", name: "Phường Tân Thuận Đông" },
          { id: "ttt", name: "Phường Tân Thuận Tây" },
          { id: "tk", name: "Phường Tân Kiểng" },
          { id: "tq", name: "Phường Tân Quy" },
          { id: "tphu", name: "Phường Tân Phú" },
        ],
      },
      {
        id: "q10",
        name: "Quận 10",
        wards: [
          { id: "q10_p1", name: "Phường 1" },
          { id: "q10_p2", name: "Phường 2" },
          { id: "q10_p6", name: "Phường 6" },
          { id: "q10_p10", name: "Phường 10" },
          { id: "q10_p12", name: "Phường 12" },
          { id: "q10_p14", name: "Phường 14" },
        ],
      },
      {
        id: "binh-thanh",
        name: "Quận Bình Thạnh",
        wards: [
          { id: "bt_p1", name: "Phường 1" },
          { id: "bt_p2", name: "Phường 2" },
          { id: "bt_p11", name: "Phường 11" },
          { id: "bt_p15", name: "Phường 15" },
          { id: "bt_p19", name: "Phường 19" },
          { id: "bt_p21", name: "Phường 21" },
          { id: "bt_p25", name: "Phường 25" },
          { id: "bt_p26", name: "Phường 26" },
        ],
      },
      {
        id: "phu-nhuan",
        name: "Quận Phú Nhuận",
        wards: [
          { id: "pn_p1", name: "Phường 1" },
          { id: "pn_p2", name: "Phường 2" },
          { id: "pn_p7", name: "Phường 7" },
          { id: "pn_p9", name: "Phường 9" },
          { id: "pn_p11", name: "Phường 11" },
          { id: "pn_p15", name: "Phường 15" },
        ],
      },
      {
        id: "tan-binh",
        name: "Quận Tân Bình",
        wards: [
          { id: "tb_p1", name: "Phường 1" },
          { id: "tb_p2", name: "Phường 2" },
          { id: "tb_p4", name: "Phường 4" },
          { id: "tb_p12", name: "Phường 12" },
          { id: "tb_p13", name: "Phường 13" },
          { id: "tb_p15", name: "Phường 15" },
        ],
      },
      {
        id: "thu-duc",
        name: "TP. Thủ Đức",
        wards: [
          { id: "td_td", name: "Phường Thảo Điền" },
          { id: "td_ap", name: "Phường An Phú" },
          { id: "td_tt", name: "Phường Thủ Thiêm" },
          { id: "td_hbc", name: "Phường Hiệp Bình Chánh" },
          { id: "td_hbp", name: "Phường Hiệp Bình Phước" },
          { id: "td_lt", name: "Phường Linh Trung" },
          { id: "td_lc", name: "Phường Linh Chiểu" },
          { id: "td_pla", name: "Phường Phước Long A" },
          { id: "td_plb", name: "Phường Phước Long B" },
          { id: "td_tnpa", name: "Phường Tăng Nhơn Phú A" },
        ],
      },
      {
        id: "go-vap",
        name: "Quận Gò Vấp",
        wards: [
          { id: "gv_p1", name: "Phường 1" },
          { id: "gv_p3", name: "Phường 3" },
          { id: "gv_p5", name: "Phường 5" },
          { id: "gv_p8", name: "Phường 8" },
          { id: "gv_p10", name: "Phường 10" },
          { id: "gv_p12", name: "Phường 12" },
          { id: "gv_p14", name: "Phường 14" },
        ],
      },
      {
        id: "binh-chanh",
        name: "Huyện Bình Chánh",
        wards: [
          { id: "bc_tt", name: "Thị trấn Tân Túc" },
          { id: "bc_bh", name: "Xã Bình Hưng" },
          { id: "bc_vla", name: "Xã Vĩnh Lộc A" },
          { id: "bc_vlb", name: "Xã Vĩnh Lộc B" },
          { id: "bc_pp", name: "Xã Phong Phú" },
        ],
      },
    ],
  },
  {
    id: "hn",
    name: "Hà Nội",
    districts: [
      {
        id: "ba-dinh",
        name: "Quận Ba Đình",
        wards: [
          { id: "bd_gv", name: "Phường Giảng Võ" },
          { id: "bd_km", name: "Phường Kim Mã" },
          { id: "bd_lg", name: "Phường Liễu Giai" },
          { id: "bd_nk", name: "Phường Ngọc Khánh" },
          { id: "bd_tc", name: "Phường Thành Công" },
          { id: "bd_dc", name: "Phường Đội Cấn" },
          { id: "bd_tb", name: "Phường Trúc Bạch" },
        ],
      },
      {
        id: "hoan-kiem",
        name: "Quận Hoàn Kiếm",
        wards: [
          { id: "hk_tt", name: "Phường Tràng Tiền" },
          { id: "hk_hb", name: "Phường Hàng Bạc" },
          { id: "hk_hg", name: "Phường Hàng Gai" },
          { id: "hk_cn", name: "Phường Cửa Nam" },
          { id: "hk_dx", name: "Phường Đồng Xuân" },
          { id: "hk_ht", name: "Phường Hàng Trống" },
          { id: "hk_cd", name: "Phường Chương Dương" },
        ],
      },
      {
        id: "cau-giay",
        name: "Quận Cầu Giấy",
        wards: [
          { id: "cg_dv", name: "Phường Dịch Vọng" },
          { id: "cg_dvh", name: "Phường Dịch Vọng Hậu" },
          { id: "cg_md", name: "Phường Mai Dịch" },
          { id: "cg_nd", name: "Phường Nghĩa Đô" },
          { id: "cg_nt", name: "Phường Nghĩa Tân" },
          { id: "cg_qh", name: "Phường Quan Hoa" },
          { id: "cg_th", name: "Phường Trung Hòa" },
          { id: "cg_yh", name: "Phường Yên Hòa" },
        ],
      },
      {
        id: "dong-da",
        name: "Quận Đống Đa",
        wards: [
          { id: "dd_lh", name: "Phường Láng Hạ" },
          { id: "dd_lt", name: "Phường Láng Thượng" },
          { id: "dd_ocd", name: "Phường Ô Chợ Dừa" },
          { id: "dd_kl", name: "Phường Kim Liên" },
          { id: "dd_cl", name: "Phường Cát Linh" },
          { id: "dd_tl", name: "Phường Trung Liệt" },
          { id: "dd_vm", name: "Phường Văn Miếu" },
        ],
      },
      {
        id: "hai-ba-trung",
        name: "Quận Hai Bà Trưng",
        wards: [
          { id: "hbt_bk", name: "Phường Bách Khoa" },
          { id: "hbt_bm", name: "Phường Bạch Mai" },
          { id: "hbt_mk", name: "Phường Minh Khai" },
          { id: "hbt_vt", name: "Phường Vĩnh Tuy" },
          { id: "hbt_tn", name: "Phường Thanh Nhàn" },
          { id: "hbt_ldh", name: "Phường Lê Đại Hành" },
        ],
      },
      {
        id: "thanh-xuan",
        name: "Quận Thanh Xuân",
        wards: [
          { id: "tx_nc", name: "Phường Nhân Chính" },
          { id: "tx_km", name: "Phường Khương Mai" },
          { id: "tx_kt", name: "Phường Khương Trung" },
          { id: "tx_txb", name: "Phường Thanh Xuân Bắc" },
          { id: "tx_txt", name: "Phường Thanh Xuân Trung" },
          { id: "tx_td", name: "Phường Thượng Đình" },
        ],
      },
      {
        id: "tay-ho",
        name: "Quận Tây Hồ",
        wards: [
          { id: "th_b", name: "Phường Bưởi" },
          { id: "th_nt", name: "Phường Nhật Tân" },
          { id: "th_pt", name: "Phường Phú Thượng" },
          { id: "th_qa", name: "Phường Quảng An" },
          { id: "th_tk", name: "Phường Thụy Khuê" },
          { id: "th_xl", name: "Phường Xuân La" },
          { id: "th_yp", name: "Phường Yên Phụ" },
        ],
      },
      {
        id: "nam-tu-liem",
        name: "Quận Nam Từ Liêm",
        wards: [
          { id: "ntl_md1", name: "Phường Mỹ Đình 1" },
          { id: "ntl_md2", name: "Phường Mỹ Đình 2" },
          { id: "ntl_mt", name: "Phường Mễ Trì" },
          { id: "ntl_cd", name: "Phường Cầu Diễn" },
          { id: "ntl_pd", name: "Phường Phú Đô" },
          { id: "ntl_tv", name: "Phường Trung Văn" },
          { id: "ntl_tm", name: "Phường Tây Mỗ" },
          { id: "ntl_dm", name: "Phường Đại Mỗ" },
        ],
      },
      {
        id: "bac-tu-liem",
        name: "Quận Bắc Từ Liêm",
        wards: [
          { id: "btl_cn1", name: "Phường Cổ Nhuế 1" },
          { id: "btl_cn2", name: "Phường Cổ Nhuế 2" },
          { id: "btl_xd", name: "Phường Xuân Đỉnh" },
          { id: "btl_xt", name: "Phường Xuân Tảo" },
          { id: "btl_pd", name: "Phường Phú Diễn" },
        ],
      },
      {
        id: "ha-dong",
        name: "Quận Hà Đông",
        wards: [
          { id: "hd_ml", name: "Phường Mộ Lao" },
          { id: "hd_vq", name: "Phường Văn Quán" },
          { id: "hd_vp", name: "Phường Vạn Phúc" },
          { id: "hd_dn", name: "Phường Dương Nội" },
          { id: "hd_kh", name: "Phường Kiến Hưng" },
          { id: "hd_pl", name: "Phường Phúc La" },
        ],
      },
    ],
  },
  {
    id: "dn",
    name: "Đà Nẵng",
    districts: [
      {
        id: "hai-chau",
        name: "Quận Hải Châu",
        wards: [
          { id: "hc_1", name: "Phường Hải Châu 1" },
          { id: "hc_2", name: "Phường Hải Châu 2" },
          { id: "hc_tt", name: "Phường Thạch Thang" },
          { id: "hc_tb", name: "Phường Thanh Bình" },
          { id: "hc_tp", name: "Phường Thuận Phước" },
          { id: "hc_hcb", name: "Phường Hòa Cường Bắc" },
          { id: "hc_hcn", name: "Phường Hòa Cường Nam" },
        ],
      },
      {
        id: "thanh-khe",
        name: "Quận Thanh Khê",
        wards: [
          { id: "tk_tc", name: "Phường Tân Chính" },
          { id: "tk_cg", name: "Phường Chính Gián" },
          { id: "tk_vt", name: "Phường Vĩnh Trung" },
          { id: "tk_tg", name: "Phường Thạc Gián" },
          { id: "tk_xh", name: "Phường Xuân Hà" },
        ],
      },
      {
        id: "son-tra",
        name: "Quận Sơn Trà",
        wards: [
          { id: "st_ahb", name: "Phường An Hải Bắc" },
          { id: "st_aht", name: "Phường An Hải Tây" },
          { id: "st_pm", name: "Phường Phước Mỹ" },
          { id: "st_mt", name: "Phường Mân Thái" },
          { id: "st_tq", name: "Phường Thọ Quang" },
        ],
      },
      {
        id: "ngu-hanh-son",
        name: "Quận Ngũ Hành Sơn",
        wards: [
          { id: "nhs_ma", name: "Phường Mỹ An" },
          { id: "nhs_km", name: "Phường Khuê Mỹ" },
          { id: "nhs_hh", name: "Phường Hòa Hải" },
          { id: "nhs_hq", name: "Phường Hòa Quý" },
        ],
      },
      {
        id: "cam-le",
        name: "Quận Cẩm Lệ",
        wards: [
          { id: "cl_kt", name: "Phường Khuê Trung" },
          { id: "cl_ha", name: "Phường Hòa An" },
          { id: "cl_hx", name: "Phường Hòa Xuân" },
        ],
      },
    ],
  },
  {
    id: "hp",
    name: "Hải Phòng",
    districts: [
      {
        id: "hong-bang",
        name: "Quận Hồng Bàng",
        wards: [
          { id: "hb_hl", name: "Phường Hạ Lý" },
          { id: "hb_hvt", name: "Phường Hoàng Văn Thụ" },
          { id: "hb_mk", name: "Phường Minh Khai" },
          { id: "hb_tl", name: "Phường Thượng Lý" },
        ],
      },
      {
        id: "ngo-quyen",
        name: "Quận Ngô Quyền",
        wards: [
          { id: "nq_cd", name: "Phường Cầu Đất" },
          { id: "nq_dg", name: "Phường Đằng Giang" },
          { id: "nq_lt", name: "Phường Lạch Tray" },
          { id: "nq_gv", name: "Phường Gia Viên" },
        ],
      },
      {
        id: "le-chan",
        name: "Quận Lê Chân",
        wards: [
          { id: "lc_ab", name: "Phường An Biên" },
          { id: "lc_ad", name: "Phường An Dương" },
          { id: "lc_dh", name: "Phường Dư Hàng" },
          { id: "lc_hk", name: "Phường Hàng Kênh" },
        ],
      },
    ],
  },
  {
    id: "ct",
    name: "Cần Thơ",
    districts: [
      {
        id: "ninh-kieu",
        name: "Quận Ninh Kiều",
        wards: [
          { id: "nk_ab", name: "Phường An Bình" },
          { id: "nk_ac", name: "Phường An Cư" },
          { id: "nk_ah", name: "Phường An Hòa" },
          { id: "nk_ak", name: "Phường An Khánh" },
          { id: "nk_ck", name: "Phường Cái Khế" },
          { id: "nk_hl", name: "Phường Hưng Lợi" },
          { id: "nk_xk", name: "Phường Xuân Khánh" },
        ],
      },
      {
        id: "cai-rang",
        name: "Quận Cái Răng",
        wards: [
          { id: "cr_hp", name: "Phường Hưng Phú" },
          { id: "cr_ht", name: "Phường Hưng Thạnh" },
          { id: "cr_lb", name: "Phường Lê Bình" },
          { id: "cr_pt", name: "Phường Phú Thứ" },
        ],
      },
    ],
  },
  {
    id: "bd",
    name: "Bình Dương",
    districts: [
      {
        id: "thu-dau-mot",
        name: "TP. Thủ Dầu Một",
        wards: [
          { id: "tdm_cn", name: "Phường Chánh Nghĩa" },
          { id: "tdm_ht", name: "Phường Hiệp Thành" },
          { id: "tdm_ph", name: "Phường Phú Hòa" },
          { id: "tdm_pl", name: "Phường Phú Lợi" },
          { id: "tdm_pc", name: "Phường Phú Cường" },
        ],
      },
      {
        id: "di-an",
        name: "TP. Dĩ An",
        wards: [
          { id: "da_da", name: "Phường Dĩ An" },
          { id: "da_ab", name: "Phường An Bình" },
          { id: "da_dh", name: "Phường Đông Hòa" },
          { id: "da_tb", name: "Phường Tân Bình" },
        ],
      },
      {
        id: "thuan-an",
        name: "TP. Thuận An",
        wards: [
          { id: "ta_lt", name: "Phường Lái Thiêu" },
          { id: "ta_ap", name: "Phường An Phú" },
          { id: "ta_bc", name: "Phường Bình Chuẩn" },
          { id: "ta_tg", name: "Phường Thuận Giao" },
        ],
      },
    ],
  },
  {
    id: "dong-nai",
    name: "Đồng Nai",
    districts: [
      {
        id: "bien-hoa",
        name: "TP. Biên Hòa",
        wards: [
          { id: "bh_hb", name: "Phường Hòa Bình" },
          { id: "bh_th", name: "Phường Tam Hiệp" },
          { id: "bh_tp", name: "Phường Tân Phong" },
          { id: "bh_tt", name: "Phường Tân Tiến" },
          { id: "bh_thn", name: "Phường Thống Nhất" },
          { id: "bh_lb", name: "Phường Long Bình" },
        ],
      },
      {
        id: "trang-bom",
        name: "Huyện Trảng Bom",
        wards: [
          { id: "tb_tt", name: "Thị trấn Trảng Bom" },
          { id: "tb_bm", name: "Xã Bình Minh" },
          { id: "tb_hn3", name: "Xã Hố Nai 3" },
          { id: "tb_qt", name: "Xã Quảng Tiến" },
        ],
      },
    ],
  },
  {
    id: "quang-ninh",
    name: "Quảng Ninh",
    districts: [
      {
        id: "ha-long",
        name: "TP. Hạ Long",
        wards: [
          { id: "hl_bc", name: "Phường Bãi Cháy" },
          { id: "hl_bd", name: "Phường Bạch Đằng" },
          { id: "hl_hh", name: "Phường Hồng Hải" },
          { id: "hl_ht", name: "Phường Hòn Gai" },
          { id: "hl_tc", name: "Phường Tuần Châu" },
        ],
      },
    ],
  },
  {
    id: "hue",
    name: "Thừa Thiên Huế",
    districts: [
      {
        id: "tp-hue",
        name: "TP. Huế",
        wards: [
          { id: "hue_vn", name: "Phường Vĩnh Ninh" },
          { id: "hue_ph", name: "Phường Phú Hội" },
          { id: "hue_pn", name: "Phường Phú Nhuận" },
          { id: "hue_vd", name: "Phường Vĩ Dạ" },
          { id: "hue_th", name: "Phường Thuận Hòa" },
        ],
      },
    ],
  },
  {
    id: "khanh-hoa",
    name: "Khánh Hòa",
    districts: [
      {
        id: "nha-trang",
        name: "TP. Nha Trang",
        wards: [
          { id: "nt_lt", name: "Phường Lộc Thọ" },
          { id: "nt_tl", name: "Phường Tân Lập" },
          { id: "nt_ph", name: "Phường Phước Hải" },
          { id: "nt_vh", name: "Phường Vĩnh Hải" },
          { id: "nt_vh2", name: "Phường Vĩnh Hòa" },
        ],
      },
    ],
  },
  {
    id: "ba-ria-vung-tau",
    name: "Bà Rịa - Vũng Tàu",
    districts: [
      {
        id: "vung-tau",
        name: "TP. Vũng Tàu",
        wards: [
          { id: "vt_p1", name: "Phường 1" },
          { id: "vt_p2", name: "Phường 2" },
          { id: "vt_p7", name: "Phường 7" },
          { id: "vt_p8", name: "Phường 8" },
          { id: "vt_tt", name: "Phường Thắng Tam" },
        ],
      },
    ],
  },
  {
    id: "lam-dong",
    name: "Lâm Đồng",
    districts: [
      {
        id: "da-lat",
        name: "TP. Đà Lạt",
        wards: [
          { id: "dl_p1", name: "Phường 1" },
          { id: "dl_p2", name: "Phường 2" },
          { id: "dl_p3", name: "Phường 3" },
          { id: "dl_p8", name: "Phường 8" },
          { id: "dl_p10", name: "Phường 10" },
        ],
      },
    ],
  },
  {
    id: "bac-ninh",
    name: "Bắc Ninh",
    districts: [
      {
        id: "tp-bac-ninh",
        name: "TP. Bắc Ninh",
        wards: [
          { id: "bn_dp", name: "Phường Đại Phúc" },
          { id: "bn_sh", name: "Phường Suối Hoa" },
          { id: "bn_nx", name: "Phường Ninh Xá" },
          { id: "bn_vc", name: "Phường Võ Cường" },
        ],
      },
    ],
  },
];


/**
 * Chính sách phí vận chuyển động theo phân vùng địa lý (TrendyFit Dynamic Shipping Rate)
 */
export interface ShippingRate {
  fee: number;
  estimatedDelivery: string;
  zoneName: string;
}

export const FREE_SHIPPING_THRESHOLD = 499000;

export function getShippingRateByProvince(
  provinceIdOrName?: string | null,
  subtotalPrice: number = 0
): ShippingRate {
  // 1. Chính sách khuyến mãi: Đơn hàng từ 499.000 đ trở lên được FREESHIP toàn quốc
  if (subtotalPrice >= FREE_SHIPPING_THRESHOLD) {
    return {
      fee: 0,
      estimatedDelivery: "Giao 1 - 3 ngày",
      zoneName: "Miễn phí vận chuyển (Đơn ≥ 499k)",
    };
  }

  if (!provinceIdOrName) {
    return {
      fee: 30000,
      estimatedDelivery: "Giao 2 - 3 ngày",
      zoneName: "Giao hàng tiêu chuẩn",
    };
  }

  const p = provinceIdOrName.toLowerCase();

  // 2. Phân vùng 1: Nội thành TP.HCM (Nơi đặt kho chính của TrendyFit) -> Phí ship 20.000 đ
  if (
    p === "hcm" ||
    p.includes("hồ chí minh") ||
    p.includes("ho chi minh") ||
    p.includes("hcm") ||
    p.includes("sài gòn")
  ) {
    return {
      fee: 20000,
      estimatedDelivery: "Giao nhanh 1 - 2 ngày",
      zoneName: "Nội thành TP.HCM",
    };
  }

  // 3. Phân vùng 2: Các tỉnh miền Nam lân cận -> Phí ship 25.000 đ
  if (
    p === "bd" ||
    p === "dong-nai" ||
    p === "ba-ria-vung-tau" ||
    p === "ct" ||
    p.includes("bình dương") ||
    p.includes("đồng nai") ||
    p.includes("vũng tàu") ||
    p.includes("cần thơ") ||
    p.includes("long an") ||
    p.includes("tiền giang") ||
    p.includes("tây ninh") ||
    p.includes("bến tre") ||
    p.includes("vĩnh long") ||
    p.includes("hậu giang") ||
    p.includes("sóc trăng") ||
    p.includes("đồng tháp") ||
    p.includes("an giang") ||
    p.includes("kiên giang") ||
    p.includes("bạc liêu") ||
    p.includes("cà mau")
  ) {
    return {
      fee: 25000,
      estimatedDelivery: "Giao 2 - 3 ngày",
      zoneName: "Miền Nam lân cận",
    };
  }

  // 4. Phân vùng 3: Miền Trung & Miền Bắc (Hà Nội, Đà Nẵng, Hải Phòng...) -> Phí ship 35.000 đ
  return {
    fee: 35000,
    estimatedDelivery: "Giao 3 - 4 ngày",
    zoneName: "Miền Trung & Miền Bắc",
  };
}
