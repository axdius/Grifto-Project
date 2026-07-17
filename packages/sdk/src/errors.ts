import { problemSchema, type Problem } from "@grifto/contracts";

/** Typed API error carrying the RFC 9457 problem document. */
export class ApiError extends Error {
  readonly problem: Problem;

  constructor(problem: Problem) {
    super(problem.detail ?? problem.title);
    this.name = "ApiError";
    this.problem = problem;
  }

  get code(): string {
    return this.problem.code;
  }

  get status(): number {
    return this.problem.status;
  }
}

export async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body: unknown = await response.json();
    return new ApiError(problemSchema.parse(body));
  } catch {
    return new ApiError({
      type: "about:blank",
      title: response.statusText || "Request failed",
      status: response.status,
      code: "UNKNOWN_ERROR",
    });
  }
}
