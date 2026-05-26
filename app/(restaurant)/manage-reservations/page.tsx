"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useSSE } from "@/hooks/useSSE";
import dynamic from "next/dynamic";
import GuestProfileModal from "@/components/reservations/GuestProfileModal";
import { useTranslation } from "react-i18next";

const TimelineView = dynamic(() => import("@/components/reservations/TimelineView"), { ssr: false });
const LiveFloorPanel = dynamic(() => import("@/components/reservations/LiveFloorPanel"), { ssr: false });
const KanbanView = dynamic(() => import("@/components/reservations/KanbanView"), { ssr: false });

const POLL_MS = 30_000;

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:   { bg: "#fffbeb", color: "#b45309",  label: "Pending" },
  CONFIRMED: { bg: "#f0fdf4", color: "#16a34a",  label: "Confirmed" },
  SEATED:    { bg: "#f5f3ff", color: "#7c3aed",  label: "Seated" },
  CANCELLED: { bg: "#fef2f2", color: "#dc2626",  label: "Cancelled" },
  COMPLETED: { bg: "#eff6ff", color: "#2563eb",  label: "Completed" },
  NO_SHOW:   { bg: "#f8f8f7", color: "#9a9088",  label: "No-show" },
};

type ReservationItem = {
  id: string;
  date: string;
  startTime: string;
  partySize: number;
  status: string;
  notes?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  user?: { name: string; email: string; phone?: string };
  tableId?: string;
  table?: { label: string };
};

type WaitlistItem = {
  id: string;
  date: string;
  partySize: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  status: string;
  position: number;
  notes?: string;
  createdAt: string;
};

type Tab = "PENDING" | "CONFIRMED" | "ALL" | "PAST" | "WAITLIST";
type ViewMode = "list" | "timeline" | "kanban";

function getOverlappingPending(reservations: ReservationItem[], target: ReservationItem) {
  if (target.status !== "PENDING") return [];
  return reservations.filter(
    (r) =>
      r.id !== target.id &&
      (r.status === "PENDING" || r.status === "CONFIRMED") &&
      r.tableId === target.tableId &&
      r.date === target.date &&
      r.startTime === target.startTime,
  );
}

function ReservationsPageInner() {
  const { t } = useTranslation();
  const { user, _hasHydrated, can } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { success, error: toastError, info } = useToast();

  const tabParam = (searchParams.get("tab") as Tab) || "PENDING";
  const dateParam = searchParams.get("date") || "";
  const viewParam = (searchParams.get("view") as ViewMode) || "list";
  const searchParam = searchParams.get("search") || "";

  const [tab, setTab] = useState<Tab>(tabParam);
  const [dateFilter, setDateFilter] = useState(dateParam);
  const [viewMode, setViewMode] = useState<ViewMode>(viewParam);
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [debouncedSearch, setDebouncedSearch] = useState(searchParam);

  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [newCount, setNewCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showFloorPanel, setShowFloorPanel] = useState(false);
  const [guestProfile, setGuestProfile] = useState<{ email: string; name: string } | null>(null);
  const [tableFilter, setTableFilter] = useState("");
  const [restaurant, setRestaurant] = useState<{ openTime: string; closeTime: string; name: string } | null>(null);

  const [overlapModal, setOverlapModal] = useState<{
    isOpen: boolean;
    target: ReservationItem;
    group: ReservationItem[];
  } | null>(null);

  const prevPendingIds = useRef<Set<string>>(new Set());
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state → URL
  function pushParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function changeTab(t: Tab) {
    setTab(t);
    setSelectedIds(new Set());
    pushParams({ tab: t });
  }

  function changeView(v: ViewMode) {
    setViewMode(v);
    pushParams({ view: v });
  }

  function changeDate(d: string) {
    setDateFilter(d);
    pushParams({ date: d });
  }

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      pushParams({ search: searchQuery });
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchReservations = useCallback(async (isInitial = false) => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (dateFilter) params.set("date", dateFilter);
      if (tableFilter) params.set("tableId", tableFilter);
      const { data } = await api.get<ReservationItem[]>(`/reservations/restaurant?${params}`);
      setReservations(data);
      setLastUpdated(new Date());

      const currentPending = new Set(data.filter((r) => r.status === "PENDING").map((r) => r.id));
      if (!isInitial) {
        const fresh = [...currentPending].filter((id) => !prevPendingIds.current.has(id));
        if (fresh.length > 0) setNewCount((n) => n + fresh.length);
      }
      prevPendingIds.current = currentPending;
    } catch { /* ignore */ }
  }, [debouncedSearch, dateFilter, tableFilter]);

  const fetchWaitlist = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (dateFilter) params.set("date", dateFilter);
      const { data } = await api.get<WaitlistItem[]>(`/waitlist/restaurant?${params}`);
      setWaitlist(data);
    } catch { /* ignore */ }
  }, [dateFilter]);

  // SSE real-time updates
  useSSE({
    new_reservation: (data: unknown) => {
      const d = data as { guestName: string; tableLabel: string; date: string; startTime: string };
      info(`New reservation: ${d.guestName || "Guest"} · Table ${d.tableLabel} · ${d.date} ${d.startTime}`);
      fetchReservations(false);
      fetchWaitlist();
    },
    reservation_updated: (data: unknown) => {
      const d = data as { id: string; status: string };
      setReservations((rs) => rs.map((r) => r.id === d.id ? { ...r, status: d.status } : r));
    },
    reservations_bulk_updated: () => {
      fetchReservations(false);
    },
  });

  // Document title
  useEffect(() => {
    const pending = reservations.filter((r) => r.status === "PENDING").length;
    document.title = pending > 0 ? `(${pending}) Reservations — Mesa` : "Reservations — Mesa";
    return () => { document.title = "Mesa — Restaurant Reservations"; };
  }, [reservations]);

  // Auth guard + initial load
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user || !can("RESERVATIONS_READ")) { router.push("/login"); return; }
    Promise.all([
      fetchReservations(true),
      fetchWaitlist(),
      api.get("/restaurants/me").then(({ data }) => setRestaurant({ openTime: data.openTime, closeTime: data.closeTime, name: data.name })).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user, _hasHydrated]); // eslint-disable-line

  // Polling
  useEffect(() => {
    const schedule = () => {
      pollTimer.current = setTimeout(async () => {
        await Promise.all([fetchReservations(false), fetchWaitlist()]);
        schedule();
      }, POLL_MS);
    };
    schedule();
    return () => { if (pollTimer.current) clearTimeout(pollTimer.current); };
  }, [fetchReservations, fetchWaitlist]);

  // Re-fetch when filters change
  useEffect(() => {
    fetchReservations(false);
  }, [debouncedSearch, dateFilter, tableFilter]); // eslint-disable-line

  async function handleStatus(id: string, status: string) {
    const prev = reservations.find((r) => r.id === id)?.status;
    setActionLoading(id + status);
    // Optimistic update
    setReservations((rs) => rs.map((r) => r.id === id ? { ...r, status } : r));
    try {
      await api.patch(`/reservations/${id}/status`, { status });
      if (status !== "PENDING") prevPendingIds.current.delete(id);
      if (status === "CONFIRMED") success("Reservation confirmed");
      else if (status === "CANCELLED") info("Reservation cancelled");
      else if (status === "SEATED") success("Guest seated");
      else if (status === "COMPLETED") success("Reservation completed");
    } catch {
      // Revert on failure
      if (prev !== undefined) setReservations((rs) => rs.map((r) => r.id === id ? { ...r, status: prev } : r));
      toastError("Failed to update reservation");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBulkStatus(status: string) {
    if (!selectedIds.size) return;
    setBulkLoading(true);
    try {
      const { data } = await api.post("/reservations/bulk-status", { ids: [...selectedIds], status });
      await fetchReservations(false);
      setSelectedIds(new Set());
      success(`${data.updated} reservations updated to ${status.toLowerCase()}`);
    } catch {
      toastError("Bulk update failed");
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleWaitlistNotify(id: string) {
    try {
      await api.patch(`/waitlist/${id}/notify`);
      setWaitlist((w) => w.map((e) => e.id === id ? { ...e, status: "NOTIFIED" } : e));
      success("Guest notified by email");
    } catch {
      toastError("Notification failed");
    }
  }

  async function handleWaitlistCancel(id: string) {
    try {
      await api.patch(`/waitlist/${id}/status`, { status: "CANCELLED" });
      setWaitlist((w) => w.map((e) => e.id === id ? { ...e, status: "CANCELLED" } : e));
    } catch {
      toastError("Failed to update waitlist");
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((r) => r.id)));
    }
  }

  const today = new Date().toISOString().split("T")[0];

  const filtered = reservations.filter((r) => {
    if (tab === "PENDING") return r.status === "PENDING";
    if (tab === "CONFIRMED") return ["CONFIRMED", "SEATED"].includes(r.status) && r.date >= today;
    if (tab === "PAST") return r.date < today || ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(r.status);
    if (tab === "WAITLIST") return false;
    return true;
  });

  const pendingCount = reservations.filter((r) => r.status === "PENDING").length;
  const waitingCount = waitlist.filter((w) => w.status === "WAITING").length;

  const timelineDate = dateFilter || today;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f3ef", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "36px", height: "36px", border: "3px solid #f0ede8", borderTopColor: "#c4410c", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ background: "#f5f3ef", minHeight: "100vh" }}>
      {/* Nav */}
      <nav className="nav">
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1.5rem", height: "64px", display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/dashboard" style={{ textDecoration: "none", color: "#9a9088", fontSize: "0.875rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.35rem" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#18160f")}
            onMouseLeave={e => (e.currentTarget.style.color = "#9a9088")}
          >
            {t("nav.backToDashboard")}
          </Link>
          <div style={{ width: "1px", height: "16px", background: "rgba(24,22,15,0.1)" }} />
          <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em" }}>mesa</span>
          <div style={{ flex: 1 }} />
          {lastUpdated && (
            <span style={{ fontSize: "0.75rem", color: "#9a9088" }}>
              {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => setShowFloorPanel((v) => !v)}
            style={{ padding: "0.375rem 0.625rem", fontSize: "0.8125rem", border: "1px solid rgba(24,22,15,0.1)", borderRadius: "6px", cursor: "pointer", background: showFloorPanel ? "#fef2ec" : "#f5f3ef", color: showFloorPanel ? "#c4410c" : "#5c5248", fontFamily: "inherit" }}
          >
            {showFloorPanel ? t("nav.hideFloor") : t("nav.liveFloor")}
          </button>
          <button
            onClick={() => { setNewCount(0); fetchReservations(false); }}
            style={{ padding: "0.375rem 0.625rem", fontSize: "0.8125rem", border: "1px solid rgba(24,22,15,0.1)", borderRadius: "6px", cursor: "pointer", background: "#f5f3ef", color: "#5c5248", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.375rem" }}
          >
            ↻
            {newCount > 0 && (
              <span style={{ fontSize: "0.625rem", fontWeight: 700, background: "#c4410c", color: "#fff", padding: "0.05rem 0.35rem", borderRadius: "999px" }}>
                +{newCount}
              </span>
            )}
          </button>
          <Link href="/new-booking" style={{ textDecoration: "none" }}>
            <button style={{ padding: "0.375rem 0.875rem", fontSize: "0.8125rem", fontWeight: 600, border: "none", borderRadius: "6px", cursor: "pointer", background: "#c4410c", color: "#fff", fontFamily: "inherit" }}>
              {t("nav.newBooking")}
            </button>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem", display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Header + controls */}
          <div className="anim-1" style={{ opacity: 0, marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.875rem" }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#18160f", letterSpacing: "-0.02em", margin: 0 }}>{t("manageReservations.title")}</h1>
              <div style={{ display: "flex", gap: "0.375rem" }}>
                {(["list", "kanban", "timeline"] as ViewMode[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => changeView(v)}
                    style={{ padding: "0.35rem 0.625rem", fontSize: "0.8125rem", border: "1px solid", borderRadius: "6px", cursor: "pointer", background: viewMode === v ? "#18160f" : "#fff", borderColor: viewMode === v ? "#18160f" : "rgba(24,22,15,0.12)", color: viewMode === v ? "#fff" : "#5c5248", fontFamily: "inherit", textTransform: "capitalize" }}
                  >
                    {t(`manageReservations.views.${v}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters row */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="search"
                placeholder={t("manageReservations.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{ width: "240px", flex: "none" }}
              />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => changeDate(e.target.value)}
                className="input"
                style={{ width: "160px", flex: "none", colorScheme: "light" }}
              />
              {dateFilter && (
                <button
                  onClick={() => changeDate("")}
                  style={{ fontSize: "0.8125rem", color: "#9a9088", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                >
                  {t("manageReservations.clearDate")}
                </button>
              )}

              {/* Tabs */}
              <div style={{ marginLeft: "auto", display: "flex", gap: "0.25rem" }}>
                {(["PENDING", "CONFIRMED", "ALL", "PAST", "WAITLIST"] as Tab[]).map((tabKey) => (
                  <button
                    key={tabKey}
                    onClick={() => changeTab(tabKey)}
                    style={{
                      padding: "0.35rem 0.75rem",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      fontFamily: "inherit",
                      border: "1px solid",
                      borderRadius: "6px",
                      cursor: "pointer",
                      background: tab === tabKey ? "#c4410c" : "#fff",
                      borderColor: tab === tabKey ? "#c4410c" : "rgba(24,22,15,0.12)",
                      color: tab === tabKey ? "#fff" : "#5c5248",
                      transition: "all 0.15s",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    {t(`manageReservations.tabs.${tabKey}`)}
                    {tabKey === "PENDING" && pendingCount > 0 && (
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, background: tab === "PENDING" ? "rgba(255,255,255,0.3)" : "#c4410c", color: "#fff", padding: "0.05rem 0.3rem", borderRadius: "999px" }}>
                        {pendingCount}
                      </span>
                    )}
                    {tabKey === "WAITLIST" && waitingCount > 0 && (
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, background: tab === "WAITLIST" ? "rgba(255,255,255,0.3)" : "#c4410c", color: "#fff", padding: "0.05rem 0.3rem", borderRadius: "999px" }}>
                        {waitingCount}
                      </span>
                    )}
                    {tabKey === "PENDING" && newCount > 0 && tab !== "PENDING" && (
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, background: "#dc2626", color: "#fff", padding: "0.05rem 0.3rem", borderRadius: "999px" }}>
                        +{newCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* New arrivals banner */}
          {newCount > 0 && tab !== "PENDING" && (
            <div
              onClick={() => { changeTab("PENDING"); setNewCount(0); }}
              style={{ marginBottom: "1rem", padding: "0.75rem 1rem", background: "#fffbeb", border: "1px solid rgba(180,83,9,0.3)", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 500, color: "#b45309" }}
            >
              {t("manageReservations.newArrivals", { count: newCount })}
            </div>
          )}

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div style={{ marginBottom: "0.75rem", padding: "0.625rem 1rem", background: "#18160f", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "0.875rem", color: "#fff", fontWeight: 500 }}>
                {t("manageReservations.selected", { count: selectedIds.size })}
              </span>
              <div style={{ flex: 1 }} />
              {can("RESERVATIONS_WRITE") && (
                <button
                  onClick={() => handleBulkStatus("CANCELLED")}
                  disabled={bulkLoading}
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600, fontFamily: "inherit", border: "none", borderRadius: "6px", cursor: "pointer", background: "#fef2f2", color: "#dc2626", opacity: bulkLoading ? 0.7 : 1 }}
                >
                  {bulkLoading ? "…" : t("manageReservations.cancelSelected")}
                </button>
              )}
              <button
                onClick={() => setSelectedIds(new Set())}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9088", fontSize: "1rem", lineHeight: 1, padding: "0.1rem" }}
              >
                ×
              </button>
            </div>
          )}

          {/* Main content */}
          <div className="anim-2 card" style={{ opacity: 0, overflow: viewMode === "kanban" ? "auto" : "hidden" }}>
            {viewMode === "kanban" && tab !== "WAITLIST" ? (
              <KanbanView
                reservations={viewMode === "kanban" ? reservations.filter((r) => !["CANCELLED", "NO_SHOW"].includes(r.status)) : []}
                onStatusChange={handleStatus}
                actionLoading={actionLoading}
                canWrite={can("RESERVATIONS_WRITE")}
                onGuestClick={(email, name) => setGuestProfile({ email, name })}
              />
            ) : tab === "WAITLIST" ? (
              /* Waitlist tab */
              waitlist.length === 0 ? (
                <div style={{ padding: "3rem 2rem", textAlign: "center" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.75rem", opacity: 0.25 }}>○</div>
                  <p style={{ fontSize: "1rem", fontWeight: 600, color: "#18160f", marginBottom: "0.25rem" }}>{t("manageReservations.noWaitlist")}</p>
                  <p style={{ fontSize: "0.875rem", color: "#9a9088" }}>{t("manageReservations.noWaitlistSub")}</p>
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "40px 1.4fr 1fr 80px 110px 160px", gap: "1rem", padding: "0.625rem 1.5rem", background: "#fafaf8", borderBottom: "1px solid rgba(24,22,15,0.07)" }}>
                    {(["position", "guest", "date", "party", "status", "actions"] as const).map((hKey) => (
                      <span key={hKey} style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t(`manageReservations.waitlistHeaders.${hKey}`)}</span>
                    ))}
                  </div>
                  {waitlist.map((w) => (
                    <div key={w.id} style={{ display: "grid", gridTemplateColumns: "40px 1.4fr 1fr 80px 110px 160px", gap: "1rem", padding: "0.875rem 1.5rem", borderTop: "1px solid rgba(24,22,15,0.06)", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9a9088" }}>#{w.position}</span>
                      <div>
                        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#18160f", margin: 0 }}>{w.guestName}</p>
                        <a href={`mailto:${w.guestEmail}`} style={{ fontSize: "0.75rem", color: "#9a9088", textDecoration: "none" }}>{w.guestEmail}</a>
                        {w.notes && <p style={{ fontSize: "0.7rem", color: "#5c5248", margin: "0.1rem 0 0", fontStyle: "italic" }}>&quot;{w.notes}&quot;</p>}
                      </div>
                      <p style={{ fontSize: "0.875rem", color: "#18160f", margin: 0 }}>{w.date}</p>
                      <p style={{ fontSize: "0.875rem", color: "#18160f", margin: 0 }}>{w.partySize}p</p>
                      <span className="badge" style={
                        w.status === "WAITING" ? { background: "#fffbeb", color: "#b45309" } :
                        w.status === "NOTIFIED" ? { background: "#eff6ff", color: "#2563eb" } :
                        w.status === "CONFIRMED" ? { background: "#f0fdf4", color: "#16a34a" } :
                        { background: "#f8f8f7", color: "#9a9088" }
                      }>
                        {w.status.toLowerCase()}
                      </span>
                      <div style={{ display: "flex", gap: "0.375rem" }}>
                        {w.status === "WAITING" && (
                          <button
                            onClick={() => handleWaitlistNotify(w.id)}
                            style={{ padding: "0.35rem 0.625rem", fontSize: "0.8125rem", fontWeight: 600, fontFamily: "inherit", border: "none", borderRadius: "6px", cursor: "pointer", background: "#eff6ff", color: "#2563eb" }}
                          >
                            {t("manageReservations.notify")}
                          </button>
                        )}
                        {(w.status === "WAITING" || w.status === "NOTIFIED") && (
                          <button
                            onClick={() => handleWaitlistCancel(w.id)}
                            style={{ padding: "0.35rem 0.625rem", fontSize: "0.8125rem", fontWeight: 600, fontFamily: "inherit", border: "none", borderRadius: "6px", cursor: "pointer", background: "#f5f3ef", color: "#9a9088" }}
                          >
                            {t("manageReservations.remove")}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )
            ) : viewMode === "timeline" ? (
              /* Timeline view */
              <TimelineView
                reservations={filtered}
                date={timelineDate}
                openTime={restaurant?.openTime || "09:00"}
                closeTime={restaurant?.closeTime || "22:00"}
              />
            ) : filtered.length === 0 ? (
              <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem", opacity: 0.25 }}>
                  {tab === "PENDING" ? "✓" : "○"}
                </div>
                <p style={{ fontSize: "1rem", fontWeight: 600, color: "#18160f", marginBottom: "0.375rem" }}>
                  {tab === "PENDING" ? t("manageReservations.allCaughtUp") : t("manageReservations.nothingHere")}
                </p>
                <p style={{ fontSize: "0.875rem", color: "#9a9088" }}>
                  {tab === "PENDING" ? t("manageReservations.noPending") : t("manageReservations.noMatch")}
                </p>
              </div>
            ) : (
              <>
                {/* Column headers */}
                <div style={{ display: "grid", gridTemplateColumns: "28px 1.4fr 1fr 90px 60px 110px 180px", gap: "1rem", padding: "0.625rem 1.5rem", background: "#fafaf8", borderBottom: "1px solid rgba(24,22,15,0.07)" }}>
                  <div>
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                  {(["guest", "dateTime", "table", "party", "status", "actions"] as const).map((hKey) => (
                    <span key={hKey} style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t(`manageReservations.headers.${hKey}`)}</span>
                  ))}
                </div>

                {filtered.map((r, i) => {
                  const name = r.user?.name || r.guestName || "Guest";
                  const email = r.user?.email || r.guestEmail || "";
                  const phone = (r.user?.phone || r.guestPhone || "").toString();
                  const st = STATUS_STYLE[r.status] || STATUS_STYLE.PENDING;
                  const isPending = r.status === "PENDING";
                  const isConfirmed = r.status === "CONFIRMED";
                  const isSeated = r.status === "SEATED";
                  const busy = !!actionLoading;
                  const overlaps = isPending ? getOverlappingPending(reservations, r) : [];
                  const hasOverlap = overlaps.length > 0;
                  const hasConfirmedConflict = overlaps.some((o) => o.status === "CONFIRMED");
                  const isSelected = selectedIds.has(r.id);

                  return (
                    <div
                      key={r.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "28px 1.4fr 1fr 90px 60px 110px 180px",
                        gap: "1rem",
                        padding: "0.875rem 1.5rem",
                        borderTop: i === 0 ? "none" : "1px solid rgba(24,22,15,0.06)",
                        alignItems: "center",
                        background: isSelected
                          ? "rgba(196,65,12,0.04)"
                          : hasOverlap
                            ? "rgba(254,226,226,0.6)"
                            : isPending
                              ? "rgba(255,251,235,0.5)"
                              : "transparent",
                        transition: "background 0.15s",
                      }}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(r.id)}
                        style={{ cursor: "pointer" }}
                      />

                      {/* Guest */}
                      <div style={{ minWidth: 0 }}>
                        <button
                          onClick={() => email ? setGuestProfile({ email, name }) : undefined}
                          style={{ background: "none", border: "none", padding: 0, cursor: email ? "pointer" : "default", fontFamily: "inherit", textAlign: "left" }}
                        >
                          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: email ? "#c4410c" : "#18160f", textDecoration: email ? "underline" : "none", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {name}
                          </p>
                        </button>
                        {email && (
                          <a href={`mailto:${email}`} style={{ fontSize: "0.75rem", color: "#9a9088", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {email}
                          </a>
                        )}
                        {phone && (
                          <a href={`tel:${phone}`} style={{ fontSize: "0.75rem", color: "#9a9088", textDecoration: "none", display: "block" }}>
                            {phone}
                          </a>
                        )}
                        {r.notes && (
                          <p style={{ fontSize: "0.7rem", color: "#5c5248", marginTop: "0.15rem", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.notes}>
                            &quot;{r.notes}&quot;
                          </p>
                        )}
                      </div>

                      {/* Date & Time */}
                      <div>
                        <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#18160f", margin: 0 }}>{r.date}</p>
                        <p style={{ fontSize: "0.75rem", color: "#9a9088", margin: 0 }}>{r.startTime}</p>
                      </div>

                      {/* Table */}
                      <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: r.table ? "#18160f" : "#c8c4be" }}>
                        {r.table ? `T${r.table.label}` : "—"}
                      </span>

                      {/* Party */}
                      <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#18160f" }}>{r.partySize}p</span>

                      {/* Status + conflict badge */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <span className="badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        {isPending && hasOverlap && (
                          <button
                            onClick={() => setOverlapModal({ isOpen: true, target: r, group: overlaps })}
                            disabled={busy}
                            title="Click to resolve conflict"
                            style={{ padding: "0.15rem 0.5rem", fontSize: "0.6rem", fontWeight: 700, fontFamily: "inherit", border: "none", borderRadius: "999px", cursor: "pointer", background: "#dc2626", color: "#fff", lineHeight: 1.4, whiteSpace: "nowrap" }}
                          >
                            ⚠ Conflict
                          </button>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", alignItems: "center" }}>
                        {isPending && can("RESERVATIONS_WRITE") && (
                          <>
                            <button
                              onClick={() => handleStatus(r.id, "CONFIRMED")}
                              disabled={busy || hasConfirmedConflict}
                              title={hasConfirmedConflict ? "Table already confirmed for this time" : undefined}
                              style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600, fontFamily: "inherit", border: "none", borderRadius: "6px", cursor: (busy || hasConfirmedConflict) ? "not-allowed" : "pointer", background: "#16a34a", color: "#fff", opacity: (actionLoading === r.id + "CONFIRMED" || hasConfirmedConflict) ? 0.4 : 1 }}
                            >
                              {actionLoading === r.id + "CONFIRMED" ? "…" : t("manageReservations.accept")}
                            </button>
                            <button
                              onClick={() => handleStatus(r.id, "CANCELLED")}
                              disabled={busy}
                              style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600, fontFamily: "inherit", border: "none", borderRadius: "6px", cursor: busy ? "not-allowed" : "pointer", background: "#fef2f2", color: "#dc2626", opacity: actionLoading === r.id + "CANCELLED" ? 0.65 : 1 }}
                            >
                              {actionLoading === r.id + "CANCELLED" ? "…" : t("manageReservations.decline")}
                            </button>
                          </>
                        )}
                        {isConfirmed && can("RESERVATIONS_WRITE") && (
                          <>
                            <button
                              onClick={() => handleStatus(r.id, "SEATED")}
                              disabled={busy}
                              style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600, fontFamily: "inherit", border: "none", borderRadius: "6px", cursor: busy ? "not-allowed" : "pointer", background: "#ede9fe", color: "#7c3aed", opacity: actionLoading === r.id + "SEATED" ? 0.65 : 1 }}
                            >
                              {actionLoading === r.id + "SEATED" ? "…" : t("manageReservations.seat")}
                            </button>
                            <button
                              onClick={() => handleStatus(r.id, "CANCELLED")}
                              disabled={busy}
                              style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600, fontFamily: "inherit", border: "none", borderRadius: "6px", cursor: busy ? "not-allowed" : "pointer", background: "#f5f3ef", color: "#9a9088", opacity: actionLoading === r.id + "CANCELLED" ? 0.65 : 1 }}
                            >
                              {actionLoading === r.id + "CANCELLED" ? "…" : t("manageReservations.cancelAction")}
                            </button>
                          </>
                        )}
                        {isSeated && can("RESERVATIONS_WRITE") && (
                          <>
                            <button
                              onClick={() => handleStatus(r.id, "COMPLETED")}
                              disabled={busy}
                              style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600, fontFamily: "inherit", border: "none", borderRadius: "6px", cursor: busy ? "not-allowed" : "pointer", background: "#eff6ff", color: "#2563eb", opacity: actionLoading === r.id + "COMPLETED" ? 0.65 : 1 }}
                            >
                              {actionLoading === r.id + "COMPLETED" ? "…" : t("manageReservations.complete")}
                            </button>
                            <button
                              onClick={() => handleStatus(r.id, "CANCELLED")}
                              disabled={busy}
                              style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600, fontFamily: "inherit", border: "none", borderRadius: "6px", cursor: busy ? "not-allowed" : "pointer", background: "#f5f3ef", color: "#9a9088", opacity: actionLoading === r.id + "CANCELLED" ? 0.65 : 1 }}
                            >
                              {actionLoading === r.id + "CANCELLED" ? "…" : t("manageReservations.cancelAction")}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Live floor panel */}
        {showFloorPanel && (
          <aside style={{ width: "220px", flexShrink: 0 }}>
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(24,22,15,0.08)", background: "#fafaf8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Live Floor</p>
                <button
                  onClick={() => setShowFloorPanel(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9088", fontSize: "1rem", lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
              <LiveFloorPanel
                date={dateFilter || today}
                onTableClick={(tableId) => setTableFilter((t) => t === tableId ? "" : tableId)}
              />
            </div>
          </aside>
        )}
      </div>

      {/* Overlap Modal */}
      {overlapModal?.isOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOverlapModal(null); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
        >
          <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "520px", maxHeight: "80vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.22)" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(24,22,15,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#18160f", margin: 0 }}>{t("manageReservations.overlap.title")}</h3>
                <p style={{ fontSize: "0.75rem", color: "#9a9088", margin: "0.15rem 0 0" }}>
                  Table {overlapModal.target.table?.label} · {overlapModal.target.date} ·{" "}
                  {overlapModal.group.some((r) => r.status === "CONFIRMED")
                    ? t("manageReservations.overlap.alreadyConfirmed")
                    : t("manageReservations.overlap.acceptingDeclines")}
                </p>
              </div>
              <button onClick={() => setOverlapModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9a9088", fontSize: "1.375rem", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: "0.75rem 1.25rem" }}>
              {(() => {
                const allItems = [overlapModal.target, ...overlapModal.group];
                const groupHasConfirmed = allItems.some((i) => i.status === "CONFIRMED");
                return allItems.map((item) => {
                  const itemName = item.user?.name || item.guestName || "Guest";
                  const isTarget = item.id === overlapModal.target.id;
                  return (
                    <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 110px 90px", gap: "0.75rem", alignItems: "center", padding: "0.75rem 0", borderTop: "1px solid rgba(24,22,15,0.06)" }}>
                      <div>
                        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#18160f", margin: 0 }}>
                          {itemName}
                          {isTarget && <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "#dc2626", background: "#fef2f2", padding: "0.1rem 0.4rem", borderRadius: "999px", marginLeft: "0.25rem" }}>This request</span>}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "#9a9088", margin: "0.1rem 0 0" }}>{item.startTime} · {item.partySize} guests</p>
                      </div>
                      <span className="badge" style={{ background: STATUS_STYLE[item.status]?.bg || "#f0ede8", color: STATUS_STYLE[item.status]?.color || "#5c5248" }}>
                        {STATUS_STYLE[item.status]?.label || item.status}
                      </span>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        {item.status === "PENDING" && (
                          <button
                            onClick={() => { setOverlapModal(null); handleStatus(item.id, "CONFIRMED"); }}
                            disabled={!!actionLoading || groupHasConfirmed}
                            title={groupHasConfirmed ? "Table already confirmed for this time" : undefined}
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600, fontFamily: "inherit", border: "none", borderRadius: "6px", cursor: (!!actionLoading || groupHasConfirmed) ? "not-allowed" : "pointer", background: "#16a34a", color: "#fff", opacity: groupHasConfirmed ? 0.4 : 1 }}
                          >
                            {actionLoading === item.id + "CONFIRMED" ? "…" : "Accept"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Guest profile modal */}
      {guestProfile && (
        <GuestProfileModal
          guestEmail={guestProfile.email}
          guestName={guestProfile.name}
          onClose={() => setGuestProfile(null)}
        />
      )}
    </div>
  );
}

export default function ReservationsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#f5f3ef", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "36px", height: "36px", border: "3px solid #f0ede8", borderTopColor: "#c4410c", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    }>
      <ReservationsPageInner />
    </Suspense>
  );
}
