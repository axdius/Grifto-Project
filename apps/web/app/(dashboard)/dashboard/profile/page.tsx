"use client";

import { Badge, Card, CardBody, CardHeader, CardTitle } from "@grifto/ui";
import { useSession } from "@/features/auth/hooks/use-session";

export default function ProfilePage() {
  const { user } = useSession();
  if (!user) return null;

  const rows = [
    { label: "Name", value: `${user.firstName} ${user.lastName}` },
    { label: "Email", value: user.email },
    { label: "Phone", value: user.phone },
    {
      label: "Wedding Date",
      value: new Date(user.weddingDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    },
  ];

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Profile</CardTitle>
        <Badge tone="brand" className="capitalize">
          {user.roleType}
        </Badge>
      </CardHeader>
      <CardBody>
        <dl className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-3">
              <dt className="text-sm text-neutral-500">{row.label}</dt>
              <dd className="text-sm font-medium text-neutral-900">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardBody>
    </Card>
  );
}
