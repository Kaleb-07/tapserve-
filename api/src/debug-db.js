const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Database Seeding Check ---');
  try {
    const settingsCount = await prisma.settings.count();
    console.log('Current settings count:', settingsCount);
    
    if (settingsCount === 0) {
      console.log('Attempting to create default settings...');
      const created = await prisma.settings.create({
        data: {
          hotelName: 'NORA LUXE',
          currency: 'USD',
          supportEmail: 'concierge@nora-resort.com'
        }
      });
      console.log('✅ Created default settings:', created);
    } else {
      const existing = await prisma.settings.findFirst();
      console.log('✅ Existing settings found:', existing);
    }
  } catch (err) {
    console.error('❌ FAILED to create/read settings:', err.message);
    if (err.code) console.error('Error Code:', err.code);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
