import cors from "cors";
import express from "express";
import { createMiddleware } from "@mswjs/http-middleware";
import { enableFilePersistence } from "./db/file-persist";
import { handlers } from "./index";

enableFilePersistence();

const PORT = Number(process.env.MOCK_API_PORT ?? 4000);
const ORIGINS = ["http://localhost:3000", "http://localhost:3001"];

const app = express();
app.use(
  cors({
    origin: ORIGINS,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
// Base64 image uploads inflate ~33% over raw file size; allow large hero assets.
app.use(express.json({ limit: "20mb" }));
app.use(createMiddleware(...handlers));

const server = app.listen(PORT, () => {
  console.log(`[mock-api] listening on http://localhost:${PORT}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[mock-api] port ${PORT} is already in use. Stop the other process (lsof -ti:${PORT} | xargs kill) then restart pnpm dev.`,
    );
  } else {
    console.error("[mock-api] failed to start:", err);
  }
  process.exit(1);
});
