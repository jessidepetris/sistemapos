import { Request, Response } from 'express';
import { storage } from '@server/storage';
import { insertStockMovementSchema } from '@shared/schema';
import { z } from 'zod';

export async function createStockMovement(req: Request, res: Response) {
  try {
    const data = insertStockMovementSchema.parse(req.body);
    const movement = await storage.createStockMovement(data);
    res.status(201).json(movement);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Datos inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Error al registrar movimiento de stock' });
  }
}

export async function listStockMovements(_req: Request, res: Response) {
  try {
    const movements = await storage.getAllStockMovements();
    res.json(movements);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener movimientos' });
  }
}
