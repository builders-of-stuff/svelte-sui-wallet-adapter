import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Note: PostCSS imports removed as we're using static CSS

async function extractCSS() {
  console.log('🎨 Extracting CSS for component library...');

  try {
    // Create a minimal CSS with the essential styles our components need
    const cssInput = `
      /* Essential utility classes for svelte-sui-wallet-adapter */

      .flex { display: flex; }
      .items-center { align-items: center; }
      .justify-start { justify-content: flex-start; }
      .justify-center { justify-content: center; }
      .gap-4 { gap: 1rem; }
      .gap-2 { gap: 0.5rem; }

      .h-12 { height: 3rem; }
      .w-12 { width: 3rem; }
      .h-9 { height: 2.25rem; }
      .max-w-12 { max-width: 3rem; }
      .max-h-12 { max-height: 3rem; }

      .rounded-lg { border-radius: 0.5rem; }
      .rounded-md { border-radius: 0.375rem; }
      .rounded-t-md { border-top-left-radius: 0.375rem; border-top-right-radius: 0.375rem; }
      .rounded-b-md { border-bottom-left-radius: 0.375rem; border-bottom-right-radius: 0.375rem; }
      .rounded-none { border-radius: 0; }

      .border { border-width: 1px; }
      .border-t-0 { border-top-width: 0; }

      .p-2 { padding: 0.5rem; }
      .px-4 { padding-left: 1rem; padding-right: 1rem; }
      .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }

      .overflow-hidden { overflow: hidden; }
      .flex-col { flex-direction: column; }

      .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
      .font-medium { font-weight: 500; }

      .transition-transform { transition-property: transform; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
      .hover\\:scale-105:hover { --tw-scale-x: 1.05; --tw-scale-y: 1.05; transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y)); }

      /* SVG sizing within containers */
      .\[\\&_svg\]\:w-full svg { width: 100%; }
      .\[\\&_svg\]\:h-full svg { height: 100%; }
      .\[\\&_svg\]\:max-w-12 svg { max-width: 3rem; }
      .\[\\&_svg\]\:max-h-12 svg { max-height: 3rem; }

      /* Color variables - basic fallbacks */
      :root {
        --color-primary: #1f2937;
        --color-primary-foreground: #ffffff;
        --color-secondary: #f3f4f6;
        --color-secondary-foreground: #1f2937;
        --color-muted: #f9fafb;
        --color-muted-foreground: #6b7280;
        --color-accent: #f3f4f6;
        --color-accent-foreground: #1f2937;
        --color-popover: #ffffff;
        --color-popover-foreground: #1f2937;
        --color-border: #e5e7eb;
        --color-background: #ffffff;
        --color-foreground: #1f2937;
      }

      .bg-primary { background-color: var(--color-primary); }
      .text-primary-foreground { color: var(--color-primary-foreground); }
      .bg-secondary { background-color: var(--color-secondary); }
      .text-secondary-foreground { color: var(--color-secondary-foreground); }
      .bg-muted { background-color: var(--color-muted); }
      .text-muted-foreground { color: var(--color-muted-foreground); }
      .bg-accent { background-color: var(--color-accent); }
      .text-accent-foreground { color: var(--color-accent-foreground); }
      .bg-popover { background-color: var(--color-popover); }
      .text-popover-foreground { color: var(--color-popover-foreground); }
      .border-primary { border-color: var(--color-primary); }
      .border-muted { border-color: var(--color-border); }
      .border-border { border-color: var(--color-border); }

      .hover\\:bg-accent:hover { background-color: var(--color-accent); }
      .hover\\:text-accent-foreground:hover { color: var(--color-accent-foreground); }
      .hover\\:bg-primary\\/90:hover { background-color: color-mix(in srgb, var(--color-primary) 90%, transparent); }

      /* Additional component-specific styles */
      .inline-flex { display: inline-flex; }
      .shrink-0 { flex-shrink: 0; }
      .whitespace-nowrap { white-space: nowrap; }
      .outline-none { outline: 2px solid transparent; outline-offset: 2px; }
      .disabled\\:pointer-events-none:disabled { pointer-events: none; }
      .disabled\\:opacity-50:disabled { opacity: 0.5; }
    `;

    // Since we're using static CSS, no need for PostCSS processing
    const result = { css: cssInput };

    // Ensure dist directory exists
    mkdirSync('dist', { recursive: true });

    // Write the extracted CSS
    writeFileSync('dist/styles.css', result.css);

    console.log('✅ CSS extracted successfully to dist/styles.css');
    console.log(`📦 Generated ${(result.css.length / 1024).toFixed(1)}KB of CSS`);

  } catch (error) {
    console.error('❌ Error extracting CSS:', error);
    process.exit(1);
  }
}

extractCSS();