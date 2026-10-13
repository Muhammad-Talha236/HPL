import { randomUUID } from "node:crypto";

const contexts = new WeakMap();
const redact = value => String(value)
  .replace(/(?:postgres(?:ql)?|https?):\/\/[^\s]+/gi, "[redacted URL]")
  .replace(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+/gi, "[redacted email]")
  .replace(/[A-Za-z0-9_-]{43,}/g, "[redacted credential]")
  .slice(0, 1200);

// Scoped budget: the measured old read prefix alone took 5.47s on the remote
// database. Compact snapshots remove relation fan-out; 10s allows sequential
// writes/commit and bounded contention without changing global Prisma defaults.
export const INVITATION_TRANSACTION_OPTIONS = Object.freeze({ maxWait: 2000, timeout: 10000 });

export async function invitationTransaction(db, callback) {
  const started = Date.now();
  const transactionId = randomUUID();
  const context = { transactionId, operation: "transaction.start", elapsedMs: 0, operationElapsedMs: 0 };
  let operationStarted = started;
  const trace = (operation, phase, extra = {}) => {
    if (process.env.NODE_ENV === "development") console.info("Player invitation transaction timing", { transactionId, operation, phase, elapsedMs: Date.now() - started, ...extra });
  };
  let tail = Promise.resolve(), firstError;
  const wrap = (target, prefix = "") => new Proxy(target, {
    get(object, property) {
      const value = Reflect.get(object, property);
      if (typeof value === "function") return (...args) => {
        // Serialize commands even if a future caller mistakenly uses Promise.all.
        const result = tail.then(async () => {
          if (firstError) throw firstError;
          context.operation = `${prefix}${String(property)}`;
          if (!prefix && property === "$queryRaw" && Array.isArray(args[0])) {
            const sql = args[0].join("?");
            if (sql.includes("pg_advisory_xact_lock")) context.operation = "lock.recipient";
            else if (sql.includes('FROM "Team"')) context.operation = "lock.team";
            else if (sql.includes('FROM "User"')) context.operation = "lock.user";
            else if (sql.includes('FROM "Player"')) context.operation = "lock.player";
          }
          operationStarted = Date.now();
          trace(context.operation, "start");
          try {
            const response = await value.apply(object, args);
            trace(context.operation, "complete", { durationMs: Date.now() - operationStarted });
            return response;
          } catch (error) {
            firstError = error;
            trace(context.operation, "failed", { durationMs: Date.now() - operationStarted, code: error.code || "UNKNOWN" });
            throw error;
          }
        });
        tail = result.catch(() => {});
        return result;
      };
      if (!prefix && value && typeof value === "object") return wrap(value, `${String(property)}.`);
      return value;
    },
  });
  trace("transaction.start", "requested");
  try {
    const result = await db.$transaction(async tx => {
      trace("transaction.start", "acquired");
      let value;
      try { value = await callback(wrap(tx)); } finally { await tail; }
      if (firstError) throw firstError;
      context.operation = "transaction.commit";
      operationStarted = Date.now();
      trace(context.operation, "start");
      return value;
    }, INVITATION_TRANSACTION_OPTIONS);
    trace("transaction.commit", "complete", { durationMs: Date.now() - operationStarted });
    return result;
  } catch (error) {
    context.elapsedMs = Date.now() - started;
    context.operationElapsedMs = Date.now() - operationStarted;
    if (error && typeof error === "object") contexts.set(error, { ...context });
    trace(context.operation, "rolled-back", { code: error.code || "UNKNOWN" });
    throw error;
  }
}

export function logInvitationError(label, error) {
  const details = { code: error.code || "UNKNOWN", ...contexts.get(error) };
  if (process.env.NODE_ENV === "development" && error.code === "P2028") {
    // Prisma's invocation prefix can contain source snippets. Keep only its
    // transaction explanation and an explicit metadata allowlist.
    const message = String(error.message || "");
    const explanation = message.match(/Transaction API error:[\s\S]*/)?.[0];
    details.message = explanation ? redact(explanation) : "Prisma transaction failed (P2028)";
    details.meta = {};
    if (typeof error.meta?.error === "string") details.meta.error = redact(error.meta.error);
  }
  console.error(label, details);
}

