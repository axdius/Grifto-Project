"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiContract,
  type ThemeDocument,
  type ThemeDraft,
  type ThemeVersion,
} from "@grifto/contracts";
import { useApiClient } from "../provider";
import type { ApiError } from "../errors";

export const themeKeys = {
  published: ["theme", "published"] as const,
  draft: ["theme", "draft"] as const,
  versions: ["theme", "versions"] as const,
};

export function usePublishedTheme() {
  const client = useApiClient();
  return useQuery<ThemeDocument, ApiError>({
    queryKey: themeKeys.published,
    queryFn: () => client.request(apiContract.theme.getPublished),
    staleTime: 60_000,
  });
}

export function useThemeDraft() {
  const client = useApiClient();
  return useQuery<ThemeDraft, ApiError>({
    queryKey: themeKeys.draft,
    queryFn: () => client.request(apiContract.theme.getDraft),
  });
}

export function useSaveThemeDraft() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<ThemeDraft, ApiError, ThemeDocument>({
    mutationFn: (body) => client.request(apiContract.theme.saveDraft, { body }),
    onSuccess: (draft) => queryClient.setQueryData(themeKeys.draft, draft),
  });
}

export function usePublishTheme() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<ThemeVersion, ApiError, void>({
    mutationFn: () => client.request(apiContract.theme.publish),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["theme"] });
    },
  });
}

export function useDiscardThemeDraft() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<ThemeDraft, ApiError, void>({
    mutationFn: () => client.request(apiContract.theme.discardDraft),
    onSuccess: (draft) => queryClient.setQueryData(themeKeys.draft, draft),
  });
}

export function useThemeVersions() {
  const client = useApiClient();
  return useQuery<{ items: ThemeVersion[] }, ApiError>({
    queryKey: themeKeys.versions,
    queryFn: () => client.request(apiContract.theme.listVersions),
  });
}

export function useRestoreThemeVersion() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<ThemeDraft, ApiError, { versionId: string }>({
    mutationFn: ({ versionId }) =>
      client.request(apiContract.theme.restoreVersion, { params: { versionId } }),
    onSuccess: (draft) => queryClient.setQueryData(themeKeys.draft, draft),
  });
}
