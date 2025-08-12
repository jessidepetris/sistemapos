import { Controller, Get, Param, Res, Headers, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { Response } from 'express';

@Controller('documents')
export class DocumentsController {
  constructor(private docs: DocumentsService) {}

  private checkRole(role?: string) {
    if (role !== 'ADMIN' && role !== 'VENDEDOR') {
      throw new ForbiddenException();
    }
  }

  @Get('invoice/:id/pdf')
  async invoice(@Param('id') id: string, @Res() res: Response, @Headers('x-user-role') role?: string) {
    this.checkRole(role);
    const pdf = await this.docs.invoice(id);
    if (!pdf) throw new NotFoundException();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  }

  @Get('remito/:id/pdf')
  async remito(@Param('id') id: string, @Res() res: Response, @Headers('x-user-role') role?: string) {
    this.checkRole(role);
    const pdf = await this.docs.remito(id);
    if (!pdf) throw new NotFoundException();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  }

  @Get('order/:id/pdf')
  async order(@Param('id') id: string, @Res() res: Response, @Headers('x-user-role') role?: string) {
    this.checkRole(role);
    const pdf = await this.docs.order(id);
    if (!pdf) throw new NotFoundException();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  }

  @Get('quotation/:id/pdf')
  async quotation(@Param('id') id: string, @Res() res: Response, @Headers('x-user-role') role?: string) {
    this.checkRole(role);
    const pdf = await this.docs.quotation(id);
    if (!pdf) throw new NotFoundException();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  }

  @Get('credit/:id/pdf')
  async credit(@Param('id') id: string, @Res() res: Response, @Headers('x-user-role') role?: string) {
    this.checkRole(role);
    const pdf = await this.docs.credit(id);
    if (!pdf) throw new NotFoundException();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  }

  @Get('debit/:id/pdf')
  async debit(@Param('id') id: string, @Res() res: Response, @Headers('x-user-role') role?: string) {
    this.checkRole(role);
    const pdf = await this.docs.debit(id);
    if (!pdf) throw new NotFoundException();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  }

  @Get('change/:id/pdf')
  async change(@Param('id') id: string, @Res() res: Response, @Headers('x-user-role') role?: string) {
    this.checkRole(role);
    const pdf = await this.docs.change(id);
    if (!pdf) throw new NotFoundException();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  }
}

