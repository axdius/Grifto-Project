import type { z } from "zod";

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/**
 * A single API endpoint contract.
 *
 * This object is the single source of truth consumed by:
 *  - @grifto/sdk        → builds the typed request function
 *  - @grifto/mock-api   → builds the MSW handler (validates request, types the resolver)
 *  - the future NestJS backend → implements the same path/schemas
 */
export interface EndpointDef<
  TParams extends z.ZodTypeAny | undefined,
  TQuery extends z.ZodTypeAny | undefined,
  TBody extends z.ZodTypeAny | undefined,
  TResponse extends z.ZodTypeAny,
> {
  method: HttpMethod;
  /** Path with :param placeholders, e.g. "/v1/wishlists/:wishlistId/items" */
  path: string;
  /** Requires an authenticated user (SDK attaches token; mock enforces it). */
  auth?: boolean;
  params?: TParams;
  query?: TQuery;
  body?: TBody;
  response: TResponse;
}

export type AnyEndpoint = EndpointDef<
  z.ZodTypeAny | undefined,
  z.ZodTypeAny | undefined,
  z.ZodTypeAny | undefined,
  z.ZodTypeAny
>;

export type InferOrUndefined<T> = T extends z.ZodTypeAny ? z.infer<T> : undefined;

export function defineEndpoint<
  TParams extends z.ZodTypeAny | undefined = undefined,
  TQuery extends z.ZodTypeAny | undefined = undefined,
  TBody extends z.ZodTypeAny | undefined = undefined,
  TResponse extends z.ZodTypeAny = z.ZodTypeAny,
>(
  def: EndpointDef<TParams, TQuery, TBody, TResponse>,
): EndpointDef<TParams, TQuery, TBody, TResponse> {
  return def;
}
