import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { categories } from './schema/categories';

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log('Seeding default categories...');

  const parentCategories = [
    { name: 'Ingresos', isDefault: true },
    { name: 'Vivienda', isDefault: true },
    { name: 'Alimentación', isDefault: true },
    { name: 'Transporte', isDefault: true },
    { name: 'Salud', isDefault: true },
    { name: 'Educación', isDefault: true },
    { name: 'Entretenimiento', isDefault: true },
    { name: 'Financiero', isDefault: true },
    { name: 'Personal', isDefault: true },
    { name: 'Ahorro', isDefault: true },
  ];

  const subcategories: Record<string, string[]> = {
    Ingresos: ['Salario', 'Freelance', 'Inversiones', 'Arriendo', 'Otros'],
    Vivienda: ['Arriendo/Hipoteca', 'Servicios Públicos', 'Internet', 'Mantenimiento'],
    Alimentación: ['Mercado', 'Restaurantes', 'Domicilios'],
    Transporte: ['Gasolina', 'Transporte Público', 'Uber/DiDi', 'Peajes'],
    Salud: ['EPS', 'Medicina', 'Gym'],
    Educación: ['Matrícula', 'Cursos', 'Libros'],
    Entretenimiento: ['Streaming', 'Salidas', 'Hobbies'],
    Financiero: ['Cuotas Crédito', 'Seguros', 'Comisiones Bancarias'],
    Personal: ['Ropa', 'Tecnología', 'Regalos'],
    Ahorro: ['Ahorro General', 'Inversión'],
  };

  for (const parent of parentCategories) {
    const [inserted] = await db
      .insert(categories)
      .values({ name: parent.name, isDefault: true })
      .returning({ id: categories.id });

    const children = subcategories[parent.name];
    if (children && inserted) {
      for (const childName of children) {
        await db
          .insert(categories)
          .values({ name: childName, parentId: inserted.id, isDefault: true });
      }
    }

    console.log(`  ✓ ${parent.name} (${children?.length ?? 0} subcategories)`);
  }

  console.log('Seed complete!');
  await sql.end();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
