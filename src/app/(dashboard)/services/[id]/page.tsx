"use client";

import { useRouter } from "next/navigation";
import { ServiceForm } from "@/features/services/components/serviceForm";
import { useCreateService } from "@/features/services/hooks/useServices";
import { ArrowLeft } from "lucide-react";

export default function NewServicePage() {
  const router = useRouter();
  const create = useCreateService();

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Services
      </button>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h1 className="text-base font-semibold text-foreground">
            New Service
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Add a new treatment or service to the catalogue
          </p>
        </div>
        <div className="p-6">
          <ServiceForm
            isLoading={create.isPending}
            onCancel={() => router.back()}
            onSubmit={async (data) => {
              const res = await create.mutateAsync(data as any);
              const id = (res as any)?.data?.data?.id ?? (res as any)?.data?.id;
              router.push(id ? `/services/${id}` : "/services");
            }}
          />
        </div>
      </div>
    </div>
  );
}
