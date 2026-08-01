// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders, passthroughImageService } from 'astro/config';

// Opens every link in blog post content in a new browser tab.
function rehypeLinksNewTab() {
	return (tree) => {
		function visit(node) {
			if (node.type === 'element' && node.tagName === 'a' && node.properties?.href) {
				node.properties.target = '_blank';
				node.properties.rel = ['noopener', 'noreferrer'];
			}
			for (const child of node.children ?? []) {
				visit(child);
			}
		}
		visit(tree);
	};
}

// https://astro.build/config
export default defineConfig({
	site: 'https://www.victorgomezdejuan.com',
	image: {
		// Cloudflare Pages does not provide Astro's /_image endpoint.
		service: passthroughImageService(),
	},
	markdown: {
		rehypePlugins: [rehypeLinksNewTab],
	},
	integrations: [mdx(), sitemap()],
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
