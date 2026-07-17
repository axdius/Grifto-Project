export * from "./endpoint";
export * from "./common";
export * from "./auth";
export * from "./wishlist";
export * from "./catalog";
export * from "./public-wishlist";
export * from "./guest";
export * from "./wallet";
export * from "./admin";
export * from "./cms";
export * from "./theme";

import { authEndpoints } from "./auth";
import { wishlistEndpoints } from "./wishlist";
import { catalogEndpoints } from "./catalog";
import { publicEndpoints } from "./public-wishlist";
import { guestEndpoints } from "./guest";
import { notificationEndpoints, walletEndpoints } from "./wallet";
import { adminEndpoints } from "./admin";
import { analyticsEndpoints, cmsEndpoints } from "./cms";
import { themeEndpoints } from "./theme";

/** The full API surface. Modules are added here as milestones land. */
export const apiContract = {
  auth: authEndpoints,
  wishlist: wishlistEndpoints,
  catalog: catalogEndpoints,
  public: publicEndpoints,
  guest: guestEndpoints,
  wallet: walletEndpoints,
  notifications: notificationEndpoints,
  admin: adminEndpoints,
  cms: cmsEndpoints,
  analytics: analyticsEndpoints,
  theme: themeEndpoints,
} as const;

export type ApiContract = typeof apiContract;
