"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  // SOAP
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  // Treatment
  treatmentPerformed: z.string().optional(),
  productsUsed: z.string().optional(),
  equipmentUsed: z.string().optional(),
  settingsUsed: z.string().optional(),
  skinReaction: z.string().optional(),
  aftercareInstructions: z.string().optional(),
  clientFeedbackDuringSession: z.string().optional(),
  // Follow-up
  followUpRequired: z.boolean().default(false),
  followUpNotes: z.string().optional(),
  followUpDate: z.string().optional(),
  visibleToClient: z.boolean().default(true),
  generateInvoice: z.boolean().default(false),
});

export type SessionNoteFormSchema = z.infer<typeof schema>;

interface Props {
  session?: any;
  isPerSession?: boolean; // show generateInvoice option
  onSubmit: (data: SessionNoteFormSchema) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

const ta = (err?: string) =>
  cn(
    "w-full px-3 py-2.5 rounded-lg border bg-background text-sm text-foreground resize-none",
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-shadow",
    err
      ? "border-destructive focus:ring-destructive/20"
      : "border-input focus:ring-ring/30",
  );

const inp = (err?: string) =>
  cn(
    "w-full h-10 px-3 rounded-lg border bg-background text-sm text-foreground",
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-shadow",
    err
      ? "border-destructive focus:ring-destructive/20"
      : "border-input focus:ring-ring/30",
  );

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60 mb-3">
      {children}
    </p>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {hint && (
          <span className="text-xs text-muted-foreground font-normal ml-1.5">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function BigCheckbox({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border/60">
      <div
        className={cn(
          "mt-0.5 w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all",
          checked ? "border-transparent" : "border-input",
        )}
        style={checked ? { backgroundColor: "var(--brand-gold)" } : undefined}
        onClick={() => onChange(!checked)}
      >
        {checked && (
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="#1A1A2E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}

export function SessionNoteForm({
  session,
  isPerSession,
  onSubmit,
  isLoading,
  onCancel,
}: Props) {
  const form = useForm<SessionNoteFormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      subjective: session?.subjective ?? "",
      objective: session?.objective ?? "",
      assessment: session?.assessment ?? "",
      plan: session?.plan ?? "",
      treatmentPerformed: session?.treatmentPerformed ?? "",
      productsUsed: session?.productsUsed ?? "",
      equipmentUsed: session?.equipmentUsed ?? "",
      settingsUsed: session?.settingsUsed ?? "",
      skinReaction: session?.skinReaction ?? "",
      aftercareInstructions: session?.aftercareInstructions ?? "",
      clientFeedbackDuringSession: session?.clientFeedbackDuringSession ?? "",
      followUpRequired: session?.followUpRequired ?? false,
      followUpNotes: session?.followUpNotes ?? "",
      followUpDate: session?.followUpDate
        ? session.followUpDate.split("T")[0]
        : "",
      visibleToClient: session?.visibleToClient ?? true,
      generateInvoice: false,
    },
  });

  const { register, watch, setValue, handleSubmit } = form;
  const followUpRequired = watch("followUpRequired");
  const visibleToClient = watch("visibleToClient");
  const generateInvoice = watch("generateInvoice");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ── SOAP Notes ── */}
      <div>
        <SectionLabel>SOAP Notes</SectionLabel>
        <div className="space-y-3">
          <Field label="Subjective" hint="What the client reports">
            <textarea
              {...register("subjective")}
              rows={3}
              placeholder="Chief complaint, history, symptoms reported by client…"
              className={ta()}
            />
          </Field>
          <Field label="Objective" hint="What you observe and measure">
            <textarea
              {...register("objective")}
              rows={3}
              placeholder="Clinical findings, skin assessment, measurements…"
              className={ta()}
            />
          </Field>
          <Field label="Assessment" hint="Clinical diagnosis or evaluation">
            <textarea
              {...register("assessment")}
              rows={3}
              placeholder="Diagnosis, evaluation of treatment response…"
              className={ta()}
            />
          </Field>
          <Field label="Plan" hint="Next steps">
            <textarea
              {...register("plan")}
              rows={3}
              placeholder="Next treatment, referrals, client education…"
              className={ta()}
            />
          </Field>
        </div>
      </div>

      {/* ── Treatment Details ── */}
      <div>
        <SectionLabel>Treatment Details</SectionLabel>
        <div className="space-y-3">
          <Field label="Treatment performed">
            <textarea
              {...register("treatmentPerformed")}
              rows={3}
              placeholder="Describe the procedure performed, areas treated, technique used…"
              className={ta()}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Products used">
              <textarea
                {...register("productsUsed")}
                rows={2}
                placeholder="Product names, concentrations, amounts…"
                className={ta()}
              />
            </Field>
            <Field label="Equipment used">
              <textarea
                {...register("equipmentUsed")}
                rows={2}
                placeholder="Device names, attachments…"
                className={ta()}
              />
            </Field>
            <Field label="Device settings">
              <input
                {...register("settingsUsed")}
                placeholder="e.g. 30J/cm², 1Hz, level 3"
                className={inp()}
              />
            </Field>
            <Field label="Skin reaction">
              <input
                {...register("skinReaction")}
                placeholder="e.g. Mild erythema, tolerated well"
                className={inp()}
              />
            </Field>
          </div>
          <Field label="Client feedback during session">
            <textarea
              {...register("clientFeedbackDuringSession")}
              rows={2}
              placeholder="Pain level, comfort, any concerns raised…"
              className={ta()}
            />
          </Field>
          <Field label="Aftercare instructions" hint="Shown to client">
            <textarea
              {...register("aftercareInstructions")}
              rows={3}
              placeholder="SPF 50+, avoid direct sun for 48h, no exfoliants for 5 days…"
              className={ta()}
            />
          </Field>
        </div>
      </div>

      {/* ── Follow-up ── */}
      <div>
        <SectionLabel>Follow-up</SectionLabel>
        <div className="space-y-3">
          <BigCheckbox
            label="Follow-up required"
            description="Flag this session for a follow-up review or rebooking"
            checked={followUpRequired}
            onChange={(v) => setValue("followUpRequired", v)}
          />
          {followUpRequired && (
            <div className="pl-8 space-y-3">
              <Field label="Follow-up notes">
                <textarea
                  {...register("followUpNotes")}
                  rows={2}
                  placeholder="What to review, concerns to monitor…"
                  className={ta()}
                />
              </Field>
              <Field label="Suggested follow-up date">
                <input
                  type="date"
                  {...register("followUpDate")}
                  className={inp()}
                />
              </Field>
            </div>
          )}
        </div>
      </div>

      {/* ── Settings ── */}
      <div>
        <SectionLabel>Visibility & Billing</SectionLabel>
        <div className="space-y-2">
          <BigCheckbox
            label="Visible to client"
            description="Client can view this session's aftercare instructions and treatment summary in their portal"
            checked={visibleToClient}
            onChange={(v) => setValue("visibleToClient", v)}
          />
          {isPerSession && (
            <BigCheckbox
              label="Generate invoice for this session"
              description="Creates a draft invoice for this session (PER_SESSION payment model)"
              checked={generateInvoice}
              onChange={(v) => setValue("generateInvoice", v)}
            />
          )}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3 pt-2 border-t border-border/60">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 transition-all"
          style={{
            backgroundColor: "var(--brand-gold)",
            color: "var(--brand-navy)",
          }}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {session ? "Save changes" : "Save session note"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
