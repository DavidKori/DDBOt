import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

function rawPlugin() {
    return {
        name: 'raw-xml',
        transform(code: string, id: string) {
            if (id.endsWith('.xml')) {
                return {
                    code: `export default ${JSON.stringify(fs.readFileSync(id, 'utf-8'))};`,
                    map: null,
                };
            }
        },
    };
}

function inlineSpritePlugin() {
    return {
        name: 'inline-smartcharts-sprite',
        transformIndexHtml: {
            order: 'pre' as const,
            handler(html: string) {
                const spritePath = path.resolve(__dirname, 'public/sprite-dd6387.smartcharts.svg');
                let spriteContent: string;
                try {
                    spriteContent = fs.readFileSync(spritePath, 'utf-8');
                } catch {
                    return html;
                }

                // Make the inlined SVG invisible and non-interactive
                spriteContent = spriteContent.replace(
                    /^<svg /,
                    '<svg id="sc-inline-sprite" aria-hidden="true" focusable="false" style="display:none;position:absolute;width:0;height:0;overflow:hidden" '
                );

                // MutationObserver script: rewrites <use> xlink:href="sprite-dd6387.smartcharts.svg#id"
                // to href="#id" so it resolves against the inlined sprite, not an external file.
                const patchScript = `<script>
(function(){
  var SPRITE_FILE='sprite-dd6387.smartcharts.svg';
  var XNS='http://www.w3.org/1999/xlink';
  function fix(el){
    var h=el.getAttributeNS(XNS,'href')||el.getAttribute('href')||'';
    if(h.indexOf(SPRITE_FILE+'#')!==-1){
      var frag='#'+h.split('#')[1];
      el.removeAttributeNS(XNS,'href');
      el.setAttribute('href',frag);
    }
  }
  function scan(root){
    if(root&&root.querySelectorAll)root.querySelectorAll('use').forEach(fix);
  }
  new MutationObserver(function(ms){
    ms.forEach(function(m){
      m.addedNodes.forEach(function(n){
        if(n.nodeType!==1)return;
        if(n.localName==='use')fix(n);
        scan(n);
      });
    });
  }).observe(document.documentElement,{childList:true,subtree:true});
  scan(document);
})();
</script>`;

                // Inject the sprite + patch script right before <div id="root">
                return html.replace(
                    '<div id="root">',
                    spriteContent + '\n' + patchScript + '\n<div id="root">'
                );
            },
        },
    };
}

function requireShimPlugin() {
    return {
        name: 'require-shim',
        transformIndexHtml: {
            order: 'pre' as const,
            handler() {
                return [
                    {
                        tag: 'script',
                        attrs: { type: 'module' },
                        injectTo: 'head-prepend' as const,
                        children: `
import React from '/node_modules/.vite/deps/react.js';
import ReactDOM from '/node_modules/.vite/deps/react-dom.js';
const __moduleRegistry = { react: React, 'react-dom': ReactDOM };
if (typeof window !== 'undefined' && typeof window.require === 'undefined') {
  window.require = function(id) {
    if (__moduleRegistry[id]) return __moduleRegistry[id];
    throw new Error('require(' + id + ') is not available in browser');
  };
}
`,
                    },
                ];
            },
        },
    };
}

export default defineConfig({
    plugins: [
        requireShimPlugin(),
        react(),
        rawPlugin(),
        inlineSpritePlugin(),
    ],
    resolve: {
        dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
        alias: [
            { find: /^@\/(.+)$/, replacement: path.resolve(__dirname, 'src') + '/$1' },
            { find: '@deriv/quill-icons/Illustration', replacement: path.resolve(__dirname, 'src/utils/illustration-icons-shim.tsx') },
            { find: '@deriv/quill-icons/Illustrative', replacement: path.resolve(__dirname, 'node_modules/@deriv/quill-icons/dist/esm/react/Illustrative/index.js') },
            { find: '@deriv/quill-icons/LabelPaired', replacement: path.resolve(__dirname, 'node_modules/@deriv/quill-icons/dist/esm/react/LabelPaired/index.js') },
            { find: '@deriv/quill-icons/Legacy', replacement: path.resolve(__dirname, 'node_modules/@deriv/quill-icons/dist/esm/react/Legacy/index.js') },
            { find: '@deriv/quill-icons/TradeTypes', replacement: path.resolve(__dirname, 'node_modules/@deriv/quill-icons/dist/esm/react/TradeTypes/index.js') },
            { find: '@deriv/quill-icons/Flags', replacement: path.resolve(__dirname, 'node_modules/@deriv/quill-icons/dist/esm/react/Flags/index.js') },
            { find: '@deriv/quill-icons/Logo', replacement: path.resolve(__dirname, 'node_modules/@deriv/quill-icons/dist/esm/react/Logo/index.js') },
            { find: '@deriv/quill-icons/Currencies', replacement: path.resolve(__dirname, 'node_modules/@deriv/quill-icons/dist/esm/react/Currencies/index.js') },
            { find: '@deriv/quill-icons/Accounts', replacement: path.resolve(__dirname, 'node_modules/@deriv/quill-icons/dist/esm/react/Accounts/index.js') },
            { find: '@deriv/quill-icons/Markets', replacement: path.resolve(__dirname, 'node_modules/@deriv/quill-icons/dist/esm/react/Markets/index.js') },
            { find: '@deriv/quill-icons/PaymentMethods', replacement: path.resolve(__dirname, 'node_modules/@deriv/quill-icons/dist/esm/react/PaymentMethods/index.js') },
            { find: '@deriv/quill-icons/Social', replacement: path.resolve(__dirname, 'node_modules/@deriv/quill-icons/dist/esm/react/Social/index.js') },
            { find: '@deriv/quill-icons/Standalone', replacement: path.resolve(__dirname, 'node_modules/@deriv/quill-icons/dist/esm/react/Standalone/index.js') },
        ],
    },
    define: {
        'process.env.TRANSLATIONS_CDN_URL': JSON.stringify(process.env.TRANSLATIONS_CDN_URL),
        'process.env.R2_PROJECT_NAME': JSON.stringify(process.env.R2_PROJECT_NAME),
        'process.env.CROWDIN_BRANCH_NAME': JSON.stringify(process.env.CROWDIN_BRANCH_NAME),
        'process.env.TRACKJS_TOKEN': JSON.stringify(process.env.TRACKJS_TOKEN),
        'process.env.APP_ENV': JSON.stringify(process.env.APP_ENV),
        'process.env.REF_NAME': JSON.stringify(process.env.REF_NAME),
        'process.env.REMOTE_CONFIG_URL': JSON.stringify(process.env.REMOTE_CONFIG_URL),
        'process.env.GD_CLIENT_ID': JSON.stringify(process.env.GD_CLIENT_ID),
        'process.env.GD_APP_ID': JSON.stringify(process.env.GD_APP_ID),
        'process.env.GD_API_KEY': JSON.stringify(process.env.GD_API_KEY),
        'process.env.DATADOG_SESSION_REPLAY_SAMPLE_RATE': JSON.stringify(process.env.DATADOG_SESSION_REPLAY_SAMPLE_RATE),
        'process.env.DATADOG_SESSION_SAMPLE_RATE': JSON.stringify(process.env.DATADOG_SESSION_SAMPLE_RATE),
        'process.env.DATADOG_APPLICATION_ID': JSON.stringify(process.env.DATADOG_APPLICATION_ID),
        'process.env.DATADOG_CLIENT_TOKEN': JSON.stringify(process.env.DATADOG_CLIENT_TOKEN),
        'process.env.RUDDERSTACK_KEY': JSON.stringify(process.env.RUDDERSTACK_KEY),
        'process.env.GROWTHBOOK_CLIENT_KEY': JSON.stringify(process.env.GROWTHBOOK_CLIENT_KEY),
        'process.env.GROWTHBOOK_DECRYPTION_KEY': JSON.stringify(process.env.GROWTHBOOK_DECRYPTION_KEY),
    },
    css: {
        preprocessorOptions: {
            scss: {
                loadPaths: [path.resolve(__dirname, 'src')],
                silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin', 'color-functions'],
            },
        },
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-dom/client',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
            'mobx',
            'mobx-react-lite',
            'react-router-dom',
            '@deriv-com/quill-ui',
            '@deriv-com/quill-ui-next',
            '@deriv-com/ui',
            '@deriv-com/translations',
            '@deriv-com/analytics',
            '@deriv-com/auth-client',
            'i18next',
            'react-i18next',
        ],
    },
    build: {
        target: 'es2020',
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    'router-vendor': ['react-router-dom'],
                },
            },
        },
    },
    server: {
        port: 5000,
        host: '0.0.0.0',
        allowedHosts: true,
        headers: {
            'Cross-Origin-Opener-Policy': 'unsafe-none',
            'Cross-Origin-Embedder-Policy': 'unsafe-none',
            'Cache-Control': 'no-cache',
        },
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
    publicDir: 'public',
});
