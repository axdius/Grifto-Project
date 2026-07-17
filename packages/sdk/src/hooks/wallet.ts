"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiContract,
  type CreateWithdrawalBody,
  type LedgerEntry,
  type Notification,
  type WalletSummary,
  type Withdrawal,
} from "@grifto/contracts";
import { useApiClient } from "../provider";
import type { ApiError } from "../errors";

export const walletKeys = {
  summary: ["wallet", "summary"] as const,
  transactions: ["wallet", "transactions"] as const,
  withdrawals: ["wallet", "withdrawals"] as const,
  notifications: ["notifications"] as const,
};

export function useWallet() {
  const client = useApiClient();
  return useQuery<WalletSummary, ApiError>({
    queryKey: walletKeys.summary,
    queryFn: () => client.request(apiContract.wallet.getWallet),
  });
}

export function useWalletTransactions() {
  const client = useApiClient();
  return useQuery<{ items: LedgerEntry[] }, ApiError>({
    queryKey: walletKeys.transactions,
    queryFn: () => client.request(apiContract.wallet.listTransactions),
  });
}

export function useWithdrawals() {
  const client = useApiClient();
  return useQuery<{ items: Withdrawal[] }, ApiError>({
    queryKey: walletKeys.withdrawals,
    queryFn: () => client.request(apiContract.wallet.listWithdrawals),
  });
}

export function useCreateWithdrawal() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<Withdrawal, ApiError, CreateWithdrawalBody>({
    mutationFn: (body) => client.request(apiContract.wallet.createWithdrawal, { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
      void queryClient.invalidateQueries({ queryKey: walletKeys.notifications });
    },
  });
}

export function useNotifications() {
  const client = useApiClient();
  return useQuery<{ items: Notification[]; unreadCount: number }, ApiError>({
    queryKey: walletKeys.notifications,
    queryFn: () => client.request(apiContract.notifications.list),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationsRead() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<{ ok: true }, ApiError, { ids?: string[] }>({
    mutationFn: (body) => client.request(apiContract.notifications.markRead, { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.notifications });
    },
  });
}
