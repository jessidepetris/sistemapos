import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PurchaseForm } from "@/components/purchases/PurchaseForm";
import { DashboardLayout } from "@/layouts/dashboard-layout";

interface Purchase {
  id: number;
  supplierId: number;
  supplier?: {
    id: number;
    name: string;
  };
  userId: number;
  total: string;
  status: string;
  timestamp: string;
  items: PurchaseItem[];
}

interface PurchaseItem {
  id: number;
  purchaseId: number;
  productId: number;
  quantity: string;
  unit: string;
  cost: string;
  total: string;
  product?: {
    id: number;
    name: string;
  };
}

export default function PurchasesPage() {
  const { toast } = useToast();
  const reactQueryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Obtener todas las compras
  const { data: purchases, isLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/purchases");
      if (!response.ok) throw new Error("Error al cargar compras");
      return response.json();
    },
  });

  // Obtener proveedores
  const { data: suppliers } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/suppliers");
      if (!response.ok) throw new Error("Error al cargar proveedores");
      return response.json();
    },
  });

  // Función para obtener el nombre del proveedor
  const getSupplierName = (supplierId: number) => {
    const supplier = suppliers?.find((s: { id: number; name: string }) => s.id === supplierId);
    return supplier?.name || `Proveedor ${supplierId}`;
  };

  // Función para traducir el estado
  const translateStatus = (status: string) => {
    switch (status) {
      case "completed":
        return "Completada";
      case "pending":
        return "Pendiente";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  // Filtrar compras por búsqueda
  const filteredPurchases = purchases?.filter(purchase => {
    const searchLower = searchQuery.toLowerCase();
    return (
      purchase.id.toString().includes(searchLower) ||
      purchase.status.toLowerCase().includes(searchLower)
    );
  });

  return (
    <DashboardLayout title="Compras">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Buscar compras..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        <Button onClick={() => {
          setEditingPurchase(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Compra
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Compras</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filteredPurchases?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No hay compras para mostrar
                  </TableCell>
                </TableRow>
              ) : (
                filteredPurchases?.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">{purchase.id}</TableCell>
                    <TableCell>{getSupplierName(purchase.supplierId)}</TableCell>
                    <TableCell>${Number(purchase.total).toFixed(2)}</TableCell>
                    <TableCell>{translateStatus(purchase.status)}</TableCell>
                    <TableCell>
                      {purchase.timestamp ? new Date(purchase.timestamp).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPurchase(purchase);
                          setIsDialogOpen(true);
                        }}
                      >
                        Ver Detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPurchase ? "Detalles de Compra" : "Nueva Compra"}
            </DialogTitle>
          </DialogHeader>
          <PurchaseForm
            purchase={editingPurchase}
            onSuccess={() => {
              setIsDialogOpen(false);
              reactQueryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
            }}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
} 
