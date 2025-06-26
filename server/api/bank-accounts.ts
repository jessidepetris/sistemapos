import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

const bankAccountSchema = z.object({
  bankName: z.string().min(1, "El nombre del banco es requerido"),
  accountNumber: z.string().min(1, "El número de cuenta es requerido"),
  accountType: z.string().min(1, "El tipo de cuenta es requerido"),
  alias: z.string().min(1, "El alias es requerido"),
  isActive: z.boolean().default(true)
});

export type BankAccountData = z.infer<typeof bankAccountSchema>;

export async function getBankAccounts() {
  try {
    console.log("Obteniendo todas las cuentas bancarias...");
    const accounts = await storage.getAllBankAccounts();
    console.log(`Se encontraron ${accounts.length} cuentas bancarias`);
    return accounts;
  } catch (error) {
    console.error("Error al obtener cuentas bancarias:", error);
    throw error;
  }
}

export async function createBankAccount(data: BankAccountData) {
  try {
    console.log("Intentando crear nueva cuenta bancaria con datos:", data);
    
    const validatedData = bankAccountSchema.parse(data);
    console.log("Datos validados correctamente:", validatedData);
    
    const account = await storage.createBankAccount(validatedData);
    console.log("Cuenta bancaria creada exitosamente:", account);
    
    return account;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Error de validación al crear cuenta bancaria:", error.errors);
      throw new Error("Datos de cuenta bancaria inválidos: " + error.errors.map(e => e.message).join(", "));
    }
    console.error("Error al crear cuenta bancaria:", error);
    throw error;
  }
}

export async function updateBankAccount(id: number, data: BankAccountData) {
  try {
    console.log(`Intentando actualizar cuenta bancaria con ID ${id} con datos:`, data);
    
    if (isNaN(id)) {
      console.error("ID de cuenta bancaria inválido:", id);
      throw new Error("ID de cuenta bancaria inválido");
    }
    
    const validatedData = bankAccountSchema.parse(data);
    console.log("Datos validados correctamente:", validatedData);
    
    const account = await storage.updateBankAccount(id, validatedData);
    console.log("Cuenta bancaria actualizada exitosamente:", account);
    
    return account;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Error de validación al actualizar cuenta bancaria:", error.errors);
      throw new Error("Datos de cuenta bancaria inválidos: " + error.errors.map(e => e.message).join(", "));
    }
    console.error("Error al actualizar cuenta bancaria:", error);
    throw error;
  }
}

export async function deleteBankAccount(id: number) {
  try {
    console.log(`Intentando eliminar cuenta bancaria con ID ${id}`);
    
    if (isNaN(id)) {
      console.error("ID de cuenta bancaria inválido:", id);
      throw new Error("ID de cuenta bancaria inválido");
    }
    
    await storage.deleteBankAccount(id);
    console.log("Cuenta bancaria eliminada exitosamente");
    
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar cuenta bancaria:", error);
    throw error;
  }
} 