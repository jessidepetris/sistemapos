import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { QuotationsTable } from "@/components/quotations/quotations-table";
import { QuotationFormDialog } from "@/components/quotations/quotation-form-dialog";
import { DashboardLayout } from "@/layouts/dashboard-layout";

export default function QuotationsPage() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (!user) return null;

  return (
    <DashboardLayout title="Presupuestos">
      <div className="flex justify-between items-center mb-6">
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Presupuesto
        </Button>
      </div>

      <QuotationsTable />

      <QuotationFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </DashboardLayout>
  );
} 
