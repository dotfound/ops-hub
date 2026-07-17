import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.toml" },
      miniflare: {
        bindings: {
          RELAY_HEADER_KEY: "test-key",
          GITHUB_PAT: "fake-pat",
        },
      },
    }),
  ],
});
