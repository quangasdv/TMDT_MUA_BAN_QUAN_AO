"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormSetError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useRegisterMutation,
  type RegisterRequest,
  type RegisterResponse,
} from "../api/register.api";
import {
  registerSchema,
  type RegisterFormValues,
} from "../validation/register.validation";

interface UseRegisterOptions {
  onSuccess?: (res: RegisterResponse) => void;
}

/**
 * Hook xử lý logic gọi API đăng ký, chuyển đổi dữ liệu và phân nhánh mã lỗi (ErrorCode)
 * theo đúng quy chuẩn mục 2.1, 3.1 và 3.2 của API_DOCUMENTATION.md.
 */
export function useRegister(
  setError: UseFormSetError<RegisterFormValues>,
  options?: UseRegisterOptions
) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const registerMutation = useRegisterMutation();

  const handleRegister = (formData: RegisterFormValues) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Chuẩn bị payload chuẩn theo mục 2.1 API_DOCUMENTATION.md
    const payload: RegisterRequest = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      ...(formData.phone?.trim() ? { phone: formData.phone.trim() } : {}),
    };

    registerMutation.mutate(payload, {
      onSuccess: (res) => {
        setSuccessMessage(
          res.message || "Đăng ký tài khoản thành công! Đang chuyển hướng sang đăng nhập..."
        );

        if (options?.onSuccess) {
          options.onSuccess(res);
        } else {
          setTimeout(() => {
            router.push("/login");
          }, 1500);
        }
      },
      onError: (err) => {
        const errorData = err.response?.data;
        const status = err.response?.status;
        const errorCode = errorData?.errorCode;
        const fallbackMsg =
          errorData?.message ||
          "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin đăng ký.";

        // Phân nhánh mã lỗi định danh theo mục 3.1 & 3.2
        switch (errorCode) {
          case "AUTH_EMAIL_EXISTS":
            // Email đã tồn tại: Tô đỏ ô email và gợi ý người dùng
            setError("email", {
              type: "server",
              message: "Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.",
            });
            setErrorMessage("Email đã tồn tại trong hệ thống. Vui lòng đăng nhập hoặc sử dụng email khác.");
            break;

          case "VALIDATION_ERROR":
            // Sai định dạng Zod từ server: Duyệt mảng errors để tô đỏ từng ô input tương ứng
            if (Array.isArray(errorData?.errors) && errorData.errors.length > 0) {
              errorData.errors.forEach((e) => {
                const fieldName = e.field as keyof RegisterFormValues;
                if (fieldName) {
                  setError(fieldName, {
                    type: "server",
                    message: e.message,
                  });
                }
              });
              setErrorMessage("Thông tin gửi lên chưa hợp lệ. Vui lòng kiểm tra các trường được đánh dấu đỏ.");
            } else {
              setErrorMessage(fallbackMsg);
            }
            break;

          case "RATE_LIMIT_EXCEEDED":
            // Quá nhiều request (HTTP 429)
            setErrorMessage("Thao tác quá nhanh. Vui lòng chờ 1 phút rồi thử lại.");
            break;

          case "INTERNAL_SERVER_ERROR":
            // Lỗi máy chủ (HTTP 500)
            setErrorMessage("Hệ thống máy chủ đang bận hoặc gián đoạn kết nối. Vui lòng thử lại sau ít phút!");
            break;

          default:
            if (status === 429) {
              setErrorMessage("Bạn thao tác quá nhanh, vui lòng chờ 1 phút rồi thử lại.");
            } else if (status && status >= 500) {
              setErrorMessage("Lỗi máy chủ không mong muốn. Vui lòng thử lại sau!");
            } else {
              setErrorMessage(fallbackMsg);
            }
            break;
        }
      },
    });
  };

  return {
    handleRegister,
    isSubmitting: registerMutation.isPending,
    errorMessage,
    successMessage,
    setErrorMessage,
    setSuccessMessage,
  };
}

/**
 * Hook tiện ích trọn gói kết hợp React Hook Form + Zod + Logic gọi API
 */
export function useRegisterForm(options?: UseRegisterOptions) {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerLogic = useRegister(form.setError, options);

  const handleSubmit = form.handleSubmit((data) => {
    registerLogic.handleRegister(data);
  });

  return {
    ...form,
    errors: form.formState.errors,
    handleSubmit,
    ...registerLogic,
  };
}
