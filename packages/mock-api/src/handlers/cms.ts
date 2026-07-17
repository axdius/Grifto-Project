import { http } from "msw";
import { upsertCmsEntryBodySchema, type AdminAnalytics, type CmsEntry } from "@grifto/contracts";
import { db, newId } from "../db/db";
import type { DbCmsEntry } from "../db/schema";
import { ok, problem, simulateLatency } from "../http";

function toDto(entry: DbCmsEntry): CmsEntry {
  return { ...entry };
}

function filterByKind(entries: DbCmsEntry[], kind: string | null): DbCmsEntry[] {
  return entries
    .filter((e) => !kind || e.kind === kind)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export const cmsHandlers = [
  http.get("*/v1/cms/entries", async ({ request }) => {
    await simulateLatency();
    const kind = new URL(request.url).searchParams.get("kind");
    const items = filterByKind(db.get().cmsEntries, kind)
      .filter((e) => e.published)
      .map(toDto);
    return ok({ items });
  }),

  http.get("*/v1/admin/cms/entries", async ({ request }) => {
    await simulateLatency();
    const kind = new URL(request.url).searchParams.get("kind");
    return ok({ items: filterByKind(db.get().cmsEntries, kind).map(toDto) });
  }),

  http.post("*/v1/admin/cms/entries", async ({ request }) => {
    await simulateLatency();
    const parsed = upsertCmsEntryBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return problem(422, "VALIDATION_ERROR", "Validation failed", parsed.error.issues[0]?.message);
    }
    const body = parsed.data;
    const entry = db.mutate((data) => {
      const created: DbCmsEntry = {
        id: newId("cms"),
        kind: body.kind,
        title: body.title,
        body: body.body,
        imageUrl: body.imageUrl ?? null,
        published: body.published,
        sortOrder: data.cmsEntries.filter((e) => e.kind === body.kind).length,
        updatedAt: new Date().toISOString(),
      };
      data.cmsEntries.push(created);
      return created;
    });
    return ok(toDto(entry), 201);
  }),

  http.patch("*/v1/admin/cms/entries/:entryId", async ({ request, params }) => {
    await simulateLatency();
    const parsed = upsertCmsEntryBodySchema.partial().safeParse(await request.json());
    if (!parsed.success) {
      return problem(422, "VALIDATION_ERROR", "Validation failed", parsed.error.issues[0]?.message);
    }
    const updated = db.mutate((data) => {
      const entry = data.cmsEntries.find((e) => e.id === params.entryId);
      if (!entry) return null;
      Object.assign(entry, parsed.data, { updatedAt: new Date().toISOString() });
      return entry;
    });
    if (!updated) return problem(404, "ENTRY_NOT_FOUND", "CMS entry not found");
    return ok(toDto(updated));
  }),

  http.delete("*/v1/admin/cms/entries/:entryId", async ({ params }) => {
    await simulateLatency();
    db.mutate((data) => {
      data.cmsEntries = data.cmsEntries.filter((e) => e.id !== params.entryId);
    });
    return ok({ ok: true });
  }),
];

/** Analytics from real mock data where possible + generated series for depth. */
export const analyticsHandlers = [
  http.get("*/v1/admin/analytics", async () => {
    await simulateLatency();
    const data = db.get();

    // Deterministic pseudo-random series for the last 30 days (stable across reloads).
    const days = 30;
    const today = new Date();
    const contributionsByDay: AdminAnalytics["contributionsByDay"] = [];
    const signupsByDay: AdminAnalytics["signupsByDay"] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      const seed = (d.getDate() * 37 + d.getMonth() * 13) % 100;
      contributionsByDay.push({
        date,
        amount: { amountMinor: (seed * 3500 + 40000) * 10, currency: "INR" },
      });
      signupsByDay.push({ date, count: (seed % 7) + 1 });
    }

    const topItems = [...data.wishlistItems]
      .sort((a, b) => b.fundedMinor - a.fundedMinor)
      .slice(0, 5)
      .map((i) => ({ title: i.title, funded: { amountMinor: i.fundedMinor, currency: "INR" } }));

    const guestsContributed = new Set(
      data.contributions.filter((c) => c.status === "paid").map((c) => c.guestId),
    ).size;

    const response: AdminAnalytics = {
      contributionsByDay,
      signupsByDay,
      funnel: {
        wishlistVisits: data.guests.length * 9 + 47,
        guestsIdentified: data.guests.length,
        guestsContributed,
      },
      topItems,
    };
    return ok(response);
  }),
];
