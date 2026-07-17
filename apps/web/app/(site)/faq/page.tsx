import { FaqList } from "@/features/cms/components/faq-list";

export const metadata = { title: "FAQ — Grifto" };

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-bold text-neutral-900">
        Frequently Asked Questions
      </h1>
      <FaqList />
    </div>
  );
}
