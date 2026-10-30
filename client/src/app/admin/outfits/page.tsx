"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { RoleGuard } from "@/components/auth/role-guard";
import { useAdminOutfits } from "../hooks/use-admin-outfits";
import {
  AdminOutfit,
  AdminOutfitItem,
  OUTFIT_SLOT_LABELS,
} from "../validation/admin.validation";
import { formatPrice } from "@/lib/utils";
import { uploadImageApi } from "../api/admin.api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  Plus,
  RefreshCw,
  AlertCircle,
  Search,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Layers,
  Shirt,
  Scissors,
  Upload,
  AlertTriangle,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

const SLOT_ICONS: Record<string, React.ElementType> = {
  TOP: Shirt,
  BOTTOM: Scissors,
  OUTERWEAR: Layers,
};

export default function AdminOutfitsPage() {
  const {
    outfits,
    totalCount,
    products,
    searchQuery,
    setSearchQuery,
    isLoading,
    isError,
    error,
    refetch,
    // Create
    isCreateModalOpen,
    setIsCreateModalOpen,
    createForm,
    setCreateForm,
    createOutfit,
    isCreating,
    // Edit
    isEditModalOpen,
    setIsEditModalOpen,
    outfitToEdit,
    editForm,
    setEditForm,
    openEditModal,
    updateOutfit,
    isUpdating,
    toggleStatus,
    // Delete
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    outfitToDelete,
    openDeleteModal,
    confirmDelete,
    isDeleting,
  } = useAdminOutfits();

  // Upload image state
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Helper upload ảnh bìa
  const handleUploadBanner = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingBanner(true);
      const url = await uploadImageApi(file);
      if (isEdit) {
        setEditForm((prev) => ({ ...prev, bannerUrl: url }));
      } else {
        setCreateForm((prev) => ({ ...prev, bannerUrl: url }));
      }
      toast.success("Tải ảnh bìa lên thành công!");
    } catch {
      toast.error("Lỗi khi tải ảnh lên máy chủ.");
    } finally {
      setIsUploadingBanner(false);
      e.target.value = "";
    }
  };

  // Tính toán Live Preview giá tiền cho form Tạo Combo (chỉ tính quần áo)
  const createPreviewPricing = useMemo(() => {
    let clothingOriginal = 0;

    createForm.items.forEach((it) => {
      let foundVariant: any = null;
      let basePrice = 0;
      for (const p of products) {
        const v = p.variants.find((vr) => vr.id === it.variantId);
        if (v) {
          foundVariant = v;
          basePrice = Number(p.basePrice);
          break;
        }
      }
      if (foundVariant) {
        const price = basePrice + Number(foundVariant.priceAdjustment || 0);
        clothingOriginal += price;
      }
    });

    const discountRate = Number(createForm.discountRate || 0.15);
    const comboPrice = Math.round(clothingOriginal * (1 - discountRate));
    const savedAmount = clothingOriginal - comboPrice;

    return {
      clothingOriginal,
      comboPrice,
      savedAmount,
    };
  }, [createForm.items, createForm.discountRate, products]);

  // Tính toán Live Preview giá tiền cho form Sửa Combo
  const editPreviewPricing = useMemo(() => {
    let clothingOriginal = 0;

    (editForm.items || []).forEach((it) => {
      let foundVariant: any = null;
      let basePrice = 0;
      for (const p of products) {
        const v = p.variants.find((vr) => vr.id === it.variantId);
        if (v) {
          foundVariant = v;
          basePrice = Number(p.basePrice);
          break;
        }
      }
      if (foundVariant) {
        clothingOriginal += basePrice + Number(foundVariant.priceAdjustment || 0);
      }
    });

    const discountRate = Number(editForm.discountRate || 0.15);
    const comboPrice = Math.round(clothingOriginal * (1 - discountRate));
    const savedAmount = clothingOriginal - comboPrice;

    return {
      clothingOriginal,
      comboPrice,
      savedAmount,
    };
  }, [editForm.items, editForm.discountRate, products]);

  // Submit Tạo Combo
  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!createForm.title.trim()) {
      toast.error("Vui lòng nhập tên Combo.");
      return;
    }

    if (createForm.items.length < 2) {
      toast.error("Combo cần tối thiểu 2 món đồ (ví dụ: Áo và Quần).");
      return;
    }

    for (let i = 0; i < createForm.items.length; i++) {
      if (!createForm.items[i].variantId) {
        toast.error(`Vui lòng chọn sản phẩm cho món thứ ${i + 1}.`);
        return;
      }
    }

    createOutfit(createForm);
  };

  // Submit Sửa Combo
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outfitToEdit) return;

    if (!editForm.title?.trim()) {
      toast.error("Vui lòng nhập tên Combo.");
      return;
    }

    if (editForm.items && editForm.items.length < 2) {
      toast.error("Combo cần tối thiểu 2 món đồ (ví dụ: Áo và Quần).");
      return;
    }

    if (editForm.items) {
      for (let i = 0; i < editForm.items.length; i++) {
        if (!editForm.items[i].variantId) {
          toast.error(`Vui lòng chọn sản phẩm cho món thứ ${i + 1}.`);
          return;
        }
      }
    }

    updateOutfit(editForm);
  };

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Quản lý Combo Thời trang (Outfits)
            </h1>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              Khởi tạo các bộ Combo thời trang (Áo + Quần + Áo khoác) với giá ưu đãi trọn gói, kích thích doanh thu bán theo set.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-2 bg-white text-slate-800 border-slate-300 hover:bg-slate-100 font-semibold shadow-xs"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              Làm mới
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary text-primary-foreground font-black hover:bg-primary/90 gap-1.5 shadow-xs cursor-pointer px-4"
            >
              <Plus size={16} />
              Tạo combo mới
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên combo hoặc phong cách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 shadow-xs"
            />
          </div>
          <div className="text-xs text-slate-600 font-medium hidden sm:block">
            Tổng cộng: <strong className="text-slate-900">{totalCount}</strong> combo
          </div>
        </div>

        {/* Error Notice */}
        {isError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0 text-rose-600" />
              <p className="text-sm font-semibold">{error || "Đã xảy ra lỗi khi tải danh sách combo."}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="bg-white hover:bg-rose-100 border-rose-400 text-rose-900 font-bold"
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* Table Outfits */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Combo / Ảnh bìa</th>
                <th>Các món trong Combo</th>
                <th>Giảm giá</th>
                <th>Giá Combo / Giá gốc</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-14 w-14 rounded-xl bg-slate-200" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-36 bg-slate-200" />
                          <Skeleton className="h-3 w-48 bg-slate-200" />
                        </div>
                      </div>
                    </td>
                    <td>
                      <Skeleton className="h-6 w-32 bg-slate-200" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-16 bg-slate-200" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-24 bg-slate-200" />
                    </td>
                    <td>
                      <Skeleton className="h-6 w-20 rounded-full bg-slate-200" />
                    </td>
                    <td className="text-right">
                      <Skeleton className="h-8 w-24 rounded-lg bg-slate-200 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : outfits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Sparkles size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">Chưa có Combo nào được tạo</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Hãy bấm &quot;Tạo combo mới&quot; để phối set đồ ưu đãi đầu tiên.
                    </p>
                  </td>
                </tr>
              ) : (
                outfits.map((outfit: AdminOutfit) => {
                  // Chỉ lấy các món quần áo thuộc Combo
                  const clothingItems = outfit.items.filter((it) =>
                    ["TOP", "BOTTOM", "OUTERWEAR"].includes(it.slotType)
                  );

                  return (
                    <tr key={outfit.id}>
                      <td>
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            {outfit.bannerUrl ? (
                              <Image
                                src={outfit.bannerUrl}
                                alt={outfit.title}
                                fill
                                className="object-cover"
                                sizes="56px"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <Sparkles size={20} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate text-sm">
                              {outfit.title}
                            </span>
                            <span className="text-xs text-slate-500 line-clamp-1 font-medium mt-0.5">
                              {outfit.description || "Chưa có mô tả"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Các món trong Combo thuần túy */}
                      <td>
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {clothingItems.map((it: AdminOutfitItem) => {
                            const slotMeta = OUTFIT_SLOT_LABELS[it.slotType] || {
                              label: it.slotType,
                              badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
                            };
                            const SlotIcon = SLOT_ICONS[it.slotType] || Shirt;
                            return (
                              <span
                                key={it.id}
                                className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${slotMeta.badgeClass}`}
                                title={`${it.productName} (${it.color} / ${it.size}) - ${formatPrice(it.price)}`}
                              >
                                <SlotIcon size={12} />
                                <span>{it.productName}</span>
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      <td>
                        <span className="inline-flex items-center gap-1 font-black text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300">
                          -{outfit.discountPercent}%
                        </span>
                      </td>

                      <td>
                        <div>
                          <span className="font-black text-slate-900 text-sm block">
                            {formatPrice(outfit.comboPrice)}
                          </span>
                          <span className="text-xs text-slate-400 line-through">
                            {formatPrice(outfit.originalPrice)}
                          </span>
                        </div>
                      </td>

                      <td>
                        <button
                          onClick={() => toggleStatus(outfit)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                            outfit.isActive
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                          }`}
                          title="Bấm để bật/tắt hiển thị combo"
                        >
                          {outfit.isActive ? (
                            <>
                              <Eye size={12} />
                              Đang bán
                            </>
                          ) : (
                            <>
                              <EyeOff size={12} />
                              Đang ẩn
                            </>
                          )}
                        </button>
                      </td>

                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(outfit)}
                            className="h-8 px-2.5 text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 border-slate-300 gap-1"
                          >
                            <Edit3 size={12} />
                            Sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteModal(outfit)}
                            className="h-8 px-2.5 text-xs font-bold bg-white text-rose-600 hover:bg-rose-50 border-rose-200 hover:border-rose-300 gap-1"
                          >
                            <Trash2 size={12} />
                            Xóa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL 1: TẠO COMBO MỚI */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-sm">
                    <Sparkles size={18} />
                  </span>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">
                      Tạo Combo Thời trang mới
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Chọn các món quần áo (Áo, Quần, Áo khoác) và thiết lập tỷ lệ giảm giá gói combo.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitCreate} className="space-y-4">
                {/* Tên Combo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Combo / Set đồ *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Smart Casual Công Sở, Streetwear All-Black..."
                    value={createForm.title}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {/* Mô tả */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mô tả phong cách
                  </label>
                  <textarea
                    rows={2}
                    placeholder="VD: Phong cách năng động trẻ trung kết hợp Áo thun basic và Quần denim retro..."
                    value={createForm.description || ""}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {/* Ảnh bìa + Upload ảnh */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Ảnh bìa Combo (Lookbook Banner)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Dán link ảnh hoặc bấm nút tải ảnh từ máy..."
                      value={createForm.bannerUrl || ""}
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, bannerUrl: e.target.value }))
                      }
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:outline-none"
                    />
                    <label className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 cursor-pointer transition-colors shrink-0">
                      <Upload size={14} className={isUploadingBanner ? "animate-spin" : ""} />
                      <span>{isUploadingBanner ? "Đang tải..." : "Chọn ảnh từ máy"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingBanner}
                        onChange={(e) => handleUploadBanner(e, false)}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  {createForm.bannerUrl && (
                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mt-2">
                      <Image
                        src={createForm.bannerUrl}
                        alt="Preview banner"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 600px"
                      />
                    </div>
                  )}
                </div>

                {/* Tỷ lệ giảm giá */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Mức giảm giá Combo (%):
                    </label>
                    <span className="text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                      Giảm {Math.round(createForm.discountRate * 100)}% trọn gói
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[10, 15, 20, 25].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() =>
                          setCreateForm((prev) => ({ ...prev, discountRate: pct / 100 }))
                        }
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          Math.round(createForm.discountRate * 100) === pct
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                    <div className="flex items-center gap-1 ml-auto">
                      <input
                        type="number"
                        min={0}
                        max={80}
                        step={1}
                        value={Math.round(createForm.discountRate * 100)}
                        onChange={(e) => {
                          const val = Math.min(80, Math.max(0, Number(e.target.value) || 0));
                          setCreateForm((prev) => ({ ...prev, discountRate: val / 100 }));
                        }}
                        className="w-16 px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold text-center bg-white"
                      />
                      <span className="text-xs font-bold text-slate-600">%</span>
                    </div>
                  </div>
                </div>

                {/* DANH SÁCH MÓN ĐỒ TRONG COMBO */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Danh sách các món trong Combo ({createForm.items.length} món)
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Quy tắc: Combo thời trang gồm các món quần áo (tối thiểu 2 món: Áo và Quần).
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const defaultSlot =
                          createForm.items.length === 0
                            ? "TOP"
                            : createForm.items.length === 1
                            ? "BOTTOM"
                            : "OUTERWEAR";
                        setCreateForm((prev) => ({
                          ...prev,
                          items: [...prev.items, { slotType: defaultSlot, variantId: "" }],
                        }));
                      }}
                      className="h-7 text-xs font-bold bg-white text-slate-800 border-slate-300 gap-1"
                    >
                      <Plus size={12} />
                      + Thêm món
                    </Button>
                  </div>

                  {createForm.items.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                      Chưa có món nào. Bấm &quot;+ Thêm món&quot; để chọn Áo và Quần cho Combo.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {createForm.items.map((item, idx) => {
                        const foundProduct = products.find((p) => p.variants.some((v) => v.id === item.variantId));
                        const foundVariant = foundProduct?.variants.find((v) => v.id === item.variantId);
                        const unitPrice = foundProduct && foundVariant
                          ? Number(foundProduct.basePrice) + Number(foundVariant.priceAdjustment || 0)
                          : 0;

                        const slotMeta = OUTFIT_SLOT_LABELS[item.slotType] || {
                          label: item.slotType,
                          badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
                        };
                        const SlotIcon = SLOT_ICONS[item.slotType] || Shirt;

                        return (
                          <div
                            key={idx}
                            className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs transition-all space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-700 text-xs font-black">
                                  #{idx + 1}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${slotMeta.badgeClass}`}>
                                    <SlotIcon size={11} />
                                    <span>{slotMeta.label}</span>
                                  </span>
                                  <select
                                    value={item.slotType}
                                    onChange={(e) => {
                                      const newItems = [...createForm.items];
                                      newItems[idx].slotType = e.target.value;
                                      setCreateForm((prev) => ({ ...prev, items: newItems }));
                                    }}
                                    className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-700 focus:outline-none cursor-pointer"
                                  >
                                    <option value="TOP">Đổi vị trí: Áo (TOP)</option>
                                    <option value="BOTTOM">Đổi vị trí: Quần (BOTTOM)</option>
                                    <option value="OUTERWEAR">Đổi vị trí: Áo khoác (OUTERWEAR)</option>
                                  </select>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const newItems = createForm.items.filter((_, i) => i !== idx);
                                  setCreateForm((prev) => ({ ...prev, items: newItems }));
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Xóa món này khỏi Combo"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div className="flex items-start gap-3">
                              {/* Thumbnail Preview */}
                              <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                                {foundVariant?.imageUrl ? (
                                  <Image
                                    src={foundVariant.imageUrl}
                                    alt={foundProduct?.name || "Product"}
                                    fill
                                    className="object-cover"
                                    sizes="56px"
                                  />
                                ) : (
                                  <SlotIcon size={24} className="text-slate-400" />
                                )}
                              </div>

                              {/* Variant selector dropdown */}
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <select
                                  value={item.variantId}
                                  onChange={(e) => {
                                    const newItems = [...createForm.items];
                                    newItems[idx].variantId = e.target.value;
                                    setCreateForm((prev) => ({ ...prev, items: newItems }));
                                  }}
                                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:outline-none"
                                >
                                  <option value="">-- Chọn sản phẩm & biến thể SKU --</option>
                                  {products.map((p) => (
                                    <optgroup key={p.id} label={`${p.name} (${formatPrice(p.basePrice)})`}>
                                      {p.variants.map((v) => (
                                        <option key={v.id} value={v.id}>
                                          {p.name} • [{v.color} / Size {v.size}] • SKU: {v.sku} (Kho: {v.stockQuantity})
                                        </option>
                                      ))}
                                    </optgroup>
                                  ))}
                                </select>

                                {/* Chips thông tin chi tiết */}
                                {foundVariant && foundProduct && (
                                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] pt-0.5">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                        Màu: <strong>{foundVariant.color}</strong>
                                      </span>
                                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                        Size: <strong>{foundVariant.size}</strong>
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-md font-bold ${
                                        foundVariant.stockQuantity > 5
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                          : foundVariant.stockQuantity > 0
                                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                                          : "bg-rose-50 text-rose-700 border border-rose-200"
                                      }`}>
                                        Tồn kho: {foundVariant.stockQuantity}
                                      </span>
                                    </div>
                                    <div className="font-black text-slate-900 text-xs ml-auto">
                                      {formatPrice(unitPrice)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* LIVE PREVIEW TÍNH GIÁ COMBO */}
                {createForm.items.length >= 2 && (
                  <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Tổng giá mua lẻ từng món:</span>
                      <span className="line-through">
                        {formatPrice(createPreviewPricing.clothingOriginal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                      <span>Tiết kiệm trọn gói Combo ({Math.round(createForm.discountRate * 100)}%):</span>
                      <span>-{formatPrice(createPreviewPricing.savedAmount)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">
                        Giá trọn gói Combo hiển thị cho khách:
                      </span>
                      <span className="text-lg font-black text-primary">
                        {formatPrice(createPreviewPricing.comboPrice)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Trạng thái Bật/Tắt */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="create-isActive"
                    checked={createForm.isActive}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <label htmlFor="create-isActive" className="text-xs font-bold text-slate-700">
                    Bật hiển thị và mở bán Combo này trên trang chủ ngay sau khi tạo
                  </label>
                </div>

                {/* Footer buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="bg-white text-slate-700 font-bold"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="bg-primary text-primary-foreground font-black hover:bg-primary/90 gap-1.5"
                  >
                    {isCreating ? "Đang lưu..." : "Tạo Combo ngay"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: SỬA COMBO */}
        {isEditModalOpen && outfitToEdit && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white font-black text-sm">
                    <Edit3 size={16} />
                  </span>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">
                      Chỉnh sửa Combo & Các món trong Set
                    </h3>
                    <p className="text-xs text-slate-500 font-medium truncate max-w-md">
                      {outfitToEdit.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitEdit} className="space-y-4">
                {/* Tên Combo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Combo / Set đồ *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.title || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {/* Mô tả */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mô tả phong cách
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.description || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {/* Banner Upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Ảnh bìa Combo (Lookbook Banner)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={editForm.bannerUrl || ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, bannerUrl: e.target.value }))
                      }
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:outline-none"
                    />
                    <label className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 cursor-pointer shrink-0">
                      <Upload size={14} className={isUploadingBanner ? "animate-spin" : ""} />
                      <span>{isUploadingBanner ? "Đang tải..." : "Tải ảnh mới"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingBanner}
                        onChange={(e) => handleUploadBanner(e, true)}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  {editForm.bannerUrl && (
                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mt-2">
                      <Image
                        src={editForm.bannerUrl}
                        alt="Preview banner"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 600px"
                      />
                    </div>
                  )}
                </div>

                {/* Tỷ lệ giảm giá */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Mức giảm giá Combo (%):
                    </label>
                    <span className="text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                      Giảm {Math.round((editForm.discountRate || 0.15) * 100)}% trọn gói
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[10, 15, 20, 25].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() =>
                          setEditForm((prev) => ({ ...prev, discountRate: pct / 100 }))
                        }
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          Math.round((editForm.discountRate || 0.15) * 100) === pct
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                    <div className="flex items-center gap-1 ml-auto">
                      <input
                        type="number"
                        min={0}
                        max={80}
                        step={1}
                        value={Math.round((editForm.discountRate || 0.15) * 100)}
                        onChange={(e) => {
                          const val = Math.min(80, Math.max(0, Number(e.target.value) || 0));
                          setEditForm((prev) => ({ ...prev, discountRate: val / 100 }));
                        }}
                        className="w-16 px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold text-center bg-white"
                      />
                      <span className="text-xs font-bold text-slate-600">%</span>
                    </div>
                  </div>
                </div>

                {/* DANH SÁCH MÓN ĐỒ TRONG COMBO (CHO PHÉP SỬA / THÊM / BỚT MÓN) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Danh sách các món trong Combo ({editForm.items?.length || 0} món)
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Bạn có thể đổi sản phẩm, đổi size/màu hoặc thêm/bớt món trong Combo.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentItems = editForm.items || [];
                        const defaultSlot =
                          currentItems.length === 0
                            ? "TOP"
                            : currentItems.length === 1
                            ? "BOTTOM"
                            : "OUTERWEAR";
                        setEditForm((prev) => ({
                          ...prev,
                          items: [...(prev.items || []), { slotType: defaultSlot, variantId: "" }],
                        }));
                      }}
                      className="h-7 text-xs font-bold bg-white text-slate-800 border-slate-300 gap-1"
                    >
                      <Plus size={12} />
                      + Thêm món
                    </Button>
                  </div>

                  {(!editForm.items || editForm.items.length === 0) ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                      Chưa có món nào. Bấm &quot;+ Thêm món&quot; để chọn món cho Combo.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {editForm.items.map((item, idx) => {
                        const foundProduct = products.find((p) => p.variants.some((v) => v.id === item.variantId));
                        const foundVariant = foundProduct?.variants.find((v) => v.id === item.variantId);
                        const unitPrice = foundProduct && foundVariant
                          ? Number(foundProduct.basePrice) + Number(foundVariant.priceAdjustment || 0)
                          : 0;

                        const slotMeta = OUTFIT_SLOT_LABELS[item.slotType] || {
                          label: item.slotType,
                          badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
                        };
                        const SlotIcon = SLOT_ICONS[item.slotType] || Shirt;

                        return (
                          <div
                            key={idx}
                            className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs transition-all space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-700 text-xs font-black">
                                  #{idx + 1}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${slotMeta.badgeClass}`}>
                                    <SlotIcon size={11} />
                                    <span>{slotMeta.label}</span>
                                  </span>
                                  <select
                                    value={item.slotType}
                                    onChange={(e) => {
                                      const newItems = [...(editForm.items || [])];
                                      newItems[idx].slotType = e.target.value;
                                      setEditForm((prev) => ({ ...prev, items: newItems }));
                                    }}
                                    className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-700 focus:outline-none cursor-pointer"
                                  >
                                    <option value="TOP">Đổi vị trí: Áo (TOP)</option>
                                    <option value="BOTTOM">Đổi vị trí: Quần (BOTTOM)</option>
                                    <option value="OUTERWEAR">Đổi vị trí: Áo khoác (OUTERWEAR)</option>
                                  </select>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const newItems = (editForm.items || []).filter((_, i) => i !== idx);
                                  setEditForm((prev) => ({ ...prev, items: newItems }));
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Xóa món này khỏi Combo"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div className="flex items-start gap-3">
                              {/* Thumbnail Preview */}
                              <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                                {foundVariant?.imageUrl ? (
                                  <Image
                                    src={foundVariant.imageUrl}
                                    alt={foundProduct?.name || "Product"}
                                    fill
                                    className="object-cover"
                                    sizes="56px"
                                  />
                                ) : (
                                  <SlotIcon size={24} className="text-slate-400" />
                                )}
                              </div>

                              {/* Variant selector dropdown */}
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <select
                                  value={item.variantId}
                                  onChange={(e) => {
                                    const newItems = [...(editForm.items || [])];
                                    newItems[idx].variantId = e.target.value;
                                    setEditForm((prev) => ({ ...prev, items: newItems }));
                                  }}
                                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:outline-none"
                                >
                                  <option value="">-- Chọn sản phẩm & biến thể SKU --</option>
                                  {products.map((p) => (
                                    <optgroup key={p.id} label={`${p.name} (${formatPrice(p.basePrice)})`}>
                                      {p.variants.map((v) => (
                                        <option key={v.id} value={v.id}>
                                          {p.name} • [{v.color} / Size {v.size}] • SKU: {v.sku} (Kho: {v.stockQuantity})
                                        </option>
                                      ))}
                                    </optgroup>
                                  ))}
                                </select>

                                {/* Chips thông tin chi tiết */}
                                {foundVariant && foundProduct && (
                                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] pt-0.5">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                        Màu: <strong>{foundVariant.color}</strong>
                                      </span>
                                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                        Size: <strong>{foundVariant.size}</strong>
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-md font-bold ${
                                        foundVariant.stockQuantity > 5
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                          : foundVariant.stockQuantity > 0
                                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                                          : "bg-rose-50 text-rose-700 border border-rose-200"
                                      }`}>
                                        Tồn kho: {foundVariant.stockQuantity}
                                      </span>
                                    </div>
                                    <div className="font-black text-slate-900 text-xs ml-auto">
                                      {formatPrice(unitPrice)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* LIVE PREVIEW TÍNH GIÁ TỰ ĐỘNG KHI SỬA */}
                {editForm.items && editForm.items.length >= 2 && (
                  <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Tổng giá mua lẻ từng món:</span>
                      <span className="line-through">
                        {formatPrice(editPreviewPricing.clothingOriginal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                      <span>Tiết kiệm trọn gói Combo ({Math.round((editForm.discountRate || 0.15) * 100)}%):</span>
                      <span>-{formatPrice(editPreviewPricing.savedAmount)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">
                        Giá trọn gói Combo hiển thị cho khách:
                      </span>
                      <span className="text-lg font-black text-primary">
                        {formatPrice(editPreviewPricing.comboPrice)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Trạng thái Bật/Tắt */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="edit-isActive"
                    checked={editForm.isActive}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <label htmlFor="edit-isActive" className="text-xs font-bold text-slate-700">
                    Bật hiển thị mở bán Combo này trên trang chủ
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                    className="bg-white text-slate-700 font-bold"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdating}
                    className="bg-slate-900 text-white font-black hover:bg-slate-800"
                  >
                    {isUpdating ? "Đang lưu..." : "Cập nhật Combo"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: XÁC NHẬN XÓA COMBO */}
        {isDeleteModalOpen && outfitToDelete && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 shrink-0">
                  <AlertTriangle size={20} />
                </span>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Xác nhận xóa Combo?
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Hành động này sẽ gỡ bỏ vĩnh viễn Combo này khỏi trang bán hàng.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <p className="font-bold text-slate-900">{outfitToDelete.title}</p>
                <p className="text-slate-500 mt-0.5">
                  Gồm {outfitToDelete.items.filter((it) => ["TOP", "BOTTOM", "OUTERWEAR"].includes(it.slotType)).length} món đồ • Giảm {outfitToDelete.discountPercent}%
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="bg-white text-slate-700 font-bold"
                >
                  Không xóa
                </Button>
                <Button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-black"
                >
                  {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
