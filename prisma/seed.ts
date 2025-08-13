import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSIONS = [
  'canOpenCash',
  'canCloseCash',
  'canCashMovement',
  'canViewSalesSummary',
  'canIssueInvoice',
  'canRetryAfip',
  'canManagePayments',
  'canReconcilePayments',
  'canImportProducts',
  'canEditPrices',
  'canEditCost',
  'canViewKpis',
  'canCreatePO',
  'canReceivePO',
  'canApproveInventory',
  'canCountStock',
  'canExportReports',
  'canManageUsers',
  'canManageRoles',
];

const ROLES: Record<string, string[]> = {
  ADMIN: PERMISSIONS,
  VENDEDOR: [
    'canOpenCash',
    'canCloseCash',
    'canCashMovement',
    'canIssueInvoice',
    'canViewSalesSummary',
  ],
  STOCK: ['canCountStock', 'canApproveInventory', 'canImportProducts'],
  COMPRAS: ['canCreatePO', 'canReceivePO', 'canImportProducts', 'canEditCost'],
  CONTABILIDAD: ['canReconcilePayments', 'canExportReports', 'canViewKpis'],
};

async function main() {
  for (const name of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const [roleName, perms] of Object.entries(ROLES)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    const permissionRecords = await prisma.permission.findMany({
      where: { name: { in: perms } },
    });
    for (const perm of permissionRecords) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
