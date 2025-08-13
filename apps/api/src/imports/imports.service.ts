import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma.service';
import { ImportProductDto } from './dto/import-product.dto';
import { AuditService } from '../audit/audit.service';
import { AuditActionType } from '@prisma/client';

@Injectable()
export class ImportsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async parse(
    file: Express.Multer.File,
    fast = false,
    userId?: number,
  ) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const raw: any[][] = XLSX.utils.sheet_to_json(sheet, {
      defval: '',
      header: 1,
    }) as any[];
    const headerRow = raw[0] || [];
    const dataRows = raw.slice(1);

    let rows: any[];
    let mapping: Record<string, number | string> = {};

    const normalized = headerRow.map((h) => String(h).toLowerCase());
    const known = ['codigo', 'codigo proveedor', 'nombre', 'precio'];
    if (normalized.some((h) => known.includes(h))) {
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    } else {
      mapping = this.detectColumns(raw);
      rows = dataRows.map((r) => ({
        codigoProveedor: r[mapping['supplierCode' as any]] || r[mapping['code' as any]],
        nombre: r[mapping['name' as any]],
        precio: r[mapping['price' as any]],
        unidad: r[mapping['unit' as any]],
        iva: r[mapping['iva' as any]],
        categoria: r[mapping['category' as any]],
        subcategoria: r[mapping['subcategory' as any]],
        ean: r[mapping['ean' as any]],
      }));
    }

    const products: (ImportProductDto & { errors: string[] })[] = rows.map((row) => {
      const supplierCode =
        row.codigoProveedor ||
        row.supplierCode ||
        row.codigo ||
        row.code ||
        row['Código'] ||
        row['CODIGO'] ||
        '';
      const name =
        row.nombre ||
        row.name ||
        row['Nombre'] ||
        row['NOMBRE'] ||
        '';
      const unit = row.unidad || row.unit || row['Unidad'] || '';
      const price = parseFloat(
        row.precio || row.price || row['Precio'] || row['PRECIO'] || '',
      );
      const iva = row.iva || row.IVA || row['Iva'] || undefined;
      const category =
        row.categoria ||
        row.category ||
        row['Categoria'] ||
        row['Categoría'] ||
        '';
      const subcategory =
        row.subcategoria ||
        row.subcategory ||
        row['Subcategoria'] ||
        row['Subcategoría'] ||
        '';
      const ean = row.ean || row.EAN || row['EAN'] || '';
      return {
        supplierCode,
        name,
        unit,
        price,
        iva: iva ? Number(iva) : undefined,
        category,
        subcategory,
        requiresLabel: false,
        ean,
        errors: [],
      } as ImportProductDto & { errors: string[] };
    });

    const codes = products.map((p) => p.supplierCode).filter(Boolean);
    const existing = codes.length
      ? await this.prisma.product.findMany({
          where: { barcodes: { hasSome: codes } },
          select: { barcodes: true },
        })
      : [];
    const existingCodes = new Set(existing.flatMap((p) => p.barcodes));
    const allCategories = await this.prisma.product.findMany({
      select: { category: true },
    });
    const knownCategories = new Set(allCategories.map((p) => p.category));
    const seenCodes = new Set<string>();

    for (const p of products) {
      if (!p.supplierCode) p.errors.push('Código requerido');
      if (!p.name) p.errors.push('Nombre requerido');
      if (p.price == null || isNaN(p.price) || p.price <= 0)
        p.errors.push('Precio inválido');
      if (p.iva && ![10.5, 21, 27].includes(p.iva))
        p.errors.push('IVA inválido');
      if (p.category && !knownCategories.has(p.category))
        p.errors.push('Categoría no registrada');
      if (p.supplierCode) {
        if (seenCodes.has(p.supplierCode)) p.errors.push('Código duplicado');
        if (existingCodes.has(p.supplierCode))
          p.errors.push('Código ya existe');
        seenCodes.add(p.supplierCode);
      }
    }

    if (fast) {
      const valid = products.filter((p) => p.errors.length === 0);
      const summary = await this.confirm(
        valid,
        userId,
        file.originalname,
      );
      return {
        ...summary,
        errors: products.length - valid.length,
      };
    }

    return { products, filename: file.originalname, suggestedMapping: mapping };
  }

  async confirm(
    products: ImportProductDto[],
    userId?: number,
    filename?: string,
  ) {
    let created = 0;
    let updated = 0;
    let failed = 0;
    for (const p of products) {
      try {
        const existing = await this.prisma.product.findFirst({
          where: {
            OR: [
              { barcodes: { has: p.supplierCode } },
              ...(p.ean ? [{ barcodes: { has: p.ean } }] : []),
            ],
          },
        });
        if (existing) {
          await this.prisma.product.update({
            where: { id: existing.id },
            data: {
              name: p.name,
              unit: p.unit || existing.unit,
              priceARS: p.price,
              category: p.category || existing.category,
              subcategory: p.subcategory || existing.subcategory,
              requiresLabel: p.requiresLabel ?? existing.requiresLabel,
            },
          });
          updated++;
        } else {
          await this.prisma.product.create({
            data: {
              name: p.name,
              description: '',
              stock: 0,
              minStock: 0,
              costARS: 0,
              priceARS: p.price,
              unit: p.unit || '',
              category: p.category || '',
              subcategory: p.subcategory || '',
              barcodes: p.supplierCode ? [p.supplierCode] : [],
              variants: null,
              isBulk: false,
              isRefrigerated: false,
              requiresLabel: p.requiresLabel ?? false,
            },
          });
          created++;
        }
      } catch (e) {
        failed++;
      }
    }

    if (filename) {
      await this.prisma.importLog.create({
        data: {
          filename,
          userId,
          totalCreated: created,
          totalUpdated: updated,
          totalErrors: failed,
        },
      });
    }

    await this.audit.log({
      userId: userId ? String(userId) : 'unknown',
      userEmail: '',
      actionType: AuditActionType.IMPORTACION,
      entity: 'Producto',
      details: `Importación ${filename || ''}: ${created} creados, ${updated} actualizados, ${failed} fallidos`,
    });

    return { created, updated, failed };
  }

  listLogs(from?: string, to?: string, user?: string) {
    const where: any = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    if (user) {
      where.user = { email: user };
    }
    return this.prisma.importLog.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private detectColumns(rows: any[][]) {
    const sample = rows.slice(0, 5);
    const numCols = Math.max(...sample.map((r) => r.length));
    const scores = Array.from({ length: numCols }, () => ({
      code: 0,
      name: 0,
      price: 0,
    }));
    for (const row of sample) {
      for (let i = 0; i < numCols; i++) {
        const cell = row[i];
        if (cell === undefined || cell === null || cell === '') continue;
        const cellStr = String(cell);
        if (/^[0-9]{4,13}$/.test(cellStr)) scores[i].code++;
        if (/[a-zA-Z]/.test(cellStr)) scores[i].name++;
        if (/^[0-9]+(\.[0-9]+)?$/.test(cellStr)) scores[i].price++;
      }
    }
    const pick = (key: 'code' | 'name' | 'price') =>
      scores.indexOf(
        scores.reduce((a, b) => (a[key] > b[key] ? a : b), scores[0]),
      );
    return {
      supplierCode: pick('code'),
      name: pick('name'),
      price: pick('price'),
    };
  }
}
