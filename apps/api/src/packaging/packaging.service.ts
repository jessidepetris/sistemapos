import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePackagingDto } from './dto/create-packaging.dto';
import { LabelsService } from '../labels/labels.service';
import { ScaleFakeService } from '../scale-fake/scale-fake.service';
import { AuditService } from '../audit/audit.service';
import {
  AuditActionType,
  ScaleEncoding,
  PackagingStatus,
} from '@prisma/client';
import { QuickPackDto } from './dto/quick-pack.dto';

@Injectable()
export class PackagingService {
  constructor(
    private prisma: PrismaService,
    private labels: LabelsService,
    private scaleFake: ScaleFakeService,
    private audit: AuditService,
  ) {}

  create(dto: CreatePackagingDto) {
    return this.prisma.packagingOrder.create({
      data: {
        createdBy: dto.createdBy,
        notes: dto.notes,
        items: {
          create: dto.items.map(i => ({
            variantId: i.variantId,
            qtyToMake: i.qtyToMake,
            wasteKg: i.wasteKg,
            wastePct: i.wastePct,
            wasteReason: i.wasteReason,
          })),
        },
      },
      include: { items: true },
    });
  }

  findAll(status?: string) {
    const where = status
      ? { status: PackagingStatus[status as keyof typeof PackagingStatus] }
      : undefined;
    return this.prisma.packagingOrder.findMany({
      where,
      include: { items: { include: { variant: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.packagingOrder.findUnique({
      where: { id },
      include: { items: { include: { variant: true } } },
    });
  }

  async confirm(id: string) {
    const order = await this.prisma.packagingOrder.findUnique({
      where: { id },
      include: { items: { include: { variant: { include: { parentProduct: true } } } } },
    });
    if (!order) throw new NotFoundException();
    if (order.status !== 'DRAFT') throw new BadRequestException('Ya confirmado');
    const settings = await this.prisma.systemSetting.findFirst();
    for (const item of order.items) {
      const required = Number(item.variant.contentKg) * item.qtyToMake;
      const baseWaste = item.wastePct ? required * Number(item.wastePct) : 0;
      const extraWaste = item.wasteKg ? Number(item.wasteKg) : 0;
      const totalWaste = baseWaste + extraWaste;
      if (
        item.wastePct &&
        settings &&
        Number(item.wastePct) > Number(settings.packagingMaxWastePct)
      ) {
        throw new BadRequestException('Merma excede máximo');
      }
      if (settings?.packagingRequireWasteReason && totalWaste > 0 && !item.wasteReason) {
        throw new BadRequestException('Merma requiere motivo');
      }
      const totalConsume = required + totalWaste;
      if (Number(item.variant.parentProduct.stock) < totalConsume) {
        throw new BadRequestException('Stock insuficiente');
      }
    }
    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const product = item.variant.parentProduct;
        const required = Number(item.variant.contentKg) * item.qtyToMake;
        const baseWaste = item.wastePct ? required * Number(item.wastePct) : 0;
        const extraWaste = item.wasteKg ? Number(item.wasteKg) : 0;
        const totalWaste = baseWaste + extraWaste;
        const totalConsume = required + totalWaste;
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: totalConsume } },
        });
        await tx.packVariant.update({
          where: { id: item.variantId },
          data: { stockPacks: { increment: item.qtyToMake } },
        });
        const unitCost = Number(product.costARS);
        await tx.costLedger.create({
          data: {
            productId: product.id,
            type: 'PACKAGING_CONSUME',
            refTable: 'PackagingOrderItem',
            refId: item.id,
            qty: -required,
            unitCostArs: unitCost,
            totalCostArs: -required * unitCost,
          },
        });
        if (totalWaste > 0) {
          await tx.costLedger.create({
            data: {
              productId: product.id,
              type: 'MERMA',
              refTable: 'PackagingOrderItem',
              refId: item.id,
              qty: -totalWaste,
              unitCostArs: unitCost,
              totalCostArs: -totalWaste * unitCost,
              notes: item.wasteReason,
            },
          });
        }
      }
      await tx.packagingOrder.update({ where: { id }, data: { status: 'CONFIRMED' } });
    });
    const updated = await this.findOne(id);
    let pdf: Buffer | undefined;
    if (settings?.packagingPrintOnConfirm) {
      const labelItems: Array<{ description: string; ean13: string; copies: number }> = [];
      for (const it of updated.items) {
        let ean = it.variant.barcode || it.variant.fakeScaleBarcode;
        if (!ean && settings.labelsAllowFakeScaleIfMissingBarcode) {
          const base12 = this.scaleFake.buildBase12({
            prefix: settings.scaleCodesDefaultPrefix,
            scheme: settings.scaleCodesDefaultScheme as ScaleEncoding,
            contentKg: Number(it.variant.contentKg),
          });
          ean = this.scaleFake.toEAN13(base12);
          await this.prisma.packVariant.update({
            where: { id: it.variantId },
            data: {
              fakeScaleBarcode: ean,
              fakeScaleScheme: settings.scaleCodesDefaultScheme,
              fakeScalePrefix: settings.scaleCodesDefaultPrefix,
            },
          });
        }
        if (!ean) continue;
        const description = `${it.variant.parentProduct.name} ${it.variant.name}`.slice(0, 36);
        labelItems.push({ description, ean13: ean, copies: it.qtyToMake });
      }
      if (labelItems.length) {
        pdf = await this.labels.renderMinLabelPDF(labelItems, {
          widthMm: settings.labelsSizeWidthMm,
          heightMm: settings.labelsSizeHeightMm,
          gutterMm: settings.labelsGutterMm,
          fontSizePt: settings.labelsFontSizeTitlePt,
          barcodeHeightMm: settings.labelsBarcodeHeightMm,
          columns: settings.labelsTwoBands ? 2 : 1,
        });
        await this.audit.log({ userId: order.createdBy, userEmail: '', actionType: AuditActionType.LABELS_PRINT_AUTO, entity: 'PackagingOrder', entityId: id });
      }
    }
    await this.audit.log({ userId: order.createdBy, userEmail: '', actionType: AuditActionType.PACKAGING_CONFIRM, entity: 'PackagingOrder', entityId: id });
    return { ...updated, labelsPdf: pdf?.toString('base64') };
  }

  async quickPack(dto: QuickPackDto, userId: string) {
    const variant = await this.prisma.packVariant.findUnique({ include: { parentProduct: true }, where: { id: dto.variantId } });
    if (!variant) throw new NotFoundException('Variant not found');
    if (variant.parentProduct.id !== dto.productId) throw new BadRequestException('Mismatch');
    const settings = await this.prisma.systemSetting.findFirst();
    const required = Number(variant.contentKg) * dto.qty;
    const baseWaste = dto.wastePct ? required * Number(dto.wastePct) : 0;
    const extraWaste = dto.wasteKg ? dto.wasteKg : 0;
    const totalWaste = baseWaste + extraWaste;
    if (
      dto.wastePct &&
      settings &&
      Number(dto.wastePct) > Number(settings.packagingMaxWastePct)
    ) {
      throw new BadRequestException('Merma excede máximo');
    }
    if (settings?.packagingRequireWasteReason && totalWaste > 0 && !dto.wasteReason) {
      throw new BadRequestException('Merma requiere motivo');
    }
    const totalConsume = required + totalWaste;
    if (Number(variant.parentProduct.stock) < totalConsume) throw new BadRequestException('Stock insuficiente');
    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id: dto.productId }, data: { stock: { decrement: totalConsume } } });
      if (dto.addToStock) {
        await tx.packVariant.update({ where: { id: dto.variantId }, data: { stockPacks: { increment: dto.qty } } });
      }
      const unitCost = Number(variant.parentProduct.costARS);
      await tx.costLedger.create({
        data: {
          productId: dto.productId,
          type: 'PACKAGING_CONSUME',
          refTable: 'QuickPack',
          qty: -required,
          unitCostArs: unitCost,
          totalCostArs: -required * unitCost,
        },
      });
      if (totalWaste > 0) {
        await tx.costLedger.create({
          data: {
            productId: dto.productId,
            type: 'MERMA',
            refTable: 'QuickPack',
            qty: -totalWaste,
            unitCostArs: unitCost,
            totalCostArs: -totalWaste * unitCost,
            notes: dto.wasteReason,
          },
        });
      }
    });
    let pdf: Buffer | undefined;
    if (dto.printLabels && settings?.packagingPrintOnQuickPack) {
      let ean = variant.barcode || variant.fakeScaleBarcode;
      if (!ean && settings.labelsAllowFakeScaleIfMissingBarcode) {
        const base12 = this.scaleFake.buildBase12({
          prefix: settings.scaleCodesDefaultPrefix,
          scheme: settings.scaleCodesDefaultScheme as ScaleEncoding,
          contentKg: Number(variant.contentKg),
        });
        ean = this.scaleFake.toEAN13(base12);
        await this.prisma.packVariant.update({
          where: { id: dto.variantId },
          data: {
            fakeScaleBarcode: ean,
            fakeScaleScheme: settings.scaleCodesDefaultScheme,
            fakeScalePrefix: settings.scaleCodesDefaultPrefix,
          },
        });
      }
      if (ean) {
        pdf = await this.labels.renderMinLabelPDF([
          { description: `${variant.parentProduct.name} ${variant.name}`.slice(0, 36), ean13: ean, copies: dto.qty },
        ], {
          widthMm: settings?.labelsSizeWidthMm,
          heightMm: settings?.labelsSizeHeightMm,
          gutterMm: settings?.labelsGutterMm,
          fontSizePt: settings?.labelsFontSizeTitlePt,
          barcodeHeightMm: settings?.labelsBarcodeHeightMm,
          columns: settings?.labelsTwoBands ? 2 : 1,
        });
        await this.audit.log({ userId, userEmail: '', actionType: AuditActionType.LABELS_PRINT_AUTO, entity: 'PackVariant', entityId: dto.variantId });
      }
    }
    await this.audit.log({ userId, userEmail: '', actionType: AuditActionType.PACKAGING_CONFIRM, entity: 'PackVariant', entityId: dto.variantId });
    return { labelsPdf: pdf?.toString('base64') };
  }
}
