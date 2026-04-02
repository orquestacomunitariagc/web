import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  seed: 'npx ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts'
});
