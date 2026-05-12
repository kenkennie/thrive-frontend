"use client";

import { useRouter } from "next/navigation";
import { InvoiceForm } from "@/features/financial/components/InvoiceForm";
import { useCreateInvoice } from "@/features/financial/hooks/useFinancial";
import { ArrowLeft } from "lucide-react";

export default function NewInvoicePage() {
  const router = useRouter();
  const create = useCreateInvoice();

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Invoices
      </button>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-muted/20">
          <h1 className="text-base font-semibold text-foreground">
            New Invoice
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create a manual invoice for a client
          </p>
        </div>
        <div className="p-6">
          <InvoiceForm
            isLoading={create.isPending}
            onCancel={() => router.back()}
            onSubmit={async (data) => {
              const res = await create.mutateAsync(data as any);
              const id = (res as any)?.data?.data?.id ?? (res as any)?.data?.id;
              router.push(id ? `/invoices/${id}` : "/invoices");
            }}
          />
        </div>
      </div>
    </div>
  );
}
