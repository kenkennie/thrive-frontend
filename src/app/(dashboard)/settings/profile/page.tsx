"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import api from "@/lib/api/client";
import {
  SettingsSection,
  Field,
  inputCls,
  SaveButton,
} from "@/features/settings/components/settingsSection";
import { getInitials } from "@/lib/utils";
import { KeyRound } from "lucide-react";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name required"),
  phoneNumber: z.string().optional(),
});

const pwSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(8, "Min 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileSchema = z.infer<typeof profileSchema>;
type PwSchema = z.infer<typeof pwSchema>;

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const profileForm = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user?.fullName ?? "", phoneNumber: "" },
  });

  const pwForm = useForm<PwSchema>({
    resolver: zodResolver(pwSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updateProfile = useMutation({
    mutationFn: (dto: ProfileSchema) => api.patch("/auth/profile", dto),
    onSuccess: (_, dto) => {
      toast.success("Profile updated");
      if (user) setUser({ ...user, fullName: dto.fullName });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const changePassword = useMutation({
    mutationFn: (dto: PwSchema) =>
      api.post("/auth/change-password", {
        currentPassword: dto.currentPassword,
        newPassword: dto.newPassword,
      }),
    onSuccess: () => {
      toast.success("Password changed");
      pwForm.reset();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="space-y-5">
      {/* Profile */}
      <SettingsSection
        title="My Profile"
        description="Your personal account details"
      >
        <form
          onSubmit={profileForm.handleSubmit((d) => updateProfile.mutate(d))}
          className="space-y-5"
        >
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
              style={{
                backgroundColor: "var(--brand-gold)",
                color: "var(--brand-navy)",
              }}
            >
              {user ? getInitials(user.fullName) : "?"}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {user?.fullName}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">
                {user?.roles?.[0]?.replace("_", " ") ?? "Staff"}
                {user?.isSuperAdmin && " · Super Admin"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Full name"
              error={profileForm.formState.errors.fullName?.message}
            >
              <input
                {...profileForm.register("fullName")}
                className={inputCls(
                  profileForm.formState.errors.fullName?.message,
                )}
              />
            </Field>
            <Field label="Phone number">
              <input
                {...profileForm.register("phoneNumber")}
                placeholder="+254 7XX XXX XXX"
                className={inputCls()}
              />
            </Field>
          </div>

          <div>
            <Field label="Email address">
              <input
                value={user?.email ?? ""}
                disabled
                className={inputCls() + " opacity-50 cursor-not-allowed"}
              />
            </Field>
            <p className="text-xs text-muted-foreground mt-1">
              Contact admin to change your email address.
            </p>
          </div>

          <SaveButton isLoading={updateProfile.isPending} />
        </form>
      </SettingsSection>

      {/* Password */}
      <SettingsSection
        title="Change Password"
        description="Use a strong password of at least 8 characters"
      >
        <form
          onSubmit={pwForm.handleSubmit((d) => changePassword.mutate(d))}
          className="space-y-4 max-w-sm"
        >
          <Field
            label="Current password"
            error={pwForm.formState.errors.currentPassword?.message}
          >
            <input
              type="password"
              {...pwForm.register("currentPassword")}
              className={inputCls(
                pwForm.formState.errors.currentPassword?.message,
              )}
            />
          </Field>
          <Field
            label="New password"
            error={pwForm.formState.errors.newPassword?.message}
          >
            <input
              type="password"
              {...pwForm.register("newPassword")}
              className={inputCls(pwForm.formState.errors.newPassword?.message)}
            />
          </Field>
          <Field
            label="Confirm new password"
            error={pwForm.formState.errors.confirmPassword?.message}
          >
            <input
              type="password"
              {...pwForm.register("confirmPassword")}
              className={inputCls(
                pwForm.formState.errors.confirmPassword?.message,
              )}
            />
          </Field>
          <SaveButton
            isLoading={changePassword.isPending}
            label="Change password"
          />
        </form>
      </SettingsSection>
    </div>
  );
}
