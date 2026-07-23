import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { MockDbData } from "./schema";
import { setNodePersister } from "./db";

function fileDbPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "../../.data/db.json");
}

/** Wire file-backed persistence for the shared mock HTTP server. */
export function enableFilePersistence(): void {
  setNodePersister({
    load() {
      try {
        const raw = readFileSync(fileDbPath(), "utf8");
        return JSON.parse(raw) as MockDbData;
      } catch {
        return null;
      }
    },
    save(data) {
      const path = fileDbPath();
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, JSON.stringify(data), "utf8");
    },
  });
}
