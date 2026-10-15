import { randomUUID } from "node:crypto";

// Trace operation names and durations only: never SQL, roster/contact data,
// receipt URLs, credentials or Prisma argument dumps.
export async function workflowTransaction(db, callback, options) {
  const enabled = process.env.NODE_ENV === "development", id = enabled ? randomUUID() : null, started = performance.now();
  const log = (operation, start, code) => { if (enabled) console.debug("Competition workflow timing", { trace_id: id, operation, elapsed_ms: Math.round(performance.now() - start), ...(code ? { code } : {}) }); };
  const wrap = (target, prefix) => new Proxy(target, { get(object, key) {
    const value = Reflect.get(object, key);
    if (typeof key !== "string") return value;
    if (typeof value === "function") return async (...args) => {
      const at = performance.now(); let label = `${prefix}${key}`;
      if (key === "$queryRaw") {
        const statement = Array.isArray(args[0]) ? args[0].join("?") : "";
        if (statement.includes("pg_advisory_xact_lock")) label = "advisory lock";
        else if (statement.includes("FOR UPDATE OF c")) label = "competition lock";
        else if (statement.includes("FOR UPDATE")) label = "registration lock";
        else if (statement.includes("FOR SHARE")) label = "receiving account lock";
        else if (statement.includes("HAVING")) label = "finalization roster checks";
      }
      try { const result = await value.apply(object, args); log(label, at); return result; }
      catch (error) { log(label, at, error.code || "FAILED"); throw error; }
    };
    if (value && typeof value === "object" && !key.startsWith("$")) return wrap(value, `${key}.`);
    return value;
  } });
  log("transaction requested", started);
  try {
    const result = await db.$transaction(async tx => {
      log("transaction entered", started);
      // Bound lock contention independently of the overall operation deadline.
      // A busy competition returns a retryable conflict rather than waiting for
      // the interactive transaction to expire.
      const lockSetup = performance.now();
      await tx.$executeRaw`SET LOCAL lock_timeout = '2000ms'`;
      log("lock timeout configured", lockSetup);
      return callback(enabled ? wrap(tx, "") : tx);
    }, options);
    log("commit", started); return result;
  } catch (error) { log("rollback", started, error.code || "FAILED"); throw error; }
}
