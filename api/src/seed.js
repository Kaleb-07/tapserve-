const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Verified Unsplash food photo IDs
const u = (id) => JSON.stringify([`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=80`]);

const I = {
  injera:    u('1567620905732-2d1ec7ab7445'),
  eggs:      u('1482049016688-2d3e1b311543'),
  porridge:  u('1517673400267-0251440c45dc'),
  bread:     u('1509440159596-0249088772ff'),
  juice:     u('1600271886742-f049cd451bba'),
  coffee:    u('1495474472287-4d71bcdd2085'),
  tea:       u('1556679343-c7306c1976bc'),
  fruit:     u('1490474418585-ba9bad8fd0ea'),
  yogurt:    u('1488477181946-6428a0291777'),
  bfast:     u('1504674900247-0877df9cc836'),
  stew:      u('1547592166-23ac45744acd'),
  chicken:   u('1598103442097-8b74394b95c8'),
  beef:      u('1544025162-d76694265947'),
  lentils:   u('1585937421612-70a008356fbe'),
  salad:     u('1512621776951-a57141f2eefd'),
  pasta:     u('1555949258-eb67b1ef0ceb'),
  sandwich:  u('1528735602780-2552fd46c7af'),
  lemonade:  u('1621263764928-df1444c5e859'),
  platter:   u('1414235077428-338989a2e8c0'),
  lamb:      u('1529692236671-f1f6cf9683ba'),
  fish:      u('1519708227418-c8fd9a32b7a2'),
  grill:     u('1555939594-58d7cb561ad1'),
  veggie:    u('1540420773420-3366772f4999'),
  samosa:    u('1601050690597-df0568f70950'),
  hummus:    u('1577805947697-89e18249d767'),
  dessert:   u('1519676867240-f03562e64548'),
  sorbet:    u('1488900128323-21503983a07e'),
  wine:      u('1510812431401-41d2bd2722f3'),
  mocktail:  u('1544145945-f90425340c7e'),
  espresso:  u('1510591509098-f4fdc6d0ff04'),
};

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  console.log('Cleared existing menu data');

  const bFirfir   = await prisma.category.create({ data: { name: 'Firfir & Fit-Fit',         mealType: 'BREAKFAST', order: 1 } });
  const bEggs     = await prisma.category.create({ data: { name: 'Egg Dishes',               mealType: 'BREAKFAST', order: 2 } });
  const bPorridge = await prisma.category.create({ data: { name: 'Porridge & Genfo',         mealType: 'BREAKFAST', order: 3 } });
  const bPastry   = await prisma.category.create({ data: { name: 'Pastries & Bread',         mealType: 'BREAKFAST', order: 4 } });
  const bJuice    = await prisma.category.create({ data: { name: 'Fresh Juices',             mealType: 'BREAKFAST', order: 5 } });
  const bCoffee   = await prisma.category.create({ data: { name: 'Ethiopian Coffee',         mealType: 'BREAKFAST', order: 6 } });
  const bTea      = await prisma.category.create({ data: { name: 'Tea & Hot Drinks',         mealType: 'BREAKFAST', order: 7 } });
  const bFruit    = await prisma.category.create({ data: { name: 'Fruit Plates',             mealType: 'BREAKFAST', order: 8 } });
  const bYogurt   = await prisma.category.create({ data: { name: 'Yogurt & Dairy',           mealType: 'BREAKFAST', order: 9 } });
  const bSpecial  = await prisma.category.create({ data: { name: "Chef's Breakfast Special", mealType: 'BREAKFAST', order: 10 } });
  const lInjera   = await prisma.category.create({ data: { name: 'Injera Platters',          mealType: 'LUNCH', order: 1 } });
  const lWot      = await prisma.category.create({ data: { name: 'Wot & Stews',              mealType: 'LUNCH', order: 2 } });
  const lTibs     = await prisma.category.create({ data: { name: 'Tibs & Grills',            mealType: 'LUNCH', order: 3 } });
  const lVeg      = await prisma.category.create({ data: { name: 'Vegetarian Fasting',       mealType: 'LUNCH', order: 4 } });
  const lSalad    = await prisma.category.create({ data: { name: 'Salads & Sides',           mealType: 'LUNCH', order: 5 } });
  const lSoup     = await prisma.category.create({ data: { name: 'Soups',                    mealType: 'LUNCH', order: 6 } });
  const lPasta    = await prisma.category.create({ data: { name: 'Pasta & International',    mealType: 'LUNCH', order: 7 } });
  const lSandwich = await prisma.category.create({ data: { name: 'Sandwiches & Wraps',       mealType: 'LUNCH', order: 8 } });
  const lDrinks   = await prisma.category.create({ data: { name: 'Lunch Drinks',             mealType: 'LUNCH', order: 9 } });
  const lSpecial  = await prisma.category.create({ data: { name: "Chef's Lunch Special",     mealType: 'LUNCH', order: 10 } });
  const dMeat     = await prisma.category.create({ data: { name: 'Meat Feasts',              mealType: 'DINNER', order: 1 } });
  const dSeafood  = await prisma.category.create({ data: { name: 'Seafood',                  mealType: 'DINNER', order: 2 } });
  const dGrill    = await prisma.category.create({ data: { name: 'Mixed Grill',              mealType: 'DINNER', order: 3 } });
  const dVeg      = await prisma.category.create({ data: { name: 'Vegetarian Dinner',        mealType: 'DINNER', order: 4 } });
  const dApp      = await prisma.category.create({ data: { name: 'Appetizers',               mealType: 'DINNER', order: 5 } });
  const dDessert  = await prisma.category.create({ data: { name: 'Desserts',                 mealType: 'DINNER', order: 6 } });
  const dCocktail = await prisma.category.create({ data: { name: 'Cocktails & Mocktails',    mealType: 'DINNER', order: 7 } });
  const dWine     = await prisma.category.create({ data: { name: 'Wine & Tej',               mealType: 'DINNER', order: 8 } });
  const dCoffeeD  = await prisma.category.create({ data: { name: 'After-Dinner Coffee',      mealType: 'DINNER', order: 9 } });
  const dSpecial  = await prisma.category.create({ data: { name: "Chef's Dinner Special",    mealType: 'DINNER', order: 10 } });
  console.log('30 categories created');

  const items = [
    { name: 'Injera Firfir', description: 'Torn injera sautéed with spiced berbere butter and caramelized onions.', price: 8.50, costPrice: 2.50, categoryId: bFirfir.id, ingredients: 'injera, berbere, butter, onion', image: I.injera },
    { name: 'Teff Fit-Fit', description: 'Crumbled teff injera mixed with fresh ayib cheese and green chili.', price: 9.00, costPrice: 2.80, categoryId: bFirfir.id, ingredients: 'teff injera, ayib, green chili, niter kibbeh', image: I.injera },
    { name: 'Scrambled Eggs with Berbere', description: 'Fluffy eggs scrambled with Ethiopian spiced butter, fresh tomatoes, and onion.', price: 7.50, costPrice: 2.00, categoryId: bEggs.id, ingredients: 'eggs, berbere, tomato, butter, onion', image: I.eggs },
    { name: 'Timatim Firfir Eggs', description: 'Fried eggs served over a rich spiced tomato and roasted pepper sauce.', price: 8.00, costPrice: 2.20, categoryId: bEggs.id, ingredients: 'eggs, tomato, jalapeño, onion, spices', image: I.eggs },
    { name: 'Genfo (Barley Porridge)', description: 'Thick barley porridge served with a well of spiced niter kibbeh and cool yogurt.', price: 7.00, costPrice: 1.80, categoryId: bPorridge.id, ingredients: 'barley flour, niter kibbeh, yogurt, berbere', image: I.porridge },
    { name: 'Atmit (Oat Porridge)', description: 'Smooth oat porridge sweetened with wild honey and a hint of cinnamon.', price: 6.50, costPrice: 1.50, categoryId: bPorridge.id, ingredients: 'oats, honey, cinnamon, milk', image: I.porridge },
    { name: 'Ambasha Bread', description: 'Traditional Ethiopian sweet flatbread baked with cardamom and fenugreek, served warm.', price: 5.00, costPrice: 1.20, categoryId: bPastry.id, ingredients: 'wheat flour, cardamom, fenugreek, sugar', image: I.bread },
    { name: 'Dabo Kolo', description: 'Crunchy bite-sized spiced bread snacks, the perfect companion to morning coffee.', price: 4.50, costPrice: 1.00, categoryId: bPastry.id, ingredients: 'wheat flour, berbere, oil, salt', image: I.bread },
    { name: 'Avocado Juice', description: 'Thick creamy avocado blended with chilled milk and a touch of sugar.', price: 6.00, costPrice: 1.80, categoryId: bJuice.id, ingredients: 'avocado, milk, sugar', image: I.juice },
    { name: 'Layered Fruit Juice', description: 'Stunning layers of mango, papaya, and avocado juice — a signature Addis classic.', price: 7.00, costPrice: 2.00, categoryId: bJuice.id, ingredients: 'mango, papaya, avocado, sugar', image: I.juice },
    { name: 'Ethiopian Coffee Ceremony', description: 'Traditional 3-round coffee ceremony with freshly roasted beans, popcorn, and incense.', price: 12.00, costPrice: 3.00, categoryId: bCoffee.id, ingredients: 'green coffee beans, incense, popcorn', image: I.coffee },
    { name: 'Macchiato', description: 'Ethiopian-style macchiato — strong espresso with a generous pour of steamed milk.', price: 4.00, costPrice: 1.00, categoryId: bCoffee.id, ingredients: 'espresso, steamed milk', image: I.coffee },
    { name: 'Ginger & Honey Tea', description: 'Fresh ginger root brewed with wild honey and a squeeze of lemon.', price: 3.50, costPrice: 0.80, categoryId: bTea.id, ingredients: 'ginger, honey, lemon, water', image: I.tea },
    { name: 'Spiced Chai', description: 'Black tea simmered with cardamom, cinnamon, and cloves, finished with warm milk.', price: 3.50, costPrice: 0.80, categoryId: bTea.id, ingredients: 'black tea, cardamom, cinnamon, cloves, milk', image: I.tea },
    { name: 'Seasonal Fruit Plate', description: 'Freshly sliced mango, papaya, watermelon, and banana — vibrant and refreshing.', price: 8.00, costPrice: 2.50, categoryId: bFruit.id, ingredients: 'mango, papaya, watermelon, banana', image: I.fruit },
    { name: 'Ayib with Wild Honey', description: 'Fresh Ethiopian cottage cheese generously drizzled with raw wild honey.', price: 6.50, costPrice: 1.80, categoryId: bYogurt.id, ingredients: 'ayib, honey', image: I.yogurt },
    { name: 'Full Ethiopian Breakfast', description: 'The complete experience — firfir, scrambled eggs, ayib, ambasha bread, fresh juice, and coffee.', price: 22.00, costPrice: 7.00, categoryId: bSpecial.id, ingredients: 'injera, eggs, ayib, ambasha, juice, coffee', image: I.bfast },
    { name: 'Beyaynetu (Fasting Platter)', description: 'A colorful spread of 7 vegetarian dishes on injera — misir, gomen, tikel gomen, fosolia, atkilt, shiro, and salad.', price: 18.00, costPrice: 5.00, categoryId: lInjera.id, ingredients: 'injera, lentils, collard greens, cabbage, green beans, chickpeas, shiro', image: I.injera },
    { name: 'Meat Combination Platter', description: 'Injera served with doro wot, key wot, and sizzling tibs — the full Ethiopian experience.', price: 24.00, costPrice: 8.00, categoryId: lInjera.id, ingredients: 'injera, chicken, beef, berbere, onion, spices', image: I.platter },
    { name: 'Doro Wot', description: "Ethiopia's national dish — slow-cooked chicken in rich berbere sauce with whole boiled eggs.", price: 16.00, costPrice: 5.00, categoryId: lWot.id, ingredients: 'chicken, berbere, onion, niter kibbeh, boiled egg', image: I.chicken },
    { name: 'Key Wot (Beef Stew)', description: 'Tender beef slow-cooked in spiced berbere and deeply caramelized onion sauce.', price: 15.00, costPrice: 4.50, categoryId: lWot.id, ingredients: 'beef, berbere, onion, niter kibbeh, garlic, ginger', image: I.stew },
    { name: 'Misir Wot', description: 'Red lentils simmered in berbere spice with garlic and onion — the ultimate fasting dish.', price: 10.00, costPrice: 2.50, categoryId: lWot.id, ingredients: 'red lentils, berbere, onion, garlic, oil', image: I.lentils },
    { name: 'Gored Gored', description: 'Cubed raw prime beef marinated in awaze and niter kibbeh — a true Ethiopian delicacy.', price: 20.00, costPrice: 7.00, categoryId: lTibs.id, ingredients: 'raw beef, awaze, niter kibbeh, mitmita', image: I.beef },
    { name: 'Lamb Tibs', description: 'Tender lamb cubes sautéed with rosemary, jalapeño, and tomato in a hot iron skillet.', price: 18.00, costPrice: 6.00, categoryId: lTibs.id, ingredients: 'lamb, rosemary, jalapeño, tomato, onion, butter', image: I.lamb },
    { name: 'Mushroom Tibs', description: 'Sautéed portobello mushrooms with onion, tomato, and Ethiopian spices.', price: 12.00, costPrice: 3.00, categoryId: lTibs.id, ingredients: 'mushroom, onion, tomato, berbere, oil', image: I.veggie },
    { name: 'Shiro Wot', description: 'Silky smooth chickpea flour stew with garlic and Ethiopian spiced niter kibbeh.', price: 10.00, costPrice: 2.50, categoryId: lVeg.id, ingredients: 'shiro powder, garlic, onion, niter kibbeh', image: I.lentils },
    { name: 'Gomen (Collard Greens)', description: 'Sautéed collard greens with garlic, ginger, and onion — simple, healthy, and delicious.', price: 8.00, costPrice: 2.00, categoryId: lVeg.id, ingredients: 'collard greens, garlic, ginger, onion, oil', image: I.veggie },
    { name: 'Timatim Salad', description: 'Fresh tomato, red onion, jalapeño, and lemon dressing — bright and refreshing.', price: 6.00, costPrice: 1.50, categoryId: lSalad.id, ingredients: 'tomato, onion, jalapeño, lemon, oil', image: I.salad },
    { name: 'Garden Salad', description: 'Mixed greens, cucumber, carrot, and cherry tomatoes with house vinaigrette.', price: 8.00, costPrice: 2.00, categoryId: lSalad.id, ingredients: 'lettuce, cucumber, carrot, tomato, vinaigrette', image: I.salad },
    { name: 'Shorba (Spiced Lentil Soup)', description: 'Warming red lentil soup with cumin, turmeric, and a squeeze of fresh lemon.', price: 7.00, costPrice: 1.80, categoryId: lSoup.id, ingredients: 'red lentils, cumin, turmeric, lemon, onion, garlic', image: I.stew },
    { name: 'Spaghetti Bolognese', description: 'Classic pasta with slow-cooked beef ragù, fresh herbs, and aged parmesan.', price: 13.00, costPrice: 3.50, categoryId: lPasta.id, ingredients: 'spaghetti, beef mince, tomato, parmesan, herbs', image: I.pasta },
    { name: 'Club Sandwich', description: 'Triple-decker toasted sandwich with grilled chicken, crispy bacon, lettuce, tomato, and mayo.', price: 11.00, costPrice: 3.00, categoryId: lSandwich.id, ingredients: 'bread, chicken, bacon, lettuce, tomato, mayo', image: I.sandwich },
    { name: 'Fresh Lemonade', description: 'Freshly squeezed lemon juice with mint leaves and a touch of sugar over ice.', price: 4.50, costPrice: 1.00, categoryId: lDrinks.id, ingredients: 'lemon, mint, sugar, water', image: I.lemonade },
    { name: "Chef's Lunch of the Day", description: "Ask your waiter for today's special — crafted daily with the freshest seasonal ingredients.", price: 20.00, costPrice: 6.00, categoryId: lSpecial.id, ingredients: 'seasonal ingredients', image: I.platter },
    { name: 'Kitfo (Ethiopian Steak Tartare)', description: 'Minced prime beef seasoned with mitmita and niter kibbeh, served raw or lightly cooked with ayib and gomen.', price: 22.00, costPrice: 8.00, categoryId: dMeat.id, ingredients: 'beef mince, mitmita, niter kibbeh, ayib, gomen', image: I.beef },
    { name: 'Whole Roasted Lamb', description: 'Slow-roasted whole lamb with Ethiopian spice rub, served ceremonially with injera and sides.', price: 45.00, costPrice: 18.00, categoryId: dMeat.id, ingredients: 'lamb, berbere, rosemary, garlic, niter kibbeh', image: I.lamb },
    { name: 'Beef Tibs Special', description: 'Premium beef cubes sautéed with jalapeño, rosemary, and awaze, served sizzling in a clay pot.', price: 24.00, costPrice: 8.00, categoryId: dMeat.id, ingredients: 'beef, jalapeño, rosemary, awaze, onion, butter', image: I.beef },
    { name: 'Grilled Nile Perch', description: 'Fresh Nile perch fillet grilled to perfection with lemon butter, garlic, and fresh herbs.', price: 26.00, costPrice: 9.00, categoryId: dSeafood.id, ingredients: 'Nile perch, lemon, butter, herbs, garlic', image: I.fish },
    { name: 'Shrimp Tibs', description: 'Sautéed tiger shrimp with Ethiopian spices, fresh tomato, and caramelized onion.', price: 28.00, costPrice: 10.00, categoryId: dSeafood.id, ingredients: 'shrimp, berbere, tomato, onion, butter', image: I.fish },
    { name: 'Mixed Grill Platter', description: 'A feast of lamb chops, beef tibs, grilled chicken, and merguez sausage with roasted vegetables.', price: 38.00, costPrice: 14.00, categoryId: dGrill.id, ingredients: 'lamb, beef, chicken, merguez, onion, peppers', image: I.grill },
    { name: 'Chicken Shish Tawook', description: 'Marinated chicken skewers grilled over charcoal, served with garlic sauce and warm bread.', price: 18.00, costPrice: 6.00, categoryId: dGrill.id, ingredients: 'chicken, garlic, lemon, yogurt, spices', image: I.chicken },
    { name: 'Atkilt Wot (Vegetable Stew)', description: 'Potatoes, carrots, and cabbage slow-cooked in a mild turmeric and onion sauce.', price: 11.00, costPrice: 3.00, categoryId: dVeg.id, ingredients: 'potato, carrot, cabbage, turmeric, onion', image: I.veggie },
    { name: 'Fosolia (Green Bean Stew)', description: 'Tender green beans and carrots sautéed with garlic and Ethiopian spices.', price: 10.00, costPrice: 2.80, categoryId: dVeg.id, ingredients: 'green beans, carrot, garlic, onion, oil', image: I.veggie },
    { name: 'Sambusa (3 pcs)', description: 'Golden crispy pastry parcels filled with spiced lentils or minced beef and jalapeño.', price: 8.00, costPrice: 2.00, categoryId: dApp.id, ingredients: 'pastry, lentils or beef, jalapeño, onion, spices', image: I.samosa },
    { name: 'Hummus with Warm Pita', description: 'Silky chickpea hummus with extra virgin olive oil, paprika, and freshly baked pita bread.', price: 9.00, costPrice: 2.50, categoryId: dApp.id, ingredients: 'chickpeas, tahini, lemon, garlic, olive oil, pita', image: I.hummus },
    { name: 'Baklava', description: 'Delicate layers of filo pastry filled with crushed pistachios and soaked in fragrant honey syrup.', price: 8.00, costPrice: 2.50, categoryId: dDessert.id, ingredients: 'filo pastry, pistachio, honey, butter', image: I.dessert },
    { name: 'Mango Sorbet', description: 'Refreshing homemade mango sorbet with fresh mint — the perfect light ending.', price: 7.00, costPrice: 2.00, categoryId: dDessert.id, ingredients: 'mango, sugar, lemon, mint', image: I.sorbet },
    { name: 'Tej (Ethiopian Honey Wine)', description: 'Traditional Ethiopian honey wine, lightly fermented with gesho — sweet, golden, and unique.', price: 9.00, costPrice: 2.50, categoryId: dWine.id, ingredients: 'honey, water, gesho', image: I.wine },
    { name: 'Rift Valley Red Wine', description: 'Smooth Ethiopian Rift Valley red wine with notes of dark fruit and spice.', price: 12.00, costPrice: 4.00, categoryId: dWine.id, ingredients: 'red wine grapes', image: I.wine },
    { name: 'Passion Fruit Mocktail', description: 'Fresh passion fruit, lime juice, and sparkling soda with a sprig of mint.', price: 7.00, costPrice: 2.00, categoryId: dCocktail.id, ingredients: 'passion fruit, lime, soda, mint, sugar', image: I.mocktail },
    { name: 'Tamarind Cooler', description: 'Tangy tamarind juice balanced with fresh ginger and wild honey over ice.', price: 6.50, costPrice: 1.80, categoryId: dCocktail.id, ingredients: 'tamarind, ginger, honey, water', image: I.mocktail },
    { name: 'Yirgacheffe Espresso', description: 'Single-origin Ethiopian espresso from the legendary Yirgacheffe region — floral, bright, and complex.', price: 5.00, costPrice: 1.20, categoryId: dCoffeeD.id, ingredients: 'Yirgacheffe coffee beans', image: I.espresso },
    { name: "Chef's Dinner Tasting Menu", description: "5-course tasting journey through the best of Ethiopian and international cuisine. Tonight's selection changes with the season.", price: 65.00, costPrice: 22.00, categoryId: dSpecial.id, ingredients: 'seasonal premium ingredients', image: I.platter },
  ];

  for (const item of items) await prisma.menuItem.create({ data: item });
  console.log(`${items.length} menu items created`);
  console.log('Seed complete — ready for client demo');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
