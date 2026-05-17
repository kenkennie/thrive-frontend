"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import authApi from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth.store";
import { parseApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type Schema = z.infer<typeof schema>;

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";
  const setUser = useAuthStore((s) => s.setUser);

  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: Schema) => {
    if (!token) {
      toast.error("Invalid invite link.");
      return;
    }
    try {
      const res = await authApi.acceptInvite({
        token,
        password: data.password,
        fullName: data.fullName,
      });
      const { tokenStorage } = await import("@/lib/api/client");
      tokenStorage.setTokens(res.accessToken, res.refreshToken);
      document.cookie = `thrive:session=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      setUser(res.user);
      toast.success("Welcome to Thrive Aesthetics!");
      router.replace("/");
    } catch (err) {
      toast.error(parseApiError(err).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--brand-gold)" }}
          >
            <Sparkles
              className="w-4 h-4"
              style={{ color: "var(--brand-navy)" }}
            />
          </div>
          <span className="font-semibold text-sm text-foreground">
            Thrive Aesthetics
          </span>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-1">
            Accept your invite
          </h2>
          {email && (
            <p className="text-sm text-muted-foreground">
              Setting up account for{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          )}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Full name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Full name
            </label>
            <input
              type="text"
              autoFocus
              placeholder="Jane Doe"
              {...form.register("fullName")}
              className={cn(
                "w-full h-10 px-3 rounded-lg border bg-background text-sm text-foreground",
                "placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-shadow",
                form.formState.errors.fullName
                  ? "border-destructive focus:ring-destructive/20"
                  : "border-input focus:ring-ring/30",
              )}
            />
            {form.formState.errors.fullName && (
              <p className="text-xs text-destructive">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                {...form.register("password")}
                className={cn(
                  "w-full h-10 px-3 pr-10 rounded-lg border bg-background text-sm text-foreground",
                  "placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-shadow",
                  form.formState.errors.password
                    ? "border-destructive focus:ring-destructive/20"
                    : "border-input focus:ring-ring/30",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPw ? (
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

          {/* Confirm password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Confirm password
            </label>
            <div className="relative">
              <input
                type={showCpw ? "text" : "password"}
                placeholder="••••••••"
                {...form.register("confirmPassword")}
                className={cn(
                  "w-full h-10 px-3 pr-10 rounded-lg border bg-background text-sm text-foreground",
                  "placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-shadow",
                  form.formState.errors.confirmPassword
                    ? "border-destructive focus:ring-destructive/20"
                    : "border-input focus:ring-ring/30",
                )}
              />
              <button
                type="button"
                onClick={() => setShowCpw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showCpw ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
            style={{
              backgroundColor: "var(--brand-gold)",
              color: "var(--brand-navy)",
            }}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Setting up account…
              </>
            ) : (
              "Activate account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}
