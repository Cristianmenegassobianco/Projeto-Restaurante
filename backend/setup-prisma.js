import fs from 'fs';

const schemaPath = 'prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

// Se o DATABASE_URL começar com postgres ou postgresql, mudamos o provider.
const dbUrl = process.env.DATABASE_URL || '';

if (dbUrl.startsWith('postgres')) {
  schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, schema);
  console.log('🔄 setup-prisma: Changed provider to postgresql for production.');
} else {
  // Garantir que seja sqlite localmente
  schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  fs.writeFileSync(schemaPath, schema);
  console.log('🔄 setup-prisma: Kept provider as sqlite for local development.');
}
