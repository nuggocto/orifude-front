import assert from "node:assert/strict";

import { onRequest, redirectWWW } from "../functions/_middleware.ts";

const redirected = redirectWWW(new Request("https://www.orifude.com/install.sh?source=website"));
assert.equal(redirected?.status, 301);
assert.equal(redirected?.headers.get("Location"), "https://orifude.com/install.sh?source=website");

assert.equal(redirectWWW(new Request("https://orifude.com/")), null);

let nextCalled = false;
const passedThrough = await onRequest({
  request: new Request("https://orifude.com/"),
  async next() {
    nextCalled = true;
    return new Response("page");
  },
});
assert.equal(nextCalled, true);
assert.equal(await passedThrough.text(), "page");

console.log("host redirect validation passed");
