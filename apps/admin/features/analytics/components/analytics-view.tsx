"use client";

import { useAdminAnalytics } from "@grifto/sdk";
import { Card, CardBody, CardHeader, CardTitle, Progress, Spinner } from "@grifto/ui";
import { formatMoney } from "@grifto/utils";
import { PageHeader } from "@/components/admin-shell";

/** Hand-rolled SVG bar chart — enough for local analytics without a chart dep. */
function BarChart({
  points,
  ariaLabel,
}: {
  points: { label: string; value: number }[];
  ariaLabel: string;
}) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const barWidth = 100 / points.length;
  return (
    <svg viewBox="0 0 100 40" className="h-40 w-full" role="img" aria-label={ariaLabel}>
      {points.map((p, i) => {
        const h = (p.value / max) * 36;
        return (
          <rect
            key={p.label}
            x={i * barWidth + barWidth * 0.15}
            y={40 - h}
            width={barWidth * 0.7}
            height={h}
            rx={0.6}
            className="fill-brand-400"
          >
            <title>
              {p.label}: {p.value.toLocaleString("en-IN")}
            </title>
          </rect>
        );
      })}
    </svg>
  );
}

export function AnalyticsView() {
  const { data, isLoading, isError } = useAdminAnalytics();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-8 text-brand-500" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center text-neutral-500">
        We couldn&apos;t load analytics. Please refresh and try again.
      </div>
    );
  }

  const funnel = [
    { label: "Wishlist visits", value: data.funnel.wishlistVisits },
    { label: "Guests identified", value: data.funnel.guestsIdentified },
    { label: "Guests contributed", value: data.funnel.guestsContributed },
  ];
  const funnelMax = Math.max(funnel[0]?.value ?? 1, 1);

  return (
    <>
      <PageHeader title="Analytics" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contributions — last 30 days</CardTitle>
          </CardHeader>
          <CardBody>
            <BarChart
              ariaLabel="Contributions by day"
              points={data.contributionsByDay.map((d) => ({
                label: d.date,
                value: d.amount.amountMinor / 100,
              }))}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Signups — last 30 days</CardTitle>
          </CardHeader>
          <CardBody>
            <BarChart
              ariaLabel="Signups by day"
              points={data.signupsByDay.map((d) => ({ label: d.date, value: d.count }))}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Guest funnel</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            {funnel.map((step) => (
              <div key={step.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-neutral-600">{step.label}</span>
                  <span className="font-semibold text-neutral-900">
                    {step.value.toLocaleString("en-IN")}
                  </span>
                </div>
                <Progress value={(step.value / funnelMax) * 100} />
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top funded gifts</CardTitle>
          </CardHeader>
          <CardBody>
            {data.topItems.length === 0 ? (
              <p className="py-4 text-center text-sm text-neutral-500">No funded gifts yet.</p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {data.topItems.map((item, i) => (
                  <div key={item.title} className="flex items-center justify-between py-2.5">
                    <p className="text-sm text-neutral-900">
                      <span className="mr-2 text-neutral-400">#{i + 1}</span>
                      {item.title}
                    </p>
                    <p className="text-sm font-semibold text-success-700">
                      {formatMoney(item.funded)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
