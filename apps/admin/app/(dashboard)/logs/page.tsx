import { EmptyState } from "@grifto/ui";
import { PageHeader } from "@/components/admin-shell";

export default function Page() {
  return (
    <>
      <PageHeader title="Audit Logs" />
      <EmptyState title="Audit Logs" description="This module lands in milestone M7." />
    </>
  );
}
