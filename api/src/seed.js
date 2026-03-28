const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customizationOption.deleteMany();
  await prisma.customizationGroup.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.source.deleteMany();

  console.log('Cleared database');

  // Categories
  const starters = await prisma.category.create({
    data: { name: 'Starters', order: 1 },
  });
  const mains = await prisma.category.create({
    data: { name: 'Main Course', order: 2 },
  });
  const drinks = await prisma.category.create({
    data: { name: 'Drinks', order: 3 },
  });

  // Customization Groups
  const meatDoneness = await prisma.customizationGroup.create({
    data: {
      name: 'Meat Doneness',
      minSelections: 1,
      maxSelections: 1,
      options: {
        create: [
          { name: 'Rare', priceModifier: 0 },
          { name: 'Medium Rare', priceModifier: 0 },
          { name: 'Medium', priceModifier: 0 },
          { name: 'Well Done', priceModifier: 0 },
        ],
      },
    },
  });

  const extras = await prisma.customizationGroup.create({
    data: {
      name: 'Extras',
      minSelections: 0,
      maxSelections: 3,
      options: {
        create: [
          { name: 'Gold Leaf topping', priceModifier: 15.0 },
          { name: 'Black Truffle shavings', priceModifier: 20.0 },
          { name: 'Extra Sauce', priceModifier: 5.0 },
        ],
      },
    },
  });

  // Menu Items
  await prisma.menuItem.create({
    data: {
      name: 'Prime Beef Carpaccio',
      description: 'Thinly sliced A5 Wagyu with wild arugula and citrus vinaigrette.',
      price: 45.0,
      image: 'https://images.unsplash.com/photo-1510629954389-c1e0da47d414?q=80&w=500',
      categoryId: starters.id,
      customGroups: { connect: [{ id: extras.id }] },
    },
  });

  await prisma.menuItem.create({
    data: {
      name: 'Wagyu Ribeye Steak',
      description: '300g Japanese Wagyu Ribeye, served with roasted seasonal vegetables.',
      price: 180.0,
      image: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?q=80&w=500',
      categoryId: mains.id,
      customGroups: { connect: [{ id: meatDoneness.id }, { id: extras.id }] },
    },
  });

  await prisma.menuItem.create({
    data: {
      name: 'Vintage Champagne',
      description: 'Dom Pérignon Vintage 2012, served chilled.',
      price: 350.0,
      image: 'https://images.unsplash.com/photo-1594498653385-d5172c532c00?q=80&w=500',
      categoryId: drinks.id,
    },
  });

  // Sources
  await prisma.source.createMany({
    data: [
      { type: 'TABLE', identifier: 'Table 1' },
      { type: 'TABLE', identifier: 'Table 5' },
      { type: 'ROOM', identifier: 'Room 203' },
      { type: 'EVENT', identifier: 'Gala Event 2025' },
    ],
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
