import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // basic permission and role
  const perm = await prisma.permission.upsert({
    where: { name: 'canManage' },
    update: {},
    create: { name: 'canManage' },
  });

  const role = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
    update: {},
    create: { roleId: role.id, permissionId: perm.id },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: { email: 'admin@test.com', name: 'Admin', password: 'test' },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: role.id } },
    update: {},
    create: { userId: admin.id, roleId: role.id },
  });

  const bulk = await prisma.product.create({
    data: {
      name: 'Azucar Granel',
      description: 'Producto a granel',
      stock: new Prisma.Decimal(0),
      minStock: 0,
      costARS: new Prisma.Decimal(10),
      priceARS: new Prisma.Decimal(15),
      unit: 'kg',
      category: 'Granel',
      barcodes: [],
      isBulk: true,
      isRefrigerated: false,
    },
  });

  const pack = await prisma.product.create({
    data: {
      name: 'Pack Azucar',
      description: 'Pack',
      stock: new Prisma.Decimal(0),
      minStock: 0,
      costARS: new Prisma.Decimal(20),
      priceARS: new Prisma.Decimal(30),
      unit: 'pack',
      category: 'Pack',
      barcodes: [],
      isBulk: false,
      isRefrigerated: false,
    },
  });

  const kit = await prisma.product.create({
    data: {
      name: 'Kit Dulce',
      description: 'Kit',
      stock: new Prisma.Decimal(0),
      minStock: 0,
      costARS: new Prisma.Decimal(50),
      priceARS: new Prisma.Decimal(80),
      unit: 'kit',
      category: 'Kit',
      barcodes: [],
      isBulk: false,
      isRefrigerated: false,
      isComposite: true,
    },
  });

  await prisma.kitItem.create({
    data: {
      kitId: kit.id,
      componentId: bulk.id,
      quantity: new Prisma.Decimal(1),
    },
  });

  await prisma.client.upsert({
    where: { email: 'client@test.com' },
    update: {},
    create: { name: 'Cliente Test', email: 'client@test.com', password: 'test' },
  });

  await prisma.supplier.upsert({
    where: { id: 'supplier-1' },
    update: {},
    create: { id: 'supplier-1', name: 'Proveedor Test' },
  });

  await prisma.promotion.upsert({
    where: { id: 'promo-1' },
    update: {},
    create: {
      id: 'promo-1',
      name: 'Promo Test',
      type: 'PERCENT',
      discountPercent: new Prisma.Decimal(10),
      validFrom: new Date(),
      validTo: new Date(Date.now() + 86400000),
      active: true,
    },
  });
}

if (process.env.NODE_ENV === 'test') {
  main()
    .catch(e => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
