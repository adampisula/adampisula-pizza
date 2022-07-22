import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePluginFonts } from 'vite-plugin-fonts';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VitePluginFonts({
      google: {
        families: ['VT323', 'IBM Plex Mono'],
      },
    }),
    svelte(),
  ]
})
