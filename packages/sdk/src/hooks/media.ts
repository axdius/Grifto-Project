"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiContract, type MediaAsset, type UploadMediaBody } from "@grifto/contracts";
import { useApiClient } from "../provider";
import type { ApiError } from "../errors";

export function useAdminMedia() {
  const client = useApiClient();
  return useQuery<{ items: MediaAsset[] }, ApiError>({
    queryKey: ["media", "admin"],
    queryFn: () => client.request(apiContract.media.listAdmin),
  });
}

export function useUploadMedia() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<MediaAsset, ApiError, UploadMediaBody>({
    mutationFn: (body) => client.request(apiContract.media.upload, { body }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["media"] }),
  });
}

export function useDeleteMedia() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<{ ok: true }, ApiError, { mediaId: string }>({
    mutationFn: ({ mediaId }) =>
      client.request(apiContract.media.remove, { params: { mediaId } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["media"] }),
  });
}

/** Read a File as raw base64 (no data: URL prefix) for the mock media upload API. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unexpected file reader result"));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}
