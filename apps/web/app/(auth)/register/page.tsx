import Link from "next/link";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata = { title: "Sign Up — Grifto" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="font-display text-2xl font-bold text-neutral-900">Create your account</h1>
      <p className="mt-1 mb-6 text-sm text-neutral-500">
        Start your wedding wishlist in minutes.
      </p>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Login
        </Link>
      </p>
    </>
  );
}
