import { Router } from 'express';
import { createStockMovement, listStockMovements } from '../controllers/stockController';

const router = Router();

router.post('/stock/movimientos', createStockMovement);
router.get('/stock/movimientos', listStockMovements);

export default router;
