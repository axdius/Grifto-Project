import { authHandlers } from "./handlers/auth";
import { wishlistHandlers } from "./handlers/wishlist";
import { catalogHandlers } from "./handlers/catalog";
import { publicWishlistHandlers } from "./handlers/public-wishlist";
import { guestHandlers } from "./handlers/guest";
import { notificationHandlers, walletHandlers } from "./handlers/wallet";
import { adminHandlers } from "./handlers/admin";
import { analyticsHandlers, cmsHandlers } from "./handlers/cms";
import { themeHandlers } from "./handlers/theme";

export const handlers = [
  ...authHandlers,
  ...wishlistHandlers,
  ...catalogHandlers,
  ...publicWishlistHandlers,
  ...guestHandlers,
  ...walletHandlers,
  ...notificationHandlers,
  ...adminHandlers,
  ...cmsHandlers,
  ...analyticsHandlers,
  ...themeHandlers,
];

export { db as mockDb } from "./db/db";
export { seedData } from "./db/seeds";
export { mockConfig } from "./http";
