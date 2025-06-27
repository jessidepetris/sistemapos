import { PrintButton } from './PrintButton';
import { LabelPrintService } from '@/services/labelPrintService';
import { Tag } from 'lucide-react';

interface ProductLabelProps {
  description: string;
  barcode: string;
  businessInfo?: {
    name: string;
  };
  width?: number;
  height?: number;
  borderRadius?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  icon?: React.ReactNode;
  label?: string;
}

export function ProductLabel({
  description,
  barcode,
  businessInfo,
  width,
  height,
  borderRadius,
  variant = 'default',
  size = 'default',
  icon = <Tag className="h-4 w-4 mr-2" />,
  label = 'Imprimir Etiqueta'
}: ProductLabelProps) {
  const handlePrint = () =>
    LabelPrintService.printLabel({ description, barcode, businessInfo, width, height, borderRadius });
  return (
    <PrintButton onClick={handlePrint} variant={variant} size={size} icon={icon} label={label} />
  );
}
