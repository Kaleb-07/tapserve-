const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Cleaning Up Legacy Categories ---');
  
  // Find categories named 'Lunch' or 'Dinner' or 'Breakfast'
  const legacyNames = ['Breakfast', 'Lunch', 'Dinner'];
  const legacyCats = await prisma.category.findMany({
    where: {
      OR: legacyNames.map(name => ({ name: { equals: name, mode: 'insensitive' } }))
    }
  });

  console.log(`Found ${legacyCats.length} potential legacy categories.`);

  for (const cat of legacyCats) {
    console.log(`Processing: ${cat.name} (${cat.id})`);
    
    // Delete items first
    const itemsDeleted = await prisma.menuItem.deleteMany({
      where: { categoryId: cat.id }
    });
    console.log(`- Deleted ${itemsDeleted.count} items.`);
    
    // Delete category
    await prisma.category.delete({
      where: { id: cat.id }
    });
    console.log(`- Category deleted successfully.`);
  }

  console.log('--- Done ---');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
