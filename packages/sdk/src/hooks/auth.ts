"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiContract,
  type AuthSession,
  type LoginBody,
  type RegisterBody,
  type User,
} from "@grifto/contracts";
import { useApiClient } from "../provider";
import { ApiError } from "../errors";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export function useMe() {
  const client = useApiClient();
  return useQuery<User, ApiError>({
    queryKey: authKeys.me,
    queryFn: () => client.request(apiContract.auth.me),
    retry: (failureCount, error) =>
      error instanceof ApiError && error.status === 401 ? false : failureCount < 2,
  });
}

export function useLogin() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<AuthSession, ApiError, LoginBody>({
    mutationFn: (body) => client.request(apiContract.auth.login, { body }),
    onSuccess: (session) => {
      client.config.tokenStore.setTokens(session.tokens);
      queryClient.setQueryData(authKeys.me, session.user);
    },
  });
}

export function useRegister() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<AuthSession, ApiError, RegisterBody>({
    mutationFn: (body) => client.request(apiContract.auth.register, { body }),
    onSuccess: (session) => {
      client.config.tokenStore.setTokens(session.tokens);
      queryClient.setQueryData(authKeys.me, session.user);
    },
  });
}

export function useLogout() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<{ ok: true }, ApiError, void>({
    mutationFn: () => {
      const refreshToken = client.config.tokenStore.getRefreshToken() ?? "";
      return client.request(apiContract.auth.logout, { body: { refreshToken } });
    },
    onSettled: () => {
      client.config.tokenStore.clear();
      queryClient.clear();
    },
  });
}
