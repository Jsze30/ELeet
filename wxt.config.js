import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';
import fs from "fs";
import { config } from 'dotenv';
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
config({ path: envFile });
const clerkHost = `${process.env.VITE_CLERK_FRONTEND_API}/*`;

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
  // used the following command to generate a key for wxt:
  // openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out extension-key.pem

  // this key is used to generate a consistent extension ID across builds
  // see documentation for more details:
  // https://developer.chrome.com/docs/extensions/reference/manifest/key
  // warning: generating a new key will invalidate existing extension installs
  manifest: {
    key: fs.readFileSync("./extension-key.pem", "utf8"),
    name: 'ELeet',
    description: 'Turn any LeetCode question into a technical interview',
    version: '0.4.0',
    // list of websites the extension has permission to access
    host_permissions: [
      'https://leetcode.com/problems/*',
      clerkHost + '/*', // for clerk frontend API
      "http://localhost/*",
      "http://localhost:8080/*",
      "https://accounts.eleetcoder.com/*"
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
