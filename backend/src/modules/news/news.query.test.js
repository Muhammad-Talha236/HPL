import test from "node:test";
import assert from "node:assert/strict";

import { MAX_NEWS_PAGE_SIZE, parsePublicNewsQuery } from "./news.query.js";

test("public news query defaults to a bounded first page", () => {
  assert.deepEqual(parsePublicNewsQuery({}), { page: 1, limit: 12, search: "", category: "" });
});

test("public news query rejects unbounded or malformed pagination", () => {
  assert.match(parsePublicNewsQuery({ limit: String(MAX_NEWS_PAGE_SIZE + 1) }).error, /Limit/);
  assert.match(parsePublicNewsQuery({ page: "0" }).error, /Page/);
  assert.match(parsePublicNewsQuery({ q: "x" }).error, /Search/);
});
