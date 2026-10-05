import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useNotifications from "../../../hooks/useNotifications";
import { deleteNotification, getNotifications, markAllNotificationsRead, markNotificationRead } from "../services/notificationService";

const filters = ["ALL", "UNREAD", "READ"];
const filterLabel = (filter) => ({ ALL: "All", UNREAD: "Unread", READ: "Read" }[filter]);
const messageFor = (filter) => filter === "UNREAD" ? ["You're all caught up.", "There are no unread notifications."] : filter === "READ" ? ["No read notifications yet.", "Notifications you have read will appear here."] : ["You don't have any notifications yet.", "Updates related to your HPL account will appear here."];
const apiMessage = (error, fallback) => error.response?.data?.message || fallback;
const formatTime = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Recently";

export default function NotificationCenterPage() {
  const { synchronizeUnreadCount } = useNotifications();
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ status: "loading", data: [], pagination: {}, unreadCount: 0 });
  const [notice, setNotice] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: "loading" }));
    try {
      const response = await getNotifications({ page, limit: 10, status: filter });
      const payload = response.data || {};
      const unreadCount = payload.unread_count || 0;
      synchronizeUnreadCount(unreadCount);
      setState({ status: "success", data: payload.data || [], pagination: payload.pagination || {}, unreadCount });
    } catch (error) {
      setState({ status: "error", data: [], pagination: {}, unreadCount: 0, message: apiMessage(error, "Notifications could not be loaded.") });
    }
  }, [filter, page, synchronizeUnreadCount]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const chooseFilter = (value) => {
    if (value === filter) return;
    setFilter(value);
    setPage(1);
    setNotice("");
  };

  const markRead = async (notificationId) => {
    if (pendingId) return;
    setPendingId(notificationId); setNotice("");
    try { await markNotificationRead(notificationId); await load(); }
    catch (error) { setNotice(apiMessage(error, "Notification could not be marked as read.")); }
    finally { setPendingId(null); }
  };

  const markAll = async () => {
    if (!state.unreadCount || markingAll) return;
    setMarkingAll(true); setNotice("");
    try { await markAllNotificationsRead(); await load(); }
    catch (error) { setNotice(apiMessage(error, "Notifications could not be marked as read.")); }
    finally { setMarkingAll(false); }
  };

  const confirmDelete = async () => {
    if (!deleting || pendingId) return;
    setPendingId(deleting.notification_id); setNotice("");
    try {
      await deleteNotification(deleting.notification_id);
      setDeleting(null);
      if (state.data.length === 1 && page > 1) setPage((current) => current - 1);
      else await load();
    } catch (error) { setNotice(apiMessage(error, "Notification could not be deleted.")); }
    finally { setPendingId(null); }
  };

  return <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-28 text-slate-900 sm:px-6"><div className="mx-auto max-w-5xl"><nav aria-label="Breadcrumb" className="text-sm font-semibold text-slate-500"><Link to="/account" className="hover:text-[#b83729] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50">Account</Link><span aria-hidden="true"> / </span><span>Notifications</span></nav><header className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Notifications</h1><p className="mt-2 text-sm text-slate-600">Updates related to your HPL account.</p></div><button type="button" disabled={!state.unreadCount || markingAll} onClick={markAll} className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-xs font-extrabold tracking-wide text-slate-700 shadow-sm hover:border-[#FF553D] hover:text-[#b83729] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50 disabled:cursor-not-allowed disabled:opacity-45">{markingAll ? "MARKING..." : "MARK ALL AS READ"}</button></header><div role="tablist" aria-label="Notification filters" className="mt-7 inline-flex max-w-full flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">{filters.map((value) => <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => chooseFilter(value)} className={`rounded-md px-4 py-2 text-xs font-extrabold tracking-wide focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50 ${filter === value ? "bg-[#FF553D] text-white" : "text-slate-600 hover:bg-slate-100"}`}>{filterLabel(value)}</button>)}</div>{notice && <p role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{notice}</p>}{state.status === "loading" && <div role="status" aria-label="Loading notifications" className="mt-6 space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />)}</div>}{state.status === "error" && <section role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><p>{state.message}</p><button type="button" onClick={load} className="mt-3 rounded border border-red-300 px-4 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-400">TRY AGAIN</button></section>}{state.status === "success" && <><section className="mt-6 space-y-3">{state.data.map((notification) => <NotificationCard key={notification.notification_id} notification={notification} busy={pendingId === notification.notification_id} onMarkRead={markRead} onDelete={setDeleting} />)}</section>{!state.data.length && <EmptyState filter={filter} />}{state.pagination.total_pages > 1 && <Pagination page={page} pagination={state.pagination} setPage={setPage} />}</>}{deleting && <DeleteDialog notification={deleting} pending={pendingId === deleting.notification_id} onCancel={() => !pendingId && setDeleting(null)} onConfirm={confirmDelete} />}</div></main>;
}

function NotificationCard({ notification, busy, onMarkRead, onDelete }) { return <article className={`rounded-xl border bg-white p-4 shadow-sm sm:p-5 ${notification.is_read ? "border-slate-200" : "border-[#EEC058]/60 ring-1 ring-[#EEC058]/20"}`}><div className="flex items-start gap-3"><span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#011427] text-lg text-[#EEC058]">🔔</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="text-sm font-extrabold text-slate-900 sm:text-base">{notification.title}</h2><time dateTime={notification.created_at} className="text-xs text-slate-500">{formatTime(notification.created_at)}</time></div><p className="mt-1.5 break-words text-sm leading-6 text-slate-600">{notification.message}</p><div className="mt-4 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide ${notification.is_read ? "bg-slate-100 text-slate-500" : "bg-[#EEC058]/15 text-[#7a5700]"}`}>{notification.is_read ? "READ" : "UNREAD"}</span>{!notification.is_read && <button type="button" disabled={busy} onClick={() => onMarkRead(notification.notification_id)} className="rounded px-2 py-1 text-xs font-bold text-[#b83729] hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50 disabled:opacity-50">{busy ? "MARKING..." : "MARK AS READ"}</button>}<button type="button" disabled={busy} onClick={() => onDelete(notification)} className="rounded px-2 py-1 text-xs font-bold text-slate-500 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-400/50 disabled:opacity-50">DELETE</button></div></div></div></article>; }
function EmptyState({ filter }) { const [title, message] = messageFor(filter); return <section className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center"><span aria-hidden="true" className="text-3xl">🔔</span><h2 className="mt-3 text-lg font-extrabold">{title}</h2><p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">{message}</p></section>; }
function Pagination({ page, pagination, setPage }) { return <nav aria-label="Notification pages" className="mt-6 flex items-center justify-between gap-3"><button type="button" disabled={!pagination.has_previous} onClick={() => setPage((current) => current - 1)} className="rounded border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50 disabled:cursor-not-allowed disabled:opacity-40">PREVIOUS</button><span className="text-xs font-bold text-slate-500">PAGE {pagination.page || page} OF {pagination.total_pages || 1}</span><button type="button" disabled={!pagination.has_next} onClick={() => setPage((current) => current + 1)} className="rounded border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50 disabled:cursor-not-allowed disabled:opacity-40">NEXT</button></nav>; }
function DeleteDialog({ pending, onCancel, onConfirm }) { return <div role="dialog" aria-modal="true" aria-labelledby="delete-notification-title" className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 p-4"><section className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl sm:p-6"><h2 id="delete-notification-title" className="text-lg font-extrabold">Delete notification?</h2><p className="mt-2 text-sm leading-6 text-slate-600">This notification will be removed from your account.</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" disabled={pending} onClick={onCancel} className="rounded border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400">CANCEL</button><button type="button" disabled={pending} onClick={onConfirm} className="rounded bg-[#b83729] px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-60">{pending ? "DELETING..." : "DELETE"}</button></div></section></div>; }
