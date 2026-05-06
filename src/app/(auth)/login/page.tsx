"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { loginSchema, type LoginSchema } from "@/validations/auth.schema";
import { useAuthStore, useIsLoggedIn } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const isLoggedIn = useIsLoggedIn();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (isLoggedIn) router.replace(redirect);
  }, [isLoggedIn]);

  const onSubmit = async (data: LoginSchema) => {
    try {
      await login(data.email, data.password);
      // Set session cookie for middleware
      document.cookie = `thrive:session=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      toast.success("Welcome back!");
      router.replace(redirect);
    } catch (err: any) {
      toast.error(err?.message ?? "Login failed. Check your credentials.");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ backgroundColor: "var(--brand-navy)" }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ border: "60px solid var(--brand-gold)" }}
        />
        <div
          className="absolute bottom-20 -left-20 w-64 h-64 rounded-full opacity-10"
          style={{ border: "40px solid var(--brand-gold)" }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--brand-gold)" }}
            >
              <Sparkles
                className="w-5 h-5"
                style={{ color: "var(--brand-navy)" }}
              />
            </div>
            <div>
              <p
                className="font-semibold text-lg leading-tight"
                style={{ color: "var(--brand-gold)" }}
              >
                Thrive Aesthetics
              </p>
              <p
                className="text-xs opacity-60"
                style={{ color: "var(--brand-gold)" }}
              >
                Kenya
              </p>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <h1
            className="text-5xl font-light leading-tight mb-6"
            style={{
              fontFamily: "'DM Serif Display', serif",
              color: "var(--brand-gold)",
            }}
          >
            Renew.
            <br />
            <span className="italic">Revive.</span>
            <br />
            Radiate.
          </h1>
          <p
            className="text-sm leading-relaxed opacity-60"
            style={{ color: "var(--brand-gold)" }}
          >
            Clinic management made simple.
            <br />
            Beautiful by design.
          </p>
        </div>

        {/* Bottom quote */}
        <div
          className="relative z-10 pt-6 border-t opacity-40"
          style={{ borderColor: "var(--brand-gold)" }}
        >
          <p
            className="text-xs italic"
            style={{ color: "var(--brand-gold)" }}
          >
            "Certified. Holistic. Leading."
          </p>
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--brand-gold)" }}
          >
            <Sparkles
              className="w-4 h-4"
              style={{ color: "var(--brand-navy)" }}
            />
          </div>
          <span className="font-semibold text-foreground">
            Thrive Aesthetics
          </span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-1">
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign in to your staff account
            </p>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
          >
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                {...form.register("email")}
                className={cn(
                  "w-full h-10 px-3 rounded-lg border bg-background text-sm text-foreground",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 transition-shadow",
                  form.formState.errors.email
                    ? "border-destructive focus:ring-destructive/20"
                    : "border-input focus:ring-ring/30",
                )}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <a
                  href="/forgot-password"
                  className="text-xs hover:underline transition-colors"
                  style={{ color: "var(--brand-gold)" }}
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...form.register("password")}
                  className={cn(
                    "w-full h-10 px-3 pr-10 rounded-lg border bg-background text-sm text-foreground",
                    "placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 transition-shadow",
                    form.formState.errors.password
                      ? "border-destructive focus:ring-destructive/20"
                      : "border-input focus:ring-ring/30",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full h-10 rounded-lg text-sm font-medium transition-all",
                "flex items-center justify-center gap-2",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              )}
              style={{
                backgroundColor: "var(--brand-gold)",
                color: "var(--brand-navy)",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Staff access only. If you need help, contact{" "}
            <a
              href="mailto:hello@thriveaesthetics.co.ke"
              className="underline"
            >
              support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
