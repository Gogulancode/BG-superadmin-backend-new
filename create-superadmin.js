const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('SuperAdmin123!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'superadmin@bg.com' },
    update: {},
    create: {
      email: 'superadmin@bg.com',
      name: 'Super Admin',
      passwordHash: hash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  console.log('Created superadmin user:', user.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
