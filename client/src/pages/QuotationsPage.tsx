import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { quotationService } from "../services/quotationService";
import { QuotationWithItems } from "../types/quotation";
import { formatDate } from "../utils/date";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<QuotationWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    try {
      const data = await quotationService.getQuotations();
      setQuotations(data);
    } catch (err) {
      setError("Error al cargar los presupuestos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await quotationService.updateQuotationStatus(id, status);
      loadQuotations();
    } catch (err) {
      setError("Error al actualizar el estado del presupuesto");
      console.error(err);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Presupuestos</h1>
        <Link
          to="/quotations/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Nuevo Presupuesto
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Válido hasta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(quotations) ? (
              quotations.map((quotation) => (
                <tr key={quotation.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {quotation.clientId}
                  </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatDate(quotation.dateCreated)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatDate(quotation.dateValidUntil)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${quotation.totalAmount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
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
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    to={`/quotations/${quotation.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Ver
                  </Link>
                  {quotation.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(quotation.id, "approved")}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleStatusChange(quotation.id, "rejected")}
                        className="text-red-600 hover:text-red-900"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                </td>
              </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>No hay presupuestos disponibles.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
