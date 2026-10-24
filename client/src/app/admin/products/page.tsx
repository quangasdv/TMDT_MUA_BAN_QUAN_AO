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
  Upload,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { uploadImageApi } from "../api/admin.api";
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

  // Upload states
  const [isUploadingEditImage, setIsUploadingEditImage] = React.useState(false);
  const [uploadingVariantIndex, setUploadingVariantIndex] = React.useState<number | null>(null);
  const [isUploadingMainImage, setIsUploadingMainImage] = React.useState(false);

  // Upload handler for Edit Modal
  const handleUploadEditImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingEditImage(true);
      const url = await uploadImageApi(file);
      setUpdateForm((prev) => ({ ...prev, imageUrl: url }));
      toast.success("Tải ảnh sản phẩm thành công!");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi khi tải ảnh lên.";
      toast.error(msg);
    } finally {
      setIsUploadingEditImage(false);
      e.target.value = "";
    }
  };

  // Upload handler for variant in Create Modal
  const handleUploadVariantImage = async (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingVariantIndex(idx);
      const url = await uploadImageApi(file);
      handleUpdateVariantField(idx, "imageUrl", url);
      toast.success(`Đã tải ảnh cho biến thể #${idx + 1}!`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi khi tải ảnh lên.";
      toast.error(msg);
    } finally {
      setUploadingVariantIndex(null);
      e.target.value = "";
    }
  };

  // Upload main image for all variants in Create Modal
  const handleUploadMainCreateImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingMainImage(true);
      const url = await uploadImageApi(file);
      setCreateForm((prev) => ({
        ...prev,
        variants: prev.variants.map((v) => ({
          ...v,
          imageUrl: v.imageUrl || url,
        })),
      }));
      toast.success("Đã tải ảnh và áp dụng cho các biến thể!");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi khi tải ảnh lên.";
      toast.error(msg);
    } finally {
      setIsUploadingMainImage(false);
      e.target.value = "";
    }
  };

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
    const primaryImg = product.variants?.[0]?.imageUrl || "";
    setUpdateForm({
      name: product.name,
      description: product.description || "",
      basePrice: Number(product.basePrice),
      categoryId: product.categoryId,
      isActive: product.isActive,
      imageUrl: primaryImg,
    });
  };

  // Submit Update Product
  const handleSubmitUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    updateProduct(editingProduct.id, {
      ...updateForm,
      basePrice: Number(updateForm.basePrice),
      imageUrl: updateForm.imageUrl,
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
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Quản lý Sản phẩm
            </h1>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              Thêm mới sản phẩm thời trang kèm biến thể kích cỡ, màu sắc, điều chỉnh giá và kiểm soát trạng thái hiển thị.
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
              Thêm sản phẩm
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, slug, danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Tất cả ({allProductsCount})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === "ACTIVE"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Đang bán ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter("HIDDEN")}
              className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === "HIDDEN"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Đã ẩn ({hiddenCount})
            </button>
          </div>
        </div>

        {/* Error Notice */}
        {isError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0 text-rose-600" />
              <p className="text-sm font-semibold">{error || "Đã xảy ra lỗi khi tải sản phẩm."}</p>
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
                        <Skeleton className="w-12 h-12 rounded-lg bg-slate-200" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-36 bg-slate-200" />
                          <Skeleton className="h-3 w-24 bg-slate-200" />
                        </div>
                      </div>
                    </td>
                    <td>
                      <Skeleton className="h-4 w-20 bg-slate-200" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-24 bg-slate-200" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-28 bg-slate-200" />
                    </td>
                    <td>
                      <Skeleton className="h-6 w-20 rounded-full bg-slate-200" />
                    </td>
                    <td className="text-right">
                      <Skeleton className="h-8 w-24 ml-auto bg-slate-200" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-600">
                    <Shirt size={40} className="mx-auto text-slate-400 mb-2" />
                    <p className="font-bold text-slate-800 text-base">
                      Không tìm thấy sản phẩm nào
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
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
                          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                            {firstVariantImg ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={firstVariantImg}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package size={20} className="text-slate-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm line-clamp-1">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-500 font-medium">/{product.slug}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="text-xs text-slate-700 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <Tag size={12} className="text-slate-500" />
                          {product.category?.name || "Chưa phân loại"}
                        </span>
                      </td>

                      {/* Base Price */}
                      <td className="font-black text-slate-900 text-sm">
                        {formatVND(product.basePrice)}
                      </td>

                      {/* Variants & Total Stock */}
                      <td>
                        <div className="text-xs text-slate-900 font-bold">
                          {product.variants?.length || 0} biến thể
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium">
                          Tổng tồn: <strong className="text-slate-900">{totalStock}</strong> cái
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        {product.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
                            Đang mở bán
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
                            Đã ẩn
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(product)}
                            className="h-8 px-2.5 text-xs gap-1 bg-white text-slate-800 border-slate-300 hover:bg-slate-100 font-semibold"
                          >
                            <Edit2 size={13} />
                            Sửa
                          </Button>
                          {product.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setProductToDelete(product)}
                              className="h-8 px-2.5 text-xs gap-1 bg-white text-rose-800 hover:bg-rose-50 border-rose-300 font-semibold"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-6 text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Thêm Sản phẩm Thời trang Mới
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      Điền thông tin chi tiết và cấu hình các biến thể SKU
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitCreate} className="space-y-5">
                {/* Basic info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">
                      Tên sản phẩm *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Áo Khoác Bomber Trendy..."
                      value={createForm.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id} className="text-slate-900">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-800">
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                    />
                  </div>
                </div>

                {/* Variants Section */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  {/* Quick Upload Main Image */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/60">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                        <ImageIcon size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          Tải ảnh sản phẩm từ máy tính (Áp dụng chung)
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Ảnh tải lên sẽ tự động điền vào các biến thể chưa có ảnh
                        </p>
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition shadow-2xs self-start sm:self-auto shrink-0">
                      {isUploadingMainImage ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Upload size={13} />
                      )}
                      <span>{isUploadingMainImage ? "Đang tải ảnh..." : "Chọn ảnh từ máy"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingMainImage}
                        onChange={handleUploadMainCreateImage}
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Layers size={16} className="text-slate-900" />
                        Danh sách Biến thể (Màu sắc, Size, Tồn kho)
                      </h4>
                      <p className="text-xs text-slate-600 font-medium">
                        Mỗi biến thể có một mã SKU, kích thước, màu sắc và mức điều chỉnh giá riêng.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddVariant}
                      className="text-xs gap-1 bg-white text-slate-900 border-slate-300 hover:bg-slate-100 font-bold"
                    >
                      <Plus size={14} /> Thêm biến thể
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {createForm.variants.map((v, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs items-end"
                      >
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
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
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
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
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
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
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
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
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
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
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Hình ảnh biến thể
                          </label>
                          <div className="flex items-center gap-1.5">
                            {v.imageUrl ? (
                              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-300 bg-white shrink-0 group shadow-2xs">
                                <img
                                  src={v.imageUrl}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : null}
                            <label
                              className="p-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 cursor-pointer transition shrink-0"
                              title="Tải ảnh biến thể này từ máy"
                            >
                              {uploadingVariantIndex === idx ? (
                                <Loader2 size={14} className="animate-spin text-slate-900" />
                              ) : (
                                <Upload size={14} />
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingVariantIndex === idx}
                                onChange={(e) => handleUploadVariantImage(idx, e)}
                              />
                            </label>
                            <input
                              type="text"
                              value={v.imageUrl || ""}
                              onChange={(e) =>
                                handleUpdateVariantField(idx, "imageUrl", e.target.value)
                              }
                              placeholder="URL ảnh..."
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-[11px]"
                            />
                            {createForm.variants.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(idx)}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                                title="Xóa biến thể"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Footer */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isCreating}
                    className="border-slate-300 text-slate-800 font-semibold"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isCreating}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold min-w-[130px] shadow-xs cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
                    <Edit2 size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Chỉnh sửa Sản phẩm
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      /{editingProduct.slug}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitUpdate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    required
                    value={updateForm.name}
                    onChange={(e) =>
                      setUpdateForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id} className="text-slate-900">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                {/* Section Đổi Hình Ảnh Sản Phẩm */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-slate-800">
                    Hình ảnh sản phẩm
                  </label>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/80">
                    {updateForm.imageUrl ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-300 bg-white shrink-0 shadow-2xs">
                        <img
                          src={updateForm.imageUrl}
                          alt="Ảnh sản phẩm"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 shrink-0">
                        <ImageIcon size={22} />
                        <span className="text-[10px] mt-0.5 font-medium">Chưa có ảnh</span>
                      </div>
                    )}

                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer hover:bg-slate-800 transition shadow-2xs">
                          {isUploadingEditImage ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Upload size={13} />
                          )}
                          <span>{isUploadingEditImage ? "Đang tải ảnh..." : "Tải ảnh mới từ máy"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploadingEditImage}
                            onChange={handleUploadEditImage}
                          />
                        </label>
                        {updateForm.imageUrl && (
                          <button
                            type="button"
                            onClick={() => setUpdateForm((prev) => ({ ...prev, imageUrl: "" }))}
                            className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-1.5 py-1"
                          >
                            Xóa ảnh
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={updateForm.imageUrl || ""}
                        onChange={(e) =>
                          setUpdateForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                        }
                        placeholder="Hoặc dán trực tiếp link URL ảnh..."
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>
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
                      className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 accent-slate-900"
                    />
                    <span className="font-bold text-slate-800">
                      Cho phép mở bán trên Storefront (isActive)
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingProduct(null)}
                    disabled={isUpdating}
                    className="border-slate-300 text-slate-800 font-semibold"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isUpdating}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold min-w-[110px] shadow-xs cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 text-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-center shrink-0">
                  <EyeOff size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Ẩn sản phẩm khỏi cửa hàng?
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Sản phẩm: {productToDelete.name}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Sau khi ẩn, khách hàng sẽ không thể tìm thấy hoặc đặt mua sản phẩm này trên Storefront. Bạn có thể mở bán lại bất kỳ lúc nào qua màn hình chỉnh sửa.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProductToDelete(null)}
                  disabled={isDeleting}
                  className="border-slate-300 text-slate-800 font-semibold"
                >
                  Không ẩn
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="bg-rose-800 hover:bg-rose-900 text-white font-bold shadow-xs cursor-pointer"
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
