import { AddressRequestsPanel } from "@/features/guest/components/address-requests-panel";

export default function RequestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-900">Address Requests</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Guests who want to send a gift after the wedding ask for your delivery address — approve
          or decline each request.
        </p>
      </div>
      <AddressRequestsPanel />
    </div>
  );
}
