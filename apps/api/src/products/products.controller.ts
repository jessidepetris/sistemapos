import { Controller, Get, Post, Body, Param, Patch, Delete, Req, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuditService } from '../audit/audit.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  async create(@Body() dto: CreateProductDto, @Req() req: any) {
    const product = await this.productsService.create(dto);
    await this.auditService.create({
      userId: req.user?.id ?? 'unknown',
      userEmail: req.user?.email ?? '',
      action: 'NUEVO_PRODUCTO',
      entity: 'Producto',
      entityId: product.id.toString(),
      description: `Creó producto ${product.name}`,
    });
    return product;
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get('barcode/:code')
  async findByBarcode(@Param('code') code: string, @Req() req: any) {
    const product = await this.productsService.findByBarcode(code);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    const role = req.user?.role || req.headers['x-user-role'];
    const base: any = { name: product.name, price: product.priceARS };
    if (role === 'ADMIN' || role === 'VENDEDOR') {
      base.stock = product.stock;
      base.imageUrl = product.imageUrl;
    }
    return base;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Req() req: any) {
    const product = await this.productsService.update(+id, dto);
    await this.auditService.create({
      userId: req.user?.id ?? 'unknown',
      userEmail: req.user?.email ?? '',
      action: 'MODIFICAR_PRODUCTO',
      entity: 'Producto',
      entityId: id,
      description: `Actualizó producto ${product.name}`,
    });
    return product;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
