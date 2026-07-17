import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = { title: "Login — Grifto" };

export default function LoginPage() {
  return (
    <>
      <h1 className="font-display text-2xl font-bold text-neutral-900">Welcome back</h1>
      <p className="mt-1 mb-6 text-sm text-neutral-500">Login to manage your wishlist.</p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-neutral-500">
        New to Grifto?{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:underline">
          Sign Up
        </Link>
      </p>
    </>
  );
}
