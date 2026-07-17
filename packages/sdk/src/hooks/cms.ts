"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiContract,
  type AdminAnalytics,
  type CmsEntry,
  type CmsEntryKind,
  type UpsertCmsEntryBody,
} from "@grifto/contracts";
import { useApiClient } from "../provider";
import type { ApiError } from "../errors";

export function usePublicCmsEntries(kind?: CmsEntryKind) {
  const client = useApiClient();
  return useQuery<{ items: CmsEntry[] }, ApiError>({
    queryKey: ["cms", "public", kind ?? "all"],
    queryFn: () => client.request(apiContract.cms.listPublic, { query: { kind } }),
    staleTime: 60_000,
  });
}

export function useAdminCmsEntries(kind?: CmsEntryKind) {
  const client = useApiClient();
  return useQuery<{ items: CmsEntry[] }, ApiError>({
    queryKey: ["cms", "admin", kind ?? "all"],
    queryFn: () => client.request(apiContract.cms.listAdmin, { query: { kind } }),
  });
}

export function useCreateCmsEntry() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<CmsEntry, ApiError, UpsertCmsEntryBody>({
    mutationFn: (body) => client.request(apiContract.cms.create, { body }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["cms"] }),
  });
}

export function useUpdateCmsEntry() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<CmsEntry, ApiError, { entryId: string; body: Partial<UpsertCmsEntryBody> }>({
    mutationFn: ({ entryId, body }) =>
      client.request(apiContract.cms.update, { params: { entryId }, body }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["cms"] }),
  });
}

export function useDeleteCmsEntry() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<{ ok: true }, ApiError, { entryId: string }>({
    mutationFn: ({ entryId }) => client.request(apiContract.cms.remove, { params: { entryId } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["cms"] }),
  });
}

export function useAdminAnalytics() {
  const client = useApiClient();
  return useQuery<AdminAnalytics, ApiError>({
    queryKey: ["admin", "analytics"],
    queryFn: () => client.request(apiContract.analytics.get),
  });
}
