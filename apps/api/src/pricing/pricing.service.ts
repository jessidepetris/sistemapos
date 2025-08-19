import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import * as ExcelJS from 'exceljs';
import * as cheerio from 'cheerio';
import type { Express } from 'express';
import { Buffer } from 'node:buffer';
import 'multer';

interface Suggestion {
  productId: number;
  detectedCost: number;
  currentCost: number;
  suggestedPrice: number;
  difference: number;
}

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  async bulkPriceUpdate(file: Express.Multer.File) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as unknown as Buffer);
    const sheet = workbook.worksheets[0];

    const headerRow = sheet.getRow(1).values as Array<string>;
    const updates = [] as any[];
    const errors = [] as any[];

    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i).values as any[];
      const record: any = {};
      headerRow.forEach((h, idx) => {
        if (idx === 0) return;
        record[h] = row[idx];
      });

      const productId = Number(record['productId']);
      const newCost = record['nuevoCosto'];
      if (!productId || !newCost) {
        errors.push({ row: i, reason: 'Datos faltantes' });
        continue;
      }
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product) {
        errors.push({ row: i, reason: 'Producto no encontrado' });
        continue;
      }

      let newPrice: number | null = null;
      if (record['nuevoPrecioVenta']) {
        newPrice = Number(record['nuevoPrecioVenta']);
      } else if (record['porcentajeGanancia']) {
        const pct = Number(record['porcentajeGanancia']);
        newPrice = Number(newCost) * (1 + pct / 100);
      }

      const updated = await this.prisma.product.update({
        where: { id: productId },
        data: {
          costARS: newCost,
          priceARS: newPrice ?? product.priceARS,
        },
      });

      await this.prisma.priceChangeLog.create({
        data: {
          productId: productId,
          oldCost: product.costARS,
          newCost: newCost,
          oldPrice: product.priceARS,
          newPrice: newPrice ?? product.priceARS,
        },
      });

      updates.push(updated.id);
    }

    return { updated: updates.length, errors };
  }

  async runWatcher(): Promise<Suggestion[]> {
    const watchers = [
      // placeholder configuration
      {
        url: 'https://example.com',
        productSelector: '.product',
        codeAttr: 'data-code',
        priceSelector: '.price',
      },
    ];

    const suggestions: Suggestion[] = [];

    for (const w of watchers) {
      try {
        const html = await fetch(w.url).then((r) => r.text());
        const $ = cheerio.load(html);
        $(w.productSelector).each((_, el) => {
          const code = $(el).attr(w.codeAttr) || $(el).find('.code').text();
          const priceText = $(el).find(w.priceSelector).text();
          const detected = Number(priceText.replace(/[^0-9.,]/g, '').replace(',', '.'));
          if (!code || !detected) return;
          suggestions.push({
            productId: Number(code),
            detectedCost: detected,
            currentCost: 0,
            suggestedPrice: detected,
            difference: 0,
          });
        });
      } catch (e) {
        // ignore errors
      }
    }

    // enrich with db data
    for (const s of suggestions) {
      const product = await this.prisma.product.findUnique({ where: { id: s.productId } });
      if (!product) continue;
      s.currentCost = Number(product.costARS);
      s.difference = ((s.detectedCost - s.currentCost) / s.currentCost) * 100;
      s.suggestedPrice = Number(product.priceARS);
    }

    return suggestions;
  }

  async applySuggestions(data: Suggestion[]) {
    const updated: number[] = [];
    for (const s of data) {
      const product = await this.prisma.product.findUnique({ where: { id: s.productId } });
      if (!product) continue;
      await this.prisma.product.update({
        where: { id: s.productId },
        data: { costARS: s.detectedCost, priceARS: s.suggestedPrice },
      });
      await this.prisma.priceChangeLog.create({
        data: {
          productId: s.productId,
          oldCost: product.costARS,
          newCost: s.detectedCost,
          oldPrice: product.priceARS,
          newPrice: s.suggestedPrice,
        },
      });
      updated.push(s.productId);
    }
    return { updated: updated.length };
  }
}

