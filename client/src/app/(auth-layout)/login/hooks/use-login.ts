"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type UseFormSetError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLoginMutation, type LoginRequest, type LoginResponse } from "../api/login.api";
import { loginSchema, type LoginFormValues } from "../validation/login.validation";
import { useAuthStore } from "@/stores/auth.store";
import { getOrCreateSessionId } from "@/api/axios.api";
import { getApiErrorCode, getApiErrorMessage, getApiFieldErrors } from "@/lib/error";
import { toast } from "react-toastify";

interface UseLoginOptions {
  onSuccess?: (res: LoginResponse) => void;
}

/**
 * Hook xử lý logic đăng nhập, tích hợp guestSessionId phục vụ Cart Merge,
 * lưu trữ token vào localStorage và đồng bộ reactive state với Zustand authStore.
 */
export function useLogin(
  setError: UseFormSetError<LoginFormValues>,
  options?: UseLoginOptions
) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const setAuth = useAuthStore((state) => state.setAuth);
  const loginMutation = useLoginMutation();

  const handleLogin = (formData: LoginFormValues) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const guestSessionId = getOrCreateSessionId();

    const payload: LoginRequest = {
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      guestSessionId: guestSessionId || undefined,
    };

    loginMutation.mutate(payload, {
      onSuccess: (res) => {
        const { user, accessToken } = res.data;
        // Cập nhật Auth Store
        setAuth(user, accessToken);

        const welcomeMsg = `Đăng nhập thành công! Xin chào ${user.fullName}`;
        setSuccessMessage(welcomeMsg);
        toast.success(welcomeMsg);

        if (options?.onSuccess) {
          options.onSuccess(res);
        } else {
          // Điều hướng về returnUrl nếu có, hoặc vào admin nếu quyền ADMIN, ngược lại về trang chủ
          const returnUrl = searchParams.get("returnUrl");
          setTimeout(() => {
            if (returnUrl) {
              router.push(decodeURIComponent(returnUrl));
            } else if (user.role === "ADMIN") {
              router.push("/admin");
            } else {
              router.push("/");
            }
          }, 800);
        }
      },
      onError: (err) => {
        const errorCode = getApiErrorCode(err);
        const fallbackMsg = getApiErrorMessage(err, "Đăng nhập thất bại. Vui lòng thử lại!");
        const fieldErrors = getApiFieldErrors(err);

        switch (errorCode) {
          case "AUTH_INVALID_CREDENTIALS":
            setError("password", {
              type: "server",
              message: "Email hoặc mật khẩu không chính xác.",
            });
            setErrorMessage("Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.");
            break;

          case "RATE_LIMIT_EXCEEDED":
            setErrorMessage("Bạn thao tác quá nhiều lần. Vui lòng chờ 1 phút rồi thử lại.");
            toast.warning("Thao tác quá nhanh, vui lòng chờ 1 phút!");
            break;

          case "VALIDATION_ERROR":
            if (fieldErrors.length > 0) {
              fieldErrors.forEach((e) => {
                const fieldName = e.field as keyof LoginFormValues;
                if (fieldName) {
                  setError(fieldName, {
                    type: "server",
                    message: e.message,
                  });
                }
              });
              setErrorMessage("Thông tin đăng nhập không hợp lệ.");
            } else {
              setErrorMessage(fallbackMsg);
            }
            break;

          default:
            setErrorMessage(fallbackMsg);
            break;
        }
      },
    });
  };

  return {
    handleLogin,
    isSubmitting: loginMutation.isPending,
    errorMessage,
    successMessage,
    setErrorMessage,
    setSuccessMessage,
  };
}

/**
 * Hook trọn gói kết hợp React Hook Form + Zod + Login Mutation
 */
export function useLoginForm(options?: UseLoginOptions) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginLogic = useLogin(form.setError, options);

  const handleSubmit = form.handleSubmit((data) => {
    loginLogic.handleLogin(data);
  });

  return {
    ...form,
    errors: form.formState.errors,
    handleSubmit,
    ...loginLogic,
  };
}

