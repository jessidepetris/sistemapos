import { Controller, Get, Post, Body, Param, Patch, Delete, Req, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuditService } from '../audit/audit.service';
import { AuditActionType } from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  async create(@Body() dto: CreateProductDto, @Req() req: any) {
    const product = await this.productsService.create(dto);
    await this.auditService.log({
      userId: req.user?.id ?? 'unknown',
      userEmail: req.user?.email ?? '',
      actionType: AuditActionType.CREACION,
      entity: 'Producto',
      entityId: product.id.toString(),
      details: `Creó producto ${product.name}`,
    });
    return product;
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get('barcode/:code')
  async findByBarcode(@Param('code') code: string, @Req() req: any) {
    const product: any = await this.productsService.findByBarcode(code);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    const role = req.user?.role || req.headers['x-user-role'];
    const base: any = {
      id: product.id,
      name: product.name,
      price: product.priceARS,
      imageUrl: product.imageUrl,
      variants: product.variants,
      subcategory: product.subcategory,
      isComposite: product.isComposite,
    };
    if (product.variantId) {
      base.variantId = product.variantId;
      base.contentKg = product.contentKg;
      base.name = `${product.name} ${product.variantName}`.trim();
    }
    if (product.isComposite) {
      base.components = product.kitItems.map((ki: any) => ({
        id: ki.component.id,
        name: ki.component.name,
        quantity: ki.quantity,
      }));
    }
    if (role === 'ADMIN' || role === 'VENDEDOR') {
      base.stock = product.variantId ? product.stockPacks : product.stock;
    }
    return base;
  }

  @Get('public/barcode/:code')
  async publicFindByBarcode(@Param('code') code: string) {
    const product = await this.productsService.findByBarcode(code);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    const base: any = {
      name: product.name,
      price: product.priceARS,
      imageUrl: product.imageUrl,
      variants: product.variants,
      isComposite: product.isComposite,
    };
    if (product.isComposite) {
      base.components = product.kitItems.map((ki: any) => ({
        name: ki.component.name,
        quantity: ki.quantity,
      }));
    }
    return base;
  }

  @Get(':id/similar')
  findSimilar(@Param('id') id: string) {
    return this.productsService.findSimilar(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Req() req: any) {
    const product = await this.productsService.update(+id, dto);
    await this.auditService.log({
      userId: req.user?.id ?? 'unknown',
      userEmail: req.user?.email ?? '',
      actionType: AuditActionType.EDICION,
      entity: 'Producto',
      entityId: id,
      details: `Actualizó producto ${product.name}`,
    });
    return product;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const product = await this.productsService.findOne(+id);
    const result = await this.productsService.remove(+id);
    await this.auditService.log({
      userId: req.user?.id ?? 'unknown',
      userEmail: req.user?.email ?? '',
      actionType: AuditActionType.ELIMINACION,
      entity: 'Producto',
      entityId: id,
      details: `Eliminó producto ${product?.name ?? id}`,
    });
    return result;
  }
}
