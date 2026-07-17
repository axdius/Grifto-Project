import { http } from "msw";
import { themeDocumentSchema, type ThemeDraft, type ThemeVersion } from "@grifto/contracts";
import { db, newId } from "../db/db";
import type { DbThemeState } from "../db/schema";
import { ok, problem, simulateLatency } from "../http";

function isDirty(theme: DbThemeState): boolean {
  return JSON.stringify(theme.draft) !== JSON.stringify(theme.published);
}

function toDraftDto(theme: DbThemeState): ThemeDraft {
  return {
    document: theme.draft,
    updatedAt: theme.draftUpdatedAt,
    dirty: isDirty(theme),
  };
}

export const themeHandlers = [
  http.get("*/v1/theme/published", async () => {
    await simulateLatency();
    return ok(db.get().theme.published);
  }),

  http.get("*/v1/admin/theme/draft", async () => {
    await simulateLatency();
    return ok(toDraftDto(db.get().theme));
  }),

  http.put("*/v1/admin/theme/draft", async ({ request }) => {
    await simulateLatency();
    const parsed = themeDocumentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return problem(422, "VALIDATION_ERROR", "Invalid theme document", parsed.error.issues[0]?.message);
    }
    const theme = db.mutate((data) => {
      data.theme.draft = { sections: parsed.data.sections as DbThemeState["draft"]["sections"] };
      data.theme.draftUpdatedAt = new Date().toISOString();
      return data.theme;
    });
    return ok(toDraftDto(theme));
  }),

  http.post("*/v1/admin/theme/publish", async () => {
    await simulateLatency();
    const version = db.mutate((data) => {
      const nextVersion = (data.theme.versions[data.theme.versions.length - 1]?.version ?? 0) + 1;
      data.theme.published = structuredClone(data.theme.draft);
      const created: ThemeVersion & { document: DbThemeState["published"] } = {
        id: newId("thv"),
        version: nextVersion,
        label: `Version ${nextVersion}`,
        publishedAt: new Date().toISOString(),
        document: structuredClone(data.theme.draft),
      };
      data.theme.versions.push(created);
      return created;
    });
    const { document: _doc, ...dto } = version;
    return ok(dto, 201);
  }),

  http.post("*/v1/admin/theme/draft/discard", async () => {
    await simulateLatency();
    const theme = db.mutate((data) => {
      data.theme.draft = structuredClone(data.theme.published);
      data.theme.draftUpdatedAt = new Date().toISOString();
      return data.theme;
    });
    return ok(toDraftDto(theme));
  }),

  http.get("*/v1/admin/theme/versions", async () => {
    await simulateLatency();
    const items = [...db.get().theme.versions]
      .sort((a, b) => b.version - a.version)
      .map(({ document: _doc, ...v }) => v);
    return ok({ items });
  }),

  http.post("*/v1/admin/theme/versions/:versionId/restore", async ({ params }) => {
    await simulateLatency();
    const theme = db.mutate((data) => {
      const version = data.theme.versions.find((v) => v.id === params.versionId);
      if (!version) return null;
      data.theme.draft = structuredClone(version.document);
      data.theme.draftUpdatedAt = new Date().toISOString();
      return data.theme;
    });
    if (!theme) return problem(404, "VERSION_NOT_FOUND", "Theme version not found");
    return ok(toDraftDto(theme));
  }),
];
