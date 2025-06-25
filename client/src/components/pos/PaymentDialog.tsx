import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { PaymentMethod, PaymentDetails } from "@/shared/types";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (details: PaymentDetails) => void;
  total: number;
  currency: "ARS" | "USD";
}

export const PaymentDialog = ({ isOpen, onClose, onConfirm, total, currency }: PaymentDialogProps) => {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    method: "cash",
    amount: total,
    currency
  });

  useEffect(() => {
    setPaymentDetails(prev => ({
      ...prev,
      amount: total,
      currency
    }));
  }, [total, currency]);

  const handleConfirm = () => {
    if (paymentDetails.amount < total) {
      toast({
        title: "Monto insuficiente",
        description: `El monto ingresado (${paymentDetails.amount} ${currency}) es menor al total (${total} ${currency})`,
        variant: "destructive",
      });
      return;
    }

    onConfirm(paymentDetails);
    onClose();
  };

  const renderPaymentFields = () => {
    switch (paymentMethod) {
      case "cash":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Monto recibido</Label>
              <Input
                type="number"
                value={paymentDetails.amount}
                onChange={(e) => setPaymentDetails(prev => ({
                  ...prev,
                  amount: parseFloat(e.target.value)
                }))}
                min={total}
                step="0.01"
              />
            </div>
          </div>
        );

      case "transfer":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Banco</Label>
              <Input
                type="text"
                value={paymentDetails.bankName || ""}
                onChange={(e) => setPaymentDetails(prev => ({
                  ...prev,
                  bankName: e.target.value
                }))}
                placeholder="Nombre del banco"
              />
            </div>
            <div className="space-y-2">
              <Label>Número de cuenta</Label>
              <Input
                type="text"
                value={paymentDetails.bankAccountId || ""}
                onChange={(e) => setPaymentDetails(prev => ({
                  ...prev,
                  bankAccountId: e.target.value
                }))}
                placeholder="Número de cuenta"
              />
            </div>
          </div>
        );

      case "credit_card":
      case "debit_card":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Número de tarjeta</Label>
              <Input
                type="text"
                value={paymentDetails.cardNumber || ""}
                onChange={(e) => setPaymentDetails(prev => ({
                  ...prev,
                  cardNumber: e.target.value
                }))}
                placeholder="1234 5678 9012 3456"
              />
            </div>
            <div className="space-y-2">
              <Label>Titular</Label>
              <Input
                type="text"
                value={paymentDetails.cardHolder || ""}
                onChange={(e) => setPaymentDetails(prev => ({
                  ...prev,
                  cardHolder: e.target.value
                }))}
                placeholder="Nombre del titular"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vencimiento</Label>
                <Input
                  type="text"
                  value={paymentDetails.cardExpiry || ""}
                  onChange={(e) => setPaymentDetails(prev => ({
                    ...prev,
                    cardExpiry: e.target.value
                  }))}
                  placeholder="MM/AA"
                />
              </div>
              <div className="space-y-2">
                <Label>CVV</Label>
                <Input
                  type="text"
                  value={paymentDetails.cardCvv || ""}
                  onChange={(e) => setPaymentDetails(prev => ({
                    ...prev,
                    cardCvv: e.target.value
                  }))}
                  placeholder="123"
                />
              </div>
            </div>
          </div>
        );

      case "check":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Número de cheque</Label>
              <Input
                type="text"
                value={paymentDetails.checkNumber || ""}
                onChange={(e) => setPaymentDetails(prev => ({
                  ...prev,
                  checkNumber: e.target.value
                }))}
                placeholder="Número de cheque"
              />
            </div>
            <div className="space-y-2">
              <Label>Banco</Label>
              <Input
                type="text"
                value={paymentDetails.bankName || ""}
                onChange={(e) => setPaymentDetails(prev => ({
                  ...prev,
                  bankName: e.target.value
                }))}
                placeholder="Nombre del banco"
              />
            </div>
          </div>
        );

      case "qr":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Código QR</Label>
              <Input
                type="text"
                value={paymentDetails.qrCode || ""}
                onChange={(e) => setPaymentDetails(prev => ({
                  ...prev,
                  qrCode: e.target.value
                }))}
                placeholder="Código QR"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detalles del pago</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Método de pago</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value: PaymentMethod) => {
                setPaymentMethod(value);
                setPaymentDetails(prev => ({
                  ...prev,
                  method: value
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un método de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="credit_card">Tarjeta de crédito</SelectItem>
                <SelectItem value="debit_card">Tarjeta de débito</SelectItem>
                <SelectItem value="check">Cheque</SelectItem>
                <SelectItem value="qr">QR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderPaymentFields()}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm}>
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 