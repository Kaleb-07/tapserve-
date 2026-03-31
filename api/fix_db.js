const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- EXHAUSTIVE SYSTEM REPAIR (MySQL Compatibility) ---');

  const checkColumn = async (table, col) => {
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count 
        FROM information_schema.columns 
        WHERE table_name = '${table}' 
        AND column_name = '${col}' 
        AND table_schema = DATABASE()
      `);
      return result[0].count > 0;
    } catch (e) {
      console.log(`- Error checking ${table}.${col}:`, e.message);
      return false;
    }
  };

  const exec = async (sql) => {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`- Success: ${sql.slice(0, 50)}...`);
    } catch (e) {
      console.log(`- Note: ${e.message.slice(0, 100)}...`);
    }
  };

  const columnsToAdd = [
    { table: 'MenuItem', col: 'costPrice', sql: 'ALTER TABLE MenuItem ADD COLUMN costPrice DOUBLE DEFAULT 0' },
    { table: 'Order', col: 'mealType', sql: 'ALTER TABLE \`Order\` ADD COLUMN mealType VARCHAR(255) DEFAULT "ALL"' },
    { table: 'Order', col: 'paymentMethod', sql: 'ALTER TABLE \`Order\` ADD COLUMN paymentMethod VARCHAR(255) DEFAULT "CASH"' },
    { table: 'OrderItem', col: 'costPriceAtOrder', sql: 'ALTER TABLE OrderItem ADD COLUMN costPriceAtOrder DOUBLE DEFAULT 0' },
    { table: 'Category', col: 'mealType', sql: 'ALTER TABLE Category ADD COLUMN mealType VARCHAR(255) DEFAULT "ALL"' }
  ];

  for (const item of columnsToAdd) {
    const exists = await checkColumn(item.table, item.col);
    if (!exists) {
      console.log(`Adding ${item.col} to ${item.table}...`);
      await exec(item.sql);
    } else {
      console.log(`- OK: ${item.table}.${item.col} exists.`);
    }
  }

  console.log('--- REPAIR COMPLETE ---');
}

main().finally(() => prisma.$disconnect());
