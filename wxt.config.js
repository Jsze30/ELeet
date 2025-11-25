import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

// const clerkHost = `${import.meta.env.CLERK_FRONTEND_API}/*`;

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  outDir: "dist",
  vite: () => ({
    plugins: [react()],  
    resolve: {
      alias: {
        '@': './*'
      }
    },
    define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    }
  }),
  webExt: {
    startUrls: ["https://leetcode.com/problems/two-sum/description/"],  
  },
  manifest: {
    name: 'ELeet',
    description: 'Turn any LeetCode question into a technical interview',
    version: '0.2.0',
    host_permissions: [
      'https://leetcode.com/problems/*',
    ],
    permissions: ['storage', 'cookies'],
    action: {
      default_icon: {
        '48': '/icons/ELeet_logo.png',
        '128': '/icons/ELeet_logo.png',
        '256': '/icons/ELeet_logo.png'
      }
    },
    icons: {
      '48': '/icons/ELeet_logo.png',
      '128': '/icons/ELeet_logo.png',
      '256' : '/icons/ELeet_logo.png'
    },
    web_accessible_resources: [
      {
        "matches": ["https://leetcode.com/*"],
        "resources": ["/icons/ELeet_logo.png", "/icons/ELeet_logo_no_back.png"]
      }
    ],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self';"
    }
  },
});
