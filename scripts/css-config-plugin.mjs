/**
 * Vite plugin that injects site configuration as CSS custom properties.
 * 
 * This allows src/config.ts values to be used directly in CSS files via CSS variables.
 * For example: url(var(--texture-gallery)) in fancy.css
 * 
 * Plugin runs at build time and transforms src/styles/config.css,
 * replacing placeholder values with actual config from src/config.ts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function cssConfigPlugin() {
  return {
    name: 'css-config-plugin',
    resolveId(id) {
      if (id === 'virtual-css-config') {
        return id;
      }
    },
    async load(id) {
      if (id === 'virtual-css-config') {
        // Dynamically import config
        const configPath = path.resolve(__dirname, '../src/config.ts');
        const configModule = await import(configPath);
        const config = configModule.default;

        // Generate CSS custom properties
        return `
:root {
  --site-domain: "${config.SITE_DOMAIN}";
  --site-base: "${config.SITE_BASE}";
  --asset-base: "${config.ASSET_BASE}";
  --texture-gallery: "${config.TEXTURE_GALLERY}";
  --texture-illusion: "${config.TEXTURE_ILLUSION}";
}
`;
      }
    },
  };
}

export default cssConfigPlugin;
