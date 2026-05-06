import { Sparkles } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: "var(--brand-gold)" }}
      >
        <Sparkles
          className="w-7 h-7"
          style={{ color: "var(--brand-navy)" }}
        />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Welcome to Thrive Aesthetics
        </h2>
        <p className="text-sm text-muted-foreground">
          Dashboard coming in Phase 3.
        </p>
      </div>
    </div>
  );
}
