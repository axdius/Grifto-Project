"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiContract,
  type AddressRequest,
  type Contribution,
  type CreateContributionBody,
  type CreateGiftMessageBody,
  type CreateReservationBody,
  type GuestIdentifyBody,
  type GuestSession,
} from "@grifto/contracts";
import { useApiClient } from "../provider";
import type { ApiError } from "../errors";

export function useIdentifyGuest() {
  const client = useApiClient();
  return useMutation<GuestSession, ApiError, GuestIdentifyBody>({
    mutationFn: (body) => client.request(apiContract.guest.identify, { body }),
  });
}

export function useCreateContribution() {
  const client = useApiClient();
  return useMutation<Contribution, ApiError, CreateContributionBody>({
    mutationFn: (body) => client.request(apiContract.guest.createContribution, { body }),
  });
}

export function useVerifyContribution(shareSlug: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<
    Contribution,
    ApiError,
    { contributionId: string; gatewayPaymentId: string | null; outcome: "success" | "failed" }
  >({
    mutationFn: ({ contributionId, ...body }) =>
      client.request(apiContract.guest.verifyContribution, {
        params: { contributionId },
        body,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["public", "wishlist", shareSlug] });
    },
  });
}

export function useReserveItem(shareSlug: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<{ ok: true; itemId: string }, ApiError, CreateReservationBody>({
    mutationFn: (body) => client.request(apiContract.guest.createReservation, { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["public", "wishlist", shareSlug] });
    },
  });
}

export function useSendGiftMessage() {
  const client = useApiClient();
  return useMutation<
    { ok: true; addressRequestId: string | null },
    ApiError,
    CreateGiftMessageBody
  >({
    mutationFn: (body) => client.request(apiContract.guest.createGiftMessage, { body }),
  });
}

export const addressRequestKeys = {
  list: ["address-requests"] as const,
};

export function useAddressRequests() {
  const client = useApiClient();
  return useQuery<{ items: AddressRequest[] }, ApiError>({
    queryKey: addressRequestKeys.list,
    queryFn: () => client.request(apiContract.guest.listAddressRequests),
  });
}

export function useDecideAddressRequest() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<
    AddressRequest,
    ApiError,
    { requestId: string; decision: "approved" | "rejected" }
  >({
    mutationFn: ({ requestId, decision }) =>
      client.request(apiContract.guest.decideAddressRequest, {
        params: { requestId },
        body: { decision },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: addressRequestKeys.list });
    },
  });
}
