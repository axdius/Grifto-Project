"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginBodySchema, type LoginBody } from "@grifto/contracts";
import { useLogin } from "@grifto/sdk";
import { Button, Field, Input } from "@grifto/ui";

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginBody>({ resolver: zodResolver(loginBodySchema) });

  const onSubmit = handleSubmit((body) => {
    login.mutate(body, {
      onSuccess: () => router.push("/dashboard"),
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Email Address" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
      </Field>

      {login.error ? (
        <p className="rounded-lg bg-danger-100 px-3 py-2 text-sm text-danger-700" role="alert">
          {login.error.code === "AUTH_INVALID_CREDENTIALS"
            ? "Invalid email or password."
            : login.error.message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" size="lg" loading={login.isPending}>
        Login
      </Button>
      <p className="text-center text-sm text-neutral-500">
        <Link href="/forgot-password" className="text-brand-600 hover:underline">
          Forgot password?
        </Link>
      </p>
    </form>
  );
}
