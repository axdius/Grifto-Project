export const metadata = { title: "Contact Us — Grifto" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-bold text-neutral-900">Contact Us</h1>
      <p className="mt-4 text-neutral-600">
        Questions about Grifto? Write to us at{" "}
        <a href="mailto:hello@grifto.in" className="font-medium text-brand-600 hover:underline">
          hello@grifto.in
        </a>
        . A contact form powered by the CMS forms module arrives in M8.
      </p>
    </div>
  );
}
