"use client";

import { useRouter, useParams } from "next/navigation";
import { ServiceForm } from "@/features/services/components/serviceForm";
import {
  useService,
  useUpdateService,
} from "@/features/services/hooks/useServices";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function EditServicePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useService(id); // fetch existing service
  const update = useUpdateService(id);

  const service = data?.data ?? data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h1 className="text-base font-semibold text-foreground">
            Edit Service
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {service?.name}
          </p>
        </div>
        <div className="p-6">
          <ServiceForm
            service={service} // pre-fills the form
            isLoading={update.isPending}
            onCancel={() => router.back()}
            onSubmit={async (data) => {
              await update.mutateAsync(data as any);
              router.push(`/services/${id}`);
            }}
          />
        </div>
      </div>
    </div>
  );
}
