import { emptyDb, type MockDbData } from "./schema";
import { seedData } from "./seeds";

/** Bump the version suffix whenever MockDbData gains collections — stale persisted DBs are discarded and reseeded. */
const STORAGE_KEY = "grifto.mockdb.v7";

/**
 * The mock database: in-memory, persisted to localStorage so data survives
 * reloads during development. `resetDb()` restores the seed state.
 */
class MockDb {
  private data: MockDbData | null = null;

  get(): MockDbData {
    if (this.data) return this.data;
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.data = JSON.parse(raw) as MockDbData;
          return this.data;
        }
      } catch {
        // fall through to seed
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
    if (typeof window !== "undefined" && this.data) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }
  }
}

export const db = new MockDb();

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
