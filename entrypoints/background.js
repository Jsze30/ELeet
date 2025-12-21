import { defineBackground } from "#imports";
import { createClerkClient } from "@clerk/chrome-extension/background";


export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    (async () => {
      try {
        if (msg?.type === "CLERK_GET_AUTH") {
          // IMPORTANT: createClerkClient is async.
          // Creating it inside the handler ensures it initializes and refreshes
          // using the latest synced session (if any).


          // Note: createClerkClient automatically syncs auth state from Clerk
          // It does NOT call the API directly from the extension background
          // instead, it reads extension storage / cookies to get the current session
          const clerk = await createClerkClient({
            publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
            syncHost: import.meta.env.VITE_CLERK_SYNC_HOST, // clerk.eleetcoder.com
          });

          const userId = clerk.user?.id ?? null;
          const sessionId = clerk.session?.id ?? null;
          const token = (await clerk.session?.getToken()) ?? null;
		      const imageUrl = clerk.user?.imageUrl ?? null;

          sendResponse({ ok: true, userId, sessionId, token, imageUrl });
          return;
        }

        if (msg?.type === "OPEN_TAB" && typeof msg?.url === "string") {
          await chrome.tabs.create({ url: msg.url });
          sendResponse({ ok: true });
          return;
        }

        sendResponse({ ok: false, error: "unknown_message" });
      } catch (e) {
        sendResponse({ ok: false, error: e?.message ?? String(e) });
      }
    })();

    return true; // async response
  });
});
