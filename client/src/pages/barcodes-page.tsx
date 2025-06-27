import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProductLabel } from '@/components/printing/ProductLabel';
import { LabelPreview } from '@/components/printing/LabelPreview';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DashboardLayout } from '@/layouts/dashboard-layout';

export default function BarcodesPage() {
  const { data: products, isLoading } = useQuery({ queryKey: ['/api/products'] });

  const [labelWidth, setLabelWidth] = useState(40);
  const [labelHeight, setLabelHeight] = useState(30);
  const [labelShape, setLabelShape] = useState<'rectangle' | 'rounded' | 'circle'>('rectangle');

  return (
    <DashboardLayout title="Gestión de Etiquetas">
      <Card>
        <CardHeader>
          <CardTitle>Etiquetas de Productos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              type="number"
              className="w-24"
              value={labelWidth}
              onChange={(e) => setLabelWidth(parseInt(e.target.value) || 0)}
              placeholder="Ancho (mm)"
            />
            <Input
              type="number"
              className="w-24"
              value={labelHeight}
              onChange={(e) => setLabelHeight(parseInt(e.target.value) || 0)}
              placeholder="Alto (mm)"
            />
            <Select value={labelShape} onValueChange={(v) => setLabelShape(v as 'rectangle' | 'rounded' | 'circle')}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Forma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangle">Rectangular</SelectItem>
                <SelectItem value="rounded">Redondeada</SelectItem>
                <SelectItem value="circle">Circular</SelectItem>
              </SelectContent>
            </Select>
            <LabelPreview
              description="Vista Previa"
              barcode={products?.[0]?.barcodes?.[0] || '0000000000000'}
              width={labelWidth}
              height={labelHeight}
              borderRadius={
                labelShape === 'rounded'
                  ? '3mm'
                  : labelShape === 'circle'
                  ? '50%'
                  : '0'
              }
            />
          </div>

          {isLoading ? (
            <div>Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Códigos de Barras</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {product.barcodes?.map((code: string, idx: number) => (
                          <ProductLabel
                            key={idx}
                            description={product.name}
                            barcode={code}
                            width={labelWidth}
                            height={labelHeight}
                            borderRadius={
                              labelShape === 'rounded'
                                ? '3mm'
                                : labelShape === 'circle'
                                ? '50%'
                                : '0'
                            }
                            variant="outline"
                            size="sm"
                            label={code}
                          />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
