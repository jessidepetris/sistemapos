import { useState } from "react";
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

interface Budget {
  id: string;
  number: string;
  customer: {
    name: string;
  };
  total: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const budgets: Budget[] = [
  {
    id: "1",
    number: "P-0001",
    customer: {
      name: "Cliente Ejemplo",
    },
    total: 15000,
    status: "pending",
    createdAt: "2024-04-30T12:00:00Z",
  },
];

export function BudgetsTable() {
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgets.map((budget) => (
            <TableRow key={budget.id}>
              <TableCell className="font-medium">{budget.number}</TableCell>
              <TableCell>{budget.customer.name}</TableCell>
              <TableCell>{formatCurrency(budget.total)}</TableCell>
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
              <TableCell>{formatDate(budget.createdAt)}</TableCell>
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
                      <Link href={`/budgets/${budget.id}`}>
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
