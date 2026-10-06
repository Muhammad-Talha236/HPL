import prisma from "../../database/prisma.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";

const MAX_LIMIT = 50;
const MAX_PAGE = 10000;
const SENSITIVE_KEY = /password|token|secret|authorization|cookie|database[_-]?url|api[_-]?key|credential|phone|email|address/i;
const safeActor = { user_id: true, name: true, email: true };

const positive = (value) => { const number = Number(value); return Number.isInteger(number) && number > 0 ? number : null; };
const dateBoundary = (value, end = false) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T${end ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
};

// Audit records are evidence: sanitize at the projection boundary, never
// mutate their historical JSON in the database.
export const sanitizeAuditDetails = (value, depth = 0) => {
  if (depth > 8) return "[TRUNCATED]";
  if (value === null || value === undefined || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return value.length > 1000 ? `${value.slice(0, 1000)}…` : value;
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitizeAuditDetails(item, depth + 1));
  if (typeof value === "object") return Object.fromEntries(Object.entries(value).slice(0, 100).map(([key, item]) => [key, SENSITIVE_KEY.test(key) ? "[REDACTED]" : sanitizeAuditDetails(item, depth + 1)]));
  return "[UNSUPPORTED]";
};

const previewDetails = (details) => {
  if (details === null || details === undefined) return null;
  const output = JSON.stringify(sanitizeAuditDetails(details));
  return output.length > 240 ? `${output.slice(0, 240)}…` : output;
};

const listSelect = { audit_id: true, action: true, entity_type: true, entity_id: true, details: true, created_at: true, actor: { select: safeActor } };
const mapListItem = ({ details, ...audit }) => ({ ...audit, details_preview: previewDetails(details) });

export const getAdminAuditLogs = async (req, res, next) => {
  try {
    const { page = "1", limit = "20", q, action, actor_id, entity_type, date_from, date_to } = req.query;
    const pageNumber = positive(page); const limitNumber = positive(limit);
    if (!pageNumber || pageNumber > MAX_PAGE) return res.status(400).json({ success: false, message: `Page must be between 1 and ${MAX_PAGE}` });
    if (!limitNumber || limitNumber > MAX_LIMIT) return res.status(400).json({ success: false, message: `Limit must be between 1 and ${MAX_LIMIT}` });
    if (q !== undefined && (typeof q !== "string" || q.trim().length > 100)) return res.status(400).json({ success: false, message: "Search must be a string of up to 100 characters" });
    if (action !== undefined && (typeof action !== "string" || !Object.values(AUDIT_ACTIONS).includes(action))) return res.status(400).json({ success: false, message: "Invalid audit action" });
    if (entity_type !== undefined && (typeof entity_type !== "string" || !/^[A-Z_]{2,50}$/.test(entity_type))) return res.status(400).json({ success: false, message: "Invalid entity type" });
    const where = { ...(action ? { action } : {}), ...(entity_type ? { entity_type } : {}) };
    if (actor_id !== undefined) { const actorId = positive(actor_id); if (!actorId) return res.status(400).json({ success: false, message: "actor_id must be a positive integer" }); where.actor_user_id = actorId; }
    const from = date_from === undefined ? null : dateBoundary(date_from); const to = date_to === undefined ? null : dateBoundary(date_to, true);
    if ((date_from !== undefined && !from) || (date_to !== undefined && !to) || (from && to && from > to)) return res.status(400).json({ success: false, message: "Invalid date range" });
    if (from || to) where.created_at = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
    if (q?.trim()) { const search = q.trim(); where.OR = [{ action: { contains: search, mode: "insensitive" } }, { entity_type: { contains: search, mode: "insensitive" } }, { actor: { is: { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } } }, ...( /^\d+$/.test(search) ? [{ entity_id: Number(search) }] : [])]; }
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ where, select: listSelect, orderBy: [{ created_at: "desc" }, { audit_id: "desc" }], skip: (pageNumber - 1) * limitNumber, take: limitNumber }),
      prisma.auditLog.count({ where }),
    ]);
    return res.json({ success: true, data: logs.map(mapListItem), pagination: { page: pageNumber, limit: limitNumber, total, total_pages: Math.max(1, Math.ceil(total / limitNumber)) } });
  } catch (error) { next(error); }
};

export const getAdminAuditLogById = async (req, res, next) => {
  try {
    const auditId = positive(req.params.audit_id);
    if (!auditId) return res.status(400).json({ success: false, message: "Audit ID must be a positive integer" });
    const log = await prisma.auditLog.findUnique({ where: { audit_id: auditId }, select: listSelect });
    if (!log) return res.status(404).json({ success: false, message: "Audit log not found" });
    const { details, ...data } = log;
    return res.json({ success: true, data: { ...data, details: sanitizeAuditDetails(details) } });
  } catch (error) { next(error); }
};

export const getAuditLogFilterOptions = async (req, res, next) => {
  try {
    const [actions, targets] = await Promise.all([
      prisma.auditLog.findMany({ select: { action: true }, distinct: ["action"], orderBy: { action: "asc" }, take: 100 }),
      prisma.auditLog.findMany({ select: { entity_type: true }, distinct: ["entity_type"], orderBy: { entity_type: "asc" }, take: 100 }),
    ]);
    return res.json({ success: true, data: { actions: actions.map((row) => row.action), entity_types: targets.map((row) => row.entity_type) } });
  } catch (error) { next(error); }
};
