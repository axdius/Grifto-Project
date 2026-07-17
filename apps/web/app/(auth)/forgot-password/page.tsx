import Link from "next/link";

export const metadata = { title: "Forgot Password — Grifto" };

/** Placeholder per the PDF prototype scope — real reset flow arrives with the backend. */
export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="font-display text-2xl font-bold text-neutral-900">Reset your password</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Password reset via email will be available soon. For now, contact support at{" "}
        <a href="mailto:hello@grifto.in" className="text-brand-600 hover:underline">
          hello@grifto.in
        </a>
        .
      </p>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Back to login
        </Link>
      </p>
    </>
  );
}
