import { emptyDb, type MockDbData } from "./schema";
import { seedData } from "./seeds";

/** Bump when MockDbData shape changes so stale browser localStorage is discarded. */
const STORAGE_KEY = "grifto.mockdb.v8";

type DbPersister = {
  load: () => MockDbData | null;
  save: (data: MockDbData) => void;
};

let nodePersister: DbPersister | null = null;

/** Called by the shared HTTP server so Node can persist to disk (browser-safe module). */
export function setNodePersister(persister: DbPersister): void {
  nodePersister = persister;
}

/** Fill fields added after older persisted DBs were written. */
function normalizeDb(data: MockDbData): MockDbData {
  if (!Array.isArray(data.media)) data.media = [];
  for (const entry of data.cmsEntries ?? []) {
    if (entry.mobileImageUrl === undefined) {
      (entry as { mobileImageUrl: string | null }).mobileImageUrl = null;
    }
  }
  return data;
}

/**
 * The mock database: in-memory, persisted so data survives reloads.
 * - Browser MSW: localStorage
 * - Shared Node server: file via setNodePersister (packages/mock-api/.data/db.json)
 */
class MockDb {
  private data: MockDbData | null = null;

  get(): MockDbData {
    if (this.data) return this.data;
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.data = normalizeDb(JSON.parse(raw) as MockDbData);
          return this.data;
        }
      } catch {
        // fall through to seed
      }
    } else if (nodePersister) {
      const fromFile = nodePersister.load();
      if (fromFile) {
        this.data = normalizeDb(fromFile);
        return this.data;
      }
    }
    this.data = structuredClone(seedData);
    this.persist();
    return this.data;
  }

  /** Mutate the DB inside `fn`; changes are persisted afterwards. */
  mutate<T>(fn: (data: MockDbData) => T): T {
    const result = fn(this.get());
    this.persist();
    return result;
  }

  reset(): void {
    this.data = structuredClone(seedData);
    this.persist();
  }

  clear(): void {
    this.data = structuredClone(emptyDb);
    this.persist();
  }

  private persist(): void {
    if (!this.data) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      return;
    }
    nodePersister?.save(this.data);
  }
}

export const db = new MockDb();

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
