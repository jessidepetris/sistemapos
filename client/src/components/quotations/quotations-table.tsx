import { useEffect, useState } from "react";
import { Link } from "wouter";
import { MoreHorizontal, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { quotationService } from "@/services/quotationService";
import { Quotation } from "@/types/quotation";

export function QuotationsTable() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await quotationService.getQuotations();
        if (Array.isArray(data)) {
          setQuotations(data);
        } else {
          console.error("Unexpected data format while fetching quotations", data);
          setQuotations([]);
        }
      } catch (err) {
        console.error("Error loading quotations", err);
        setQuotations([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return <div className="p-4">Cargando...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotations.map((budget) => (
            <TableRow key={budget.id}>
              <TableCell className="font-medium">{budget.id}</TableCell>
              <TableCell>{budget.clientId}</TableCell>
              <TableCell>{formatCurrency(parseFloat(budget.totalAmount), "ARS")}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    budget.status === "approved"
                      ? "default"
                      : budget.status === "rejected"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {budget.status === "pending"
                    ? "Pendiente"
                    : budget.status === "approved"
                    ? "Aprobado"
                    : "Rechazado"}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(budget.dateCreated)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/quotations/${budget.id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Ver Detalles
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 
