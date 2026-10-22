"use client";

import React from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { useAdminProducts } from "../hooks/use-admin-products";
import { AdminProduct } from "../validation/admin.validation";
import {
  Shirt,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Edit2,
  EyeOff,
  X,
  Package,
  Layers,
  Trash2,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-toastify";

export default function AdminProductsPage() {
  const {
    products,
    allProductsCount,
    activeCount,
    hiddenCount,
    categories,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    isLoading,
    isError,
    error,
    refetch,
    isCreateModalOpen,
    setIsCreateModalOpen,
    createForm,
    setCreateForm,
    createProduct,
    isCreating,
    editingProduct,
    setEditingProduct,
    updateForm,
    setUpdateForm,
    updateProduct,
    isUpdating,
    productToDelete,
    setProductToDelete,
    deleteProduct,
    isDeleting,
  } = useAdminProducts();

  // Handle auto-generating slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    setCreateForm((prev) => ({
      ...prev,
      name,
      slug,
      variants: prev.variants.map((v, i) =>
        i === 0 && !v.sku
          ? { ...v, sku: `${slug.toUpperCase().slice(0, 8)}-M` }
          : v
      ),
    }));
  };

  // Add/Remove variants in Create Form
  const handleAddVariant = () => {
    const nextIndex = createForm.variants.length + 1;
    setCreateForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          sku: prev.slug ? `${prev.slug.toUpperCase().slice(0, 8)}-VAR${nextIndex}` : `SKU-${nextIndex}`,
          color: "Trắng",
          size: "L",
          priceAdjustment: 0,
          stockQuantity: 30,
          imageUrl: "",
        },
      ],
    }));
  };

  const handleRemoveVariant = (index: number) => {
    if (createForm.variants.length <= 1) {
      toast.warn("Sản phẩm cần có tối thiểu 1 biến thể.");
      return;
    }
    setCreateForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateVariantField = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setCreateForm((prev) => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, variants: updated };
    });
  };

  // Submit Create Product
  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.slug.trim()) {
      toast.error("Vui lòng điền tên sản phẩm và slug hợp lệ.");
      return;
    }
    if (!createForm.categoryId) {
      toast.error("Vui lòng chọn danh mục cho sản phẩm.");
      return;
    }
    if (Number(createForm.basePrice) < 0) {
      toast.error("Giá gốc sản phẩm không được là số âm.");
      return;
    }

    createProduct({
      ...createForm,
      basePrice: Number(createForm.basePrice),
      variants: createForm.variants.map((v) => ({
        ...v,
        priceAdjustment: Number(v.priceAdjustment || 0),
        stockQuantity: Number(v.stockQuantity || 0),
      })),
    });
  };

  // Open Edit Modal
  const handleOpenEdit = (product: AdminProduct) => {
    setEditingProduct(product);
    setUpdateForm({
      name: product.name,
      description: product.description || "",
      basePrice: Number(product.basePrice),
      categoryId: product.categoryId,
      isActive: product.isActive,
    });
  };

  // Submit Update Product
  const handleSubmitUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    updateProduct(editingProduct.id, {
      ...updateForm,
      basePrice: Number(updateForm.basePrice),
    });
  };

  // Soft-delete / Hide product
  const handleConfirmDelete = () => {
    if (!productToDelete) return;
    deleteProduct(productToDelete.id);
  };

  const formatVND = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num || 0);
  };

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Quản lý Sản phẩm
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Thêm mới sản phẩm thời trang kèm biến thể kích cỡ, màu sắc, điều chỉnh giá và kiểm soát trạng thái hiển thị.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              Làm mới
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm"
            >
              <Plus size={16} />
              Thêm sản phẩm
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, slug, danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl font-medium transition ${
                statusFilter === "ALL"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Tất cả ({allProductsCount})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-xl font-medium transition ${
                statusFilter === "ACTIVE"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Đang bán ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter("HIDDEN")}
              className={`px-3 py-1.5 rounded-xl font-medium transition ${
                statusFilter === "HIDDEN"
                  ? "bg-slate-700 text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Đã ẩn ({hiddenCount})
            </button>
          </div>
        </div>

        {/* Error Notice */}
        {isError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0 text-rose-600" />
              <p className="text-sm font-medium">{error || "Đã xảy ra lỗi khi tải sản phẩm."}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="bg-white hover:bg-rose-50 border-rose-300 text-rose-700"
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* Products Table */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá gốc</th>
                <th>Biến thể & Tồn kho</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </td>
                    <td>
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="text-right">
                      <Skeleton className="h-8 w-24 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <Shirt size={40} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      Không tìm thấy sản phẩm nào
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Hãy thêm sản phẩm mới hoặc thử đổi bộ lọc tìm kiếm.
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const firstVariantImg = product.variants?.[0]?.imageUrl;
                  const totalStock = product.variants?.reduce(
                    (s, v) => s + (Number(v.stockQuantity) || 0),
                    0
                  );

                  return (
                    <tr key={product.id}>
                      {/* Product Name & Image */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                            {firstVariantImg ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={firstVariantImg}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package size={20} className="text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-400">/{product.slug}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="text-xs text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <Tag size={12} className="text-slate-400" />
                          {product.category?.name || "Chưa phân loại"}
                        </span>
                      </td>

                      {/* Base Price */}
                      <td className="font-bold text-slate-900 dark:text-white text-sm">
                        {formatVND(product.basePrice)}
                      </td>

                      {/* Variants & Total Stock */}
                      <td>
                        <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                          {product.variants?.length || 0} biến thể
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Tổng tồn: <strong>{totalStock}</strong> cái
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        {product.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            Đang mở bán
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                            Đã ẩn
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(product)}
                            className="h-8 px-2.5 text-xs gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-300"
                          >
                            <Edit2 size={13} />
                            Sửa
                          </Button>
                          {product.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setProductToDelete(product)}
                              className="h-8 px-2.5 text-xs gap-1 text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900"
                            >
                              <EyeOff size={13} />
                              Ẩn
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL 1: TẠO SẢN PHẨM MỚI (Frosted Glass Backdrop) */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Thêm Sản phẩm Thời trang Mới
                    </h3>
                    <p className="text-xs text-slate-500">
                      Điền thông tin chi tiết và cấu hình các biến thể SKU
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitCreate} className="space-y-5">
                {/* Basic info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Tên sản phẩm *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Áo Khoác Bomber Trendy..."
                      value={createForm.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Slug URL *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ao-khoac-bomber-trendy"
                      value={createForm.slug}
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, slug: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Giá gốc (VND) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000}
                      placeholder="350000"
                      value={createForm.basePrice || ""}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          basePrice: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Danh mục *
                    </label>
                    <select
                      value={createForm.categoryId}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          categoryId: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Mô tả chi tiết sản phẩm
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Mô tả về chất liệu vải, kiểu dáng, phong cách fit..."
                      value={createForm.description}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* Variants Section */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Layers size={16} className="text-indigo-600" />
                        Danh sách Biến thể (Màu sắc, Size, Tồn kho)
                      </h4>
                      <p className="text-xs text-slate-400">
                        Mỗi biến thể có một mã SKU, kích thước, màu sắc và mức điều chỉnh giá riêng.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddVariant}
                      className="text-xs gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    >
                      <Plus size={14} /> Thêm biến thể
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {createForm.variants.map((v, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs items-end"
                      >
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            Mã SKU *
                          </label>
                          <input
                            type="text"
                            required
                            value={v.sku}
                            onChange={(e) =>
                              handleUpdateVariantField(idx, "sku", e.target.value)
                            }
                            placeholder="SKU-1"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            Màu sắc *
                          </label>
                          <input
                            type="text"
                            required
                            value={v.color}
                            onChange={(e) =>
                              handleUpdateVariantField(idx, "color", e.target.value)
                            }
                            placeholder="Đen"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            Size *
                          </label>
                          <input
                            type="text"
                            required
                            value={v.size}
                            onChange={(e) =>
                              handleUpdateVariantField(idx, "size", e.target.value)
                            }
                            placeholder="S / M / L / XL"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            Chênh giá (+/-)
                          </label>
                          <input
                            type="number"
                            value={v.priceAdjustment}
                            onChange={(e) =>
                              handleUpdateVariantField(
                                idx,
                                "priceAdjustment",
                                Number(e.target.value)
                              )
                            }
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            Tồn kho *
                          </label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={v.stockQuantity}
                            onChange={(e) =>
                              handleUpdateVariantField(
                                idx,
                                "stockQuantity",
                                Number(e.target.value)
                              )
                            }
                            placeholder="50"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={v.imageUrl || ""}
                            onChange={(e) =>
                              handleUpdateVariantField(idx, "imageUrl", e.target.value)
                            }
                            placeholder="URL ảnh"
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                          />
                          {createForm.variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(idx)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                              title="Xóa biến thể"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Footer */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isCreating}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isCreating}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[130px]"
                  >
                    {isCreating ? (
                      <RefreshCw size={14} className="animate-spin mr-1.5" />
                    ) : null}
                    Lưu sản phẩm
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: CHỈNH SỬA SẢN PHẨM (Frosted Glass Backdrop) */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                    <Edit2 size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Chỉnh sửa Sản phẩm
                    </h3>
                    <p className="text-xs text-slate-500">
                      /{editingProduct.slug}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitUpdate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    required
                    value={updateForm.name}
                    onChange={(e) =>
                      setUpdateForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Giá gốc (VND) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000}
                      value={updateForm.basePrice || ""}
                      onChange={(e) =>
                        setUpdateForm((prev) => ({
                          ...prev,
                          basePrice: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Danh mục *
                    </label>
                    <select
                      value={updateForm.categoryId}
                      onChange={(e) =>
                        setUpdateForm((prev) => ({
                          ...prev,
                          categoryId: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mô tả sản phẩm
                  </label>
                  <textarea
                    rows={3}
                    value={updateForm.description}
                    onChange={(e) =>
                      setUpdateForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={updateForm.isActive}
                      onChange={(e) =>
                        setUpdateForm((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Cho phép mở bán trên Storefront (isActive)
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingProduct(null)}
                    disabled={isUpdating}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isUpdating}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[110px]"
                  >
                    {isUpdating ? (
                      <RefreshCw size={14} className="animate-spin mr-1.5" />
                    ) : null}
                    Cập nhật
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: XÁC NHẬN ẨN SẢN PHẨM (Frosted Glass Backdrop) */}
        {productToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                  <EyeOff size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Ẩn sản phẩm khỏi cửa hàng?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sản phẩm: {productToDelete.name}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Sau khi ẩn, khách hàng sẽ không thể tìm thấy hoặc đặt mua sản phẩm này trên Storefront. Bạn có thể mở bán lại bất kỳ lúc nào qua màn hình chỉnh sửa.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProductToDelete(null)}
                  disabled={isDeleting}
                >
                  Không ẩn
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {isDeleting ? (
                    <RefreshCw size={14} className="animate-spin mr-1.5" />
                  ) : null}
                  Xác nhận ẩn
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

