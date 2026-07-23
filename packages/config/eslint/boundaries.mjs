/**
 * Architectural boundary rules for app code (components, features, app routes).
 *
 * The layering contract (plan §2 / architecture doc 04):
 *   Component -> Hook -> SDK (typed client) -> HTTP -> mock-api | real API
 *
 * Enforced here so violations fail CI instead of relying on review:
 *  - no raw fetch()/axios in UI code (use @grifto/sdk hooks)
 *  - no direct localStorage/sessionStorage (use platform-services StorageService / session provider)
 *  - no importing mock internals into app code (use the shared mock HTTP server via SDK)
 */
export const appBoundaryRules = {
  files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "features/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-globals": [
      "error",
      { name: "fetch", message: "Do not call fetch() in UI code. Use hooks from @grifto/sdk." },
      { name: "localStorage", message: "Use StorageService from @grifto/platform-services." },
      { name: "sessionStorage", message: "Use StorageService from @grifto/platform-services." },
    ],
    "no-restricted-properties": [
      "error",
      { object: "window", property: "fetch", message: "Use hooks from @grifto/sdk." },
      { object: "window", property: "localStorage", message: "Use StorageService from @grifto/platform-services." },
      { object: "window", property: "sessionStorage", message: "Use StorageService from @grifto/platform-services." },
    ],
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@grifto/mock-api", "@grifto/mock-api/*"],
            message: "Do not import mock-api in app code. Talk to the shared mock server via @grifto/sdk.",
          },
        ],
      },
    ],
  },
};

/** Files allowed to wire providers and touch browser storage primitives. */
export const boundaryExemptions = {
  files: ["providers/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": "off",
    "no-restricted-globals": "off",
    "no-restricted-properties": "off",
  },
};
