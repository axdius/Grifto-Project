import type { ReactNode } from "react";
import { Spinner } from "@grifto/ui";

/** Lightweight presentation table for admin lists. */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  emptyText,
  onRowClick,
}: {
  columns: { key: string; header: string; render: (row: T) => ReactNode; align?: "right" }[];
  rows: T[] | undefined;
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (row: T) => void;
}) {
  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Spinner className="size-8 text-brand-500" />
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-card border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 text-left">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-2.5 font-medium text-neutral-500 ${col.align === "right" ? "text-right" : ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {(rows ?? []).map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? "cursor-pointer hover:bg-neutral-50" : undefined}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 ${col.align === "right" ? "text-right" : ""}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
          {(rows ?? []).length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-neutral-400">
                {emptyText ?? "No records"}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
