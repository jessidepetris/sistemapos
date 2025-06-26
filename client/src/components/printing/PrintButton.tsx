import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PrintButtonProps {
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  icon?: React.ReactNode;
  children?: React.ReactNode;
  label?: string;
}

export function PrintButton({ 
  onClick, 
  variant = 'default', 
  size = 'default',
  icon = <Printer className="h-4 w-4 mr-2" />,
  children,
  label = 'Imprimir Ticket'
}: PrintButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    try {
      setIsPrinting(true);
      await onClick();
      setIsPrinting(false);
    } catch (error) {
      console.error('Error al imprimir:', error);
      toast({
        title: "Error al imprimir",
        description: "No se pudo imprimir el documento",
        variant: "destructive"
      });
      setIsPrinting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isPrinting}
    >
      {isPrinting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Imprimiendo...
        </>
      ) : (
        <>
          {icon}
          {children || label}
        </>
      )}
    </Button>
  );
}
