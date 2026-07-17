"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiContract,
  type AdminContribution,
  type AdminCustomer,
  type AdminCustomerDetail,
  type AdminMetrics,
  type AdminWithdrawal,
  type PlatformSettings,
  type Product,
  type UpsertProductBody,
  type WithdrawalStatus,
} from "@grifto/contracts";
import { useApiClient } from "../provider";
import type { ApiError } from "../errors";

export function useAdminMetrics() {
  const client = useApiClient();
  return useQuery<AdminMetrics, ApiError>({
    queryKey: ["admin", "metrics"],
    queryFn: () => client.request(apiContract.admin.getMetrics),
  });
}

export function useAdminCustomers(search?: string) {
  const client = useApiClient();
  return useQuery<{ items: AdminCustomer[] }, ApiError>({
    queryKey: ["admin", "customers", search ?? ""],
    queryFn: () =>
      client.request(apiContract.admin.listCustomers, {
        query: { search: search || undefined },
      }),
  });
}

export function useAdminCustomer(customerId: string) {
  const client = useApiClient();
  return useQuery<AdminCustomerDetail, ApiError>({
    queryKey: ["admin", "customers", "detail", customerId],
    queryFn: () => client.request(apiContract.admin.getCustomer, { params: { customerId } }),
  });
}

export function useAdminContributions() {
  const client = useApiClient();
  return useQuery<{ items: AdminContribution[] }, ApiError>({
    queryKey: ["admin", "contributions"],
    queryFn: () => client.request(apiContract.admin.listContributions),
  });
}

export function useAdminWithdrawals(status?: WithdrawalStatus) {
  const client = useApiClient();
  return useQuery<{ items: AdminWithdrawal[] }, ApiError>({
    queryKey: ["admin", "withdrawals", status ?? "all"],
    queryFn: () =>
      client.request(apiContract.admin.listWithdrawals, { query: { status } }),
  });
}

export function useDecideWithdrawal() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<
    AdminWithdrawal,
    ApiError,
    { withdrawalId: string; decision: "approved" | "completed" | "rejected" }
  >({
    mutationFn: ({ withdrawalId, decision }) =>
      client.request(apiContract.admin.decideWithdrawal, {
        params: { withdrawalId },
        body: { decision },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "metrics"] });
    },
  });
}

export function useCreateProduct() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<Product, ApiError, UpsertProductBody>({
    mutationFn: (body) => client.request(apiContract.admin.createProduct, { body }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["catalog", "products"] }),
  });
}

export function useUpdateProduct() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<Product, ApiError, { productId: string; body: Partial<UpsertProductBody> }>({
    mutationFn: ({ productId, body }) =>
      client.request(apiContract.admin.updateProduct, { params: { productId }, body }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["catalog", "products"] }),
  });
}

export function useDeleteProduct() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<{ ok: true }, ApiError, { productId: string }>({
    mutationFn: ({ productId }) =>
      client.request(apiContract.admin.deleteProduct, { params: { productId } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["catalog", "products"] }),
  });
}

export function usePlatformSettings() {
  const client = useApiClient();
  return useQuery<PlatformSettings, ApiError>({
    queryKey: ["admin", "settings"],
    queryFn: () => client.request(apiContract.admin.getSettings),
  });
}

export function useUpdatePlatformSettings() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<PlatformSettings, ApiError, Partial<PlatformSettings>>({
    mutationFn: (body) => client.request(apiContract.admin.updateSettings, { body }),
    onSuccess: (settings) => queryClient.setQueryData(["admin", "settings"], settings),
  });
}
