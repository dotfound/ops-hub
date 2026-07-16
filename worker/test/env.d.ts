// Types the `env` exported by `cloudflare:test` (declared as `Cloudflare.Env`)
// with this Worker's bindings via declaration merging.
import type { Env as WorkerEnv } from "../src/index";

declare global {
  namespace Cloudflare {
    interface Env extends WorkerEnv {}
  }
}
