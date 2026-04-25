// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const owner = process.env.GITHUB_REPOSITORY_OWNER;
const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === 'true' && Boolean(repository);

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: owner ? `https://${owner}.github.io` : undefined,
  base: isGitHubPagesBuild && repository ? `/${repository}` : '/',

  vite: {
    plugins: [tailwindcss()]
  }
});
