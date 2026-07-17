import { CustomerDetail } from "@/features/customers/components/customer-detail";

export default async function Page({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;
  return <CustomerDetail customerId={customerId} />;
}
