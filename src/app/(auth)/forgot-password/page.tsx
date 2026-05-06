"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft, Sparkles, MailCheck } from "lucide-react";
import { toast } from "sonner";
import {
  forgotPasswordSchema,
  type ForgotPasswordSchema,
} from "@/validations/auth.schema";
import authApi from "@/lib/api/auth";
import { parseApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    try {
      await authApi.forgotPassword(data);
      setSent(true);
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

        {sent ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <MailCheck
                className="w-12 h-12"
                style={{ color: "var(--brand-gold)" }}
              />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Check your inbox
            </h2>
            <p className="text-sm text-muted-foreground">
              If that email is registered, you'll receive a reset link shortly.
            </p>
            <a
              href="/login"
              className="inline-flex items-center gap-2 text-sm hover:underline mt-4"
              style={{ color: "var(--brand-gold)" }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </a>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-1">
                Forgot password?
              </h2>
              <p className="text-sm text-muted-foreground">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
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
                  autoFocus
                  placeholder="you@example.com"
                  {...form.register("email")}
                  className={cn(
                    "w-full h-10 px-3 rounded-lg border bg-background text-sm text-foreground",
                    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-shadow",
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

              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                style={{
                  backgroundColor: "var(--brand-gold)",
                  color: "var(--brand-navy)",
                }}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                  </>
                ) : (
                  "Send reset link"
                )}
              </button>
            </form>

            <a
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </a>
          </>
        )}
      </div>
    </div>
  );
}
