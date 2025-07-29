import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: process.env.NODE_ENV === 'production' ? 'server' : 'static',
  adapter: process.env.NODE_ENV === 'production' ? netlify() : undefined
});
