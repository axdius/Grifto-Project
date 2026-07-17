export const metadata = { title: "About Us — Grifto" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-bold text-neutral-900">About Grifto</h1>
      <div className="mt-6 space-y-4 text-neutral-600">
        <p>
          Grifto is a wedding gifting platform built around a simple idea: the best gifts are the
          ones couples actually want.
        </p>
        <p>
          Couples create a wishlist, share it with a link or a QR code on their invitation, and
          guests contribute towards gifts — any amount, from anywhere. Content on this page will be
          fully editable through the CMS.
        </p>
      </div>
    </div>
  );
}
