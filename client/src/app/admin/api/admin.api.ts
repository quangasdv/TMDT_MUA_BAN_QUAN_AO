import { baseAPI } from "@/api/axios.api";
import {
  DashboardStatsResponse,
  AdminOrdersResponse,
  UpdateOrderStatusResponse,
  AdminProductsResponse,
  CreateProductPayload,
  UpdateProductPayload,
  AdminProduct,
  AdminVouchersResponse,
  CreateVoucherPayload,
  UpdateVoucherPayload,
  AdminVoucher,
  AdminUsersResponse,
  CreateUserPayload,
  UpdateUserPayload,
  AdminUser,
} from "../validation/admin.validation";

/**
 * 1. Lấy thống kê tổng quan Dashboard (Chỉ ADMIN)
 * GET /api/admin/stats
 */
export const getAdminStatsApi = async (): Promise<DashboardStatsResponse> => {
  const response = await baseAPI.get<DashboardStatsResponse>("/admin/stats");
  return response.data;
};

/**
 * 2. Lấy danh sách tất cả đơn hàng kèm phân trang và bộ lọc trạng thái (ADMIN & STAFF)
 * GET /api/admin/orders
 */
export const getAdminOrdersApi = async (params?: {
  status?: string;
  page?: number | string;
  limit?: number | string;
}): Promise<AdminOrdersResponse> => {
  const queryParams: Record<string, string | number> = {};
  if (params?.status && params.status !== "ALL") {
    queryParams.status = params.status;
  }
  if (params?.page) {
    queryParams.page = params.page;
  }
  if (params?.limit) {
    queryParams.limit = params.limit;
  }

  const response = await baseAPI.get<AdminOrdersResponse>("/admin/orders", {
    params: queryParams,
  });
  return response.data;
};

/**
 * 3. Cập nhật trạng thái đơn hàng theo State Machine (ADMIN & STAFF)
 * PATCH /api/admin/orders/:id/status
 */
export const updateOrderStatusApi = async (
  orderId: string,
  status: string
): Promise<UpdateOrderStatusResponse> => {
  const response = await baseAPI.patch<UpdateOrderStatusResponse>(
    `/admin/orders/${encodeURIComponent(orderId)}/status`,
    { status }
  );
  return response.data;
};

/**
 * 4. Lấy danh sách tất cả sản phẩm, bao gồm sản phẩm bị ẩn (Chỉ ADMIN)
 * GET /api/admin/products
 */
export const getAdminProductsApi = async (): Promise<AdminProductsResponse> => {
  const response = await baseAPI.get<AdminProductsResponse>("/admin/products");
  return response.data;
};

/**
 * 5. Tạo sản phẩm mới kèm biến thể và bảng size (Chỉ ADMIN)
 * POST /api/admin/products
 */
export const createAdminProductApi = async (
  payload: CreateProductPayload
): Promise<{ success: boolean; message: string; data: { product: AdminProduct } }> => {
  const response = await baseAPI.post<{
    success: boolean;
    message: string;
    data: { product: AdminProduct };
  }>("/admin/products", payload);
  return response.data;
};

/**
 * 6. Cập nhật thông tin sản phẩm: tên, mô tả, basePrice, categoryId, isActive (Chỉ ADMIN)
 * PUT /api/admin/products/:id
 */
export const updateAdminProductApi = async (
  productId: string,
  payload: UpdateProductPayload
): Promise<{ success: boolean; message: string; data: { product: AdminProduct } }> => {
  const response = await baseAPI.put<{
    success: boolean;
    message: string;
    data: { product: AdminProduct };
  }>(`/admin/products/${encodeURIComponent(productId)}`, payload);
  return response.data;
};

/**
 * 7. Ẩn sản phẩm khỏi hệ thống bán hàng (Chỉ ADMIN)
 * DELETE /api/admin/products/:id
 */
export const deleteAdminProductApi = async (
  productId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await baseAPI.delete<{ success: boolean; message: string }>(
    `/admin/products/${encodeURIComponent(productId)}`
  );
  return response.data;
};

/**
 * 8. Lấy danh sách Voucher (Chỉ ADMIN)
 * GET /api/admin/vouchers
 */
export const getAdminVouchersApi = async (): Promise<AdminVouchersResponse> => {
  const response = await baseAPI.get<AdminVouchersResponse>("/admin/vouchers");
  return response.data;
};

/**
 * 9. Tạo Voucher mới (Chỉ ADMIN)
 * POST /api/admin/vouchers
 */
export const createAdminVoucherApi = async (
  payload: CreateVoucherPayload
): Promise<{ success: boolean; message: string; data: { voucher: AdminVoucher } }> => {
  const response = await baseAPI.post<{
    success: boolean;
    message: string;
    data: { voucher: AdminVoucher };
  }>("/admin/vouchers", payload);
  return response.data;
};

/**
 * 10. Cập nhật thông tin Voucher (Chỉ ADMIN)
 * PUT /api/admin/vouchers/:id
 */
export const updateAdminVoucherApi = async (
  voucherId: string,
  payload: UpdateVoucherPayload
): Promise<{ success: boolean; message: string; data: { voucher: AdminVoucher } }> => {
  const response = await baseAPI.put<{
    success: boolean;
    message: string;
    data: { voucher: AdminVoucher };
  }>(`/admin/vouchers/${encodeURIComponent(voucherId)}`, payload);
  return response.data;
};

/**
 * 11. Vô hiệu hóa Voucher (Chỉ ADMIN)
 * DELETE /api/admin/vouchers/:id
 */
export const deleteAdminVoucherApi = async (
  voucherId: string
): Promise<{ success: boolean; message: string; data: { voucher: AdminVoucher } }> => {
  const response = await baseAPI.delete<{
    success: boolean;
    message: string;
    data: { voucher: AdminVoucher };
  }>(`/admin/vouchers/${encodeURIComponent(voucherId)}`);
  return response.data;
};

/**
 * 12. Lấy danh sách tài khoản Người dùng & Nhân viên (Chỉ ADMIN)
 * GET /api/admin/users
 */
export const getAdminUsersApi = async (params?: {
  role?: string;
  q?: string;
  page?: number | string;
  limit?: number | string;
}): Promise<AdminUsersResponse> => {
  const queryParams: Record<string, string | number> = {};
  if (params?.role && params.role !== "ALL") {
    queryParams.role = params.role;
  }
  if (params?.q && params.q.trim()) {
    queryParams.q = params.q.trim();
  }
  if (params?.page) {
    queryParams.page = params.page;
  }
  if (params?.limit) {
    queryParams.limit = params.limit;
  }

  const response = await baseAPI.get<AdminUsersResponse>("/admin/users", {
    params: queryParams,
  });
  return response.data;
};

/**
 * 13. Tạo tài khoản mới từ Admin (Chỉ ADMIN)
 * POST /api/admin/users
 */
export const createAdminUserApi = async (
  payload: CreateUserPayload
): Promise<{ success: boolean; message: string; data: { user: AdminUser } }> => {
  const response = await baseAPI.post<{
    success: boolean;
    message: string;
    data: { user: AdminUser };
  }>("/admin/users", payload);
  return response.data;
};

/**
 * 14. Cập nhật thông tin tài khoản người dùng/nhân viên (Chỉ ADMIN)
 * PUT /api/admin/users/:id
 */
export const updateAdminUserApi = async (
  userId: string,
  payload: UpdateUserPayload
): Promise<{ success: boolean; message: string; data: { user: AdminUser } }> => {
  const response = await baseAPI.put<{
    success: boolean;
    message: string;
    data: { user: AdminUser };
  }>(`/admin/users/${encodeURIComponent(userId)}`, payload);
  return response.data;
};

