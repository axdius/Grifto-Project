"use client";

import { useEffect, useState } from "react";
import { usePlatformSettings, useUpdatePlatformSettings } from "@grifto/sdk";
import { Button, Card, CardBody, CardHeader, CardTitle, Field, Input, Spinner } from "@grifto/ui";
import { PageHeader } from "@/components/admin-shell";

export function FeeSettings() {
  const { data, isLoading } = usePlatformSettings();
  const update = useUpdatePlatformSettings();
  const [withdrawalFee, setWithdrawalFee] = useState("");
  const [contributionFee, setContributionFee] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setWithdrawalFee(String(data.withdrawalFeeBps / 100));
      setContributionFee(String(data.contributionFeeBps / 100));
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Spinner className="size-8 text-brand-500" />
      </div>
    );
  }

  function save() {
    setSaved(false);
    update.mutate(
      {
        withdrawalFeeBps: Math.round(parseFloat(withdrawalFee || "0") * 100),
        contributionFeeBps: Math.round(parseFloat(contributionFee || "0") * 100),
      },
      { onSuccess: () => setSaved(true) },
    );
  }

  return (
    <>
      <PageHeader title="Settings" />
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Platform fees</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <Field label="Withdrawal fee (%)" htmlFor="s-wfee">
            <Input
              id="s-wfee"
              inputMode="decimal"
              value={withdrawalFee}
              onChange={(e) => setWithdrawalFee(e.target.value)}
            />
          </Field>
          <Field label="Contribution fee (%)" htmlFor="s-cfee">
            <Input
              id="s-cfee"
              inputMode="decimal"
              value={contributionFee}
              onChange={(e) => setContributionFee(e.target.value)}
            />
          </Field>
          {update.error ? (
            <p className="text-sm text-danger-600" role="alert">
              {update.error.message}
            </p>
          ) : null}
          {saved ? <p className="text-sm text-success-700">Settings saved.</p> : null}
          <Button loading={update.isPending} onClick={save}>
            Save settings
          </Button>
        </CardBody>
      </Card>
    </>
  );
}
