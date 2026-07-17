"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerBodySchema, type RegisterBody } from "@grifto/contracts";
import { useRegister } from "@grifto/sdk";
import { Button, Field, Input, Select } from "@grifto/ui";

/**
 * Registration per the scope PDF: first/last name, unique email, phone,
 * Register As (bride/groom), Date of Marriage, password.
 * The SAME Zod schema validates this form and the (mock) API handler.
 */
export function RegisterForm() {
  const router = useRouter();
  const register_ = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterBody>({
    resolver: zodResolver(registerBodySchema),
    defaultValues: { roleType: "bride" },
  });

  const onSubmit = handleSubmit((body) => {
    register_.mutate(body, {
      onSuccess: () => router.push("/dashboard"),
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" htmlFor="firstName" error={errors.firstName?.message}>
          <Input id="firstName" autoComplete="given-name" {...register("firstName")} />
        </Field>
        <Field label="Last Name" htmlFor="lastName" error={errors.lastName?.message}>
          <Input id="lastName" autoComplete="family-name" {...register("lastName")} />
        </Field>
      </div>
      <Field label="Email Address" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field label="Phone Number" htmlFor="phone" error={errors.phone?.message}>
        <Input id="phone" type="tel" inputMode="numeric" autoComplete="tel" {...register("phone")} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Register As" htmlFor="roleType" error={errors.roleType?.message}>
          <Select id="roleType" {...register("roleType")}>
            <option value="bride">Bride</option>
            <option value="groom">Groom</option>
          </Select>
        </Field>
        <Field label="Date of Marriage" htmlFor="weddingDate" error={errors.weddingDate?.message}>
          <Input id="weddingDate" type="date" {...register("weddingDate")} />
        </Field>
      </div>
      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
      </Field>

      {register_.error ? (
        <p className="rounded-lg bg-danger-100 px-3 py-2 text-sm text-danger-700" role="alert">
          {register_.error.message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" size="lg" loading={register_.isPending}>
        Create account
      </Button>
    </form>
  );
}
