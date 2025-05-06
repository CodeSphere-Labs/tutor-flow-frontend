import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://localhost:3000/docs-json',
  output: 'src/shared/api/types',
  plugins: ['@hey-api/typescript']
});
