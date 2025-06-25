import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quotationService } from "../services/quotationService";
import { QuotationWithItems } from "../types/quotation";
import { formatDate } from "../utils/date";

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<QuotationWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuotation();
  }, [id]);

  const loadQuotation = async () => {
    if (!id) return;

    try {
      const data = await quotationService.getQuotation(parseInt(id));
      setQuotation(data);
    } catch (err) {
      setError("Error al cargar el presupuesto");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!id) return;

    try {
      await quotationService.updateQuotationStatus(parseInt(id), status);
      loadQuotation();
    } catch (err) {
      setError("Error al actualizar el estado del presupuesto");
      console.error(err);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!quotation) return <div>Presupuesto no encontrado</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Detalles del Presupuesto</h1>
        <button
          onClick={() => navigate("/quotations")}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Volver
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h2 className="text-sm font-medium text-gray-500">Cliente</h2>
            <p className="mt-1">{quotation.clientId}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Estado</h2>
            <p className="mt-1">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  quotation.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : quotation.status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {quotation.status}
              </span>
            </p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Fecha de creación</h2>
            <p className="mt-1">{formatDate(quotation.dateCreated)}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Válido hasta</h2>
            <p className="mt-1">{formatDate(quotation.dateValidUntil)}</p>
          </div>
        </div>

        {quotation.notes && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-500">Notas</h2>
            <p className="mt-1">{quotation.notes}</p>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">Items</h2>
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio Unitario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotation.items.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{item.productId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${item.subtotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right font-medium">
                  Total
                </td>
                <td className="px-6 py-4 font-medium">
                  ${quotation.totalAmount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {quotation.status === "pending" && (
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => handleStatusChange("approved")}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Aprobar
            </button>
            <button
              onClick={() => handleStatusChange("rejected")}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Rechazar
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 