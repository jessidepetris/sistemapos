-- Agregar campo isDiscontinued a la tabla products
ALTER TABLE products ADD COLUMN is_discontinued BOOLEAN DEFAULT FALSE;

-- Crear un trigger para desactivar automáticamente productos discontinuos cuando se queden sin stock
CREATE OR REPLACE FUNCTION check_discontinued_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock <= 0 AND OLD.stock > 0 AND NEW.is_discontinued = TRUE THEN
        NEW.active := FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_discontinued_product_stock_trigger
BEFORE UPDATE ON products
FOR EACH ROW
WHEN (NEW.stock <= 0 AND OLD.stock > 0 AND NEW.is_discontinued = TRUE)
EXECUTE FUNCTION check_discontinued_product_stock(); 
