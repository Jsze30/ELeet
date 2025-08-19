import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';


export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  outDir: "dist",
  vite: () => ({
    plugins: [react()],  
    resolve: {
      alias: {
        '@': './*'
      }
    }
  }),
  webExt: {
    startUrls: ["https://leetcode.com/problems/two-sum/description/"],  
  },
  manifest: {
    name: 'Parrot',
    description: 'Turn any LeetCode question into a mock technical interview',
    version: '0.2.0',
    host_permissions: [
      'https://leetcode.com/problems/*'
    ],
    action: {
      default_icon: {
        '48': '/icons/parrot_logo.png',
        '128': '/icons/parrot_logo.png',
        '256': '/icons/parrot_logo.png'
      }
    },
    icons: {
      '48': '/icons/parrot_logo.png',
      '128': '/icons/parrot_logo.png',
      '256' : '/icons/parrot_logo.png'
    },
    web_accessible_resources: [
      {
        "matches": ["https://leetcode.com/*"],
        "resources": ["icons/parrot_logo.png", "icons/parrot_logo_back.png"]
      }
    ],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self';"
    }
  },
});
