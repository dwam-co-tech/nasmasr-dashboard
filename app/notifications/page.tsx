'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { UserSummary } from '@/models/users';
import type { AdminNotificationData } from '@/models/notifications';
import { sendNotification as sendNotificationApi, fetchAllUsersSummary, fetchAdminNotifications, fetchAdminNotificationsCount, markAdminNotificationRead } from '@/services/notifications';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

const adminNotificationTypeLabel: Record<string, string> = {
  default: 'النظام',
  system: 'النظام',
  listing_pending: 'إعلان قيد المراجعة',
  listing_approved: 'تمت الموافقة على إعلان',
  listing_rejected: 'تم رفض إعلان',
  new_report: 'بلاغ جديد',
  promotion: 'ترويج',
  message: 'رسالة',
  payment: 'مدفوعات',
  subscription: 'اشتراك',
};

function getAdminNotificationTypeLabel(type?: string | null): string {
  const key = String(type || '').trim();
  if (!key) return adminNotificationTypeLabel.system;
  return adminNotificationTypeLabel[key] ?? key;
}

function DateInput(props: { value: string; onChange: (v: string) => void }) {
  const { value, onChange } = props;
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [y, m, d] = value.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return dt;
  }, [value]);
  const [viewDate, setViewDate] = useState<Date>(() => parsed || new Date());
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (ev: MouseEvent) => {
      if (!wrapperRef.current) return;
      const target = ev.target as Node;
      if (!wrapperRef.current.contains(target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startOffset = (new Date(year, month, 1).getDay() + 1) % 7;
  const blanks = Array.from({ length: startOffset });
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  const fmt = (dt: Date) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const isSameDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const monthLabel = viewDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  const weekdays = [
    { full: 'السبت', short: 'سبت' },
    { full: 'الأحد', short: 'أحد' },
    { full: 'الإثنين', short: 'اثنين' },
    { full: 'الثلاثاء', short: 'ثلاثاء' },
    { full: 'الأربعاء', short: 'أربعاء' },
    { full: 'الخميس', short: 'خميس' },
    { full: 'الجمعة', short: 'جمعة' },
  ];

  return (
    <div className="date-input-wrapper" ref={wrapperRef}>
      <input
        type="text"
        className="filter-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="YYYY-MM-DD"
        style={{ direction: 'ltr' }}
      />
      <button
        type="button"
        className="calendar-button"
        onClick={() => setOpen((p) => { const next = !p; if (next && parsed) setViewDate(parsed); return next; })}
        aria-label="فتح التقويم"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="5" width="18" height="16" rx="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {open && (
        <div className="date-popover">
          <div className="calendar-header">
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            >
              ◀
            </button>
            <div className="calendar-title">{monthLabel}</div>
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            >
              ▶
            </button>
          </div>
          <div className="calendar-weekdays">
            {weekdays.map((w) => (
              <div key={w.full} className="weekday-cell">
                <span className="weekday-full">{w.full}</span>
                <span className="weekday-short">{w.short}</span>
              </div>
            ))}
          </div>
          <div className="calendar-grid">
            {blanks.map((_, i) => (
              <div key={`b-${i}`} className="calendar-cell empty" />
            ))}
            {days.map((d) => {
              const dt = new Date(year, month, d);
              const today = isSameDate(dt, new Date());
              const selected = parsed ? isSameDate(dt, parsed) : false;
              return (
                <button
                  key={d}
                  type="button"
                  className={`calendar-cell day ${selected ? 'selected' : ''} ${today ? 'today' : ''}`}
                  onClick={() => {
                    onChange(fmt(dt));
                    setOpen(false);
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const [adminNotifications, setAdminNotifications] = useState<AdminNotificationData[]>([]);
  const [notificationsPage, setNotificationsPage] = useState(1);
  const [notificationsMeta, setNotificationsMeta] = useState<{ current_page: number; last_page: number; total: number } | null>(null);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingReadById, setMarkingReadById] = useState<Record<number, boolean>>({});

  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [sendNotifOpen, setSendNotifOpen] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [users, setUsers] = useState<Array<{ id: number; name: string; phone?: string | null; user_code?: string | null }>>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [sending, setSending] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const isWithinRange = (dateString: string, start: string, end: string) => {
    const sub = new Date(dateString);
    const s = start ? new Date(start) : null;
    const e = end ? new Date(end) : null;
    if (s && sub < s) return false;
    if (e) {
      const endOfDay = new Date(e);
      endOfDay.setHours(23, 59, 59, 999);
      if (sub > endOfDay) return false;
    }
    return true;
  };

  const filteredAdminNotifications = useMemo(() => {
    const start = dateFilter.start;
    const end = dateFilter.end;
    if (!start && !end) return adminNotifications;
    return adminNotifications.filter((n) => {
      const dt = n.created_at || n.updated_at || '';
      if (!dt) return false;
      return isWithinRange(dt, start, end);
    });
  }, [adminNotifications, dateFilter]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => {
      const s = `${u.name} ${u.phone || ''} ${u.user_code || ''}`.toLowerCase();
      return s.includes(q);
    });
  }, [users, userSearch]);

  const allSelected = useMemo(() => {
    if (!filteredUsers.length) return false;
    return filteredUsers.every(u => selectedUserIds.has(u.id));
  }, [filteredUsers, selectedUserIds]);

  useEffect(() => {
    let cancelled = false;
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
    const load = async () => {
      setNotificationsLoading(true);
      setNotificationsError(null);
      try {
        const res = await fetchAdminNotifications(notificationsPage, token);
        if (cancelled) return;
        setAdminNotifications(res.data || []);
        setNotificationsMeta({
          current_page: res.current_page,
          last_page: res.last_page,
          total: res.total,
        });
      } catch (e) {
        if (cancelled) return;
        const m = e instanceof Error ? e.message : 'تعذر جلب الإشعارات';
        setNotificationsError(m);
      } finally {
        if (!cancelled) setNotificationsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [notificationsPage]);

  useEffect(() => {
    let cancelled = false;
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
    const loadCount = async () => {
      try {
        const c = await fetchAdminNotificationsCount(token);
        if (!cancelled) setUnreadCount(c);
      } catch {}
    };
    loadCount();
    const id = setInterval(loadCount, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!sendNotifOpen) return;
    let cancelled = false;
    const loadUsers = async () => {
      setUsersLoading(true);
      setUsersError(null);
      try {
        const arr: UserSummary[] = await fetchAllUsersSummary({ per_page: 100 });
        const mapped = arr.map(u => ({ id: Number(u.id) || 0, name: u.name || '-', phone: u.phone ?? null, user_code: u.user_code || null }));
        if (!cancelled) setUsers(mapped);
      } catch (e) {
        const m = e instanceof Error ? e.message : 'تعذر جلب قائمة المستخدمين';
        if (!cancelled) setUsersError(m);
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    };
    loadUsers();
    return () => { cancelled = true; };
  }, [sendNotifOpen]);

  const sendNotification = async () => {
    if (!selectedUserIds.size) { showToast('يرجى اختيار مستخدم واحد على الأقل', 'error'); return; }
    if (!notifBody.trim()) { showToast('يرجى كتابة نص الإشعار', 'error'); return; }
    setSending(true);
    try {
      const body = notifTitle.trim() ? `${notifTitle.trim()}\n${notifBody.trim()}` : notifBody.trim();
      const ids = Array.from(selectedUserIds);
      let ok = 0, fail = 0;
      await Promise.all(ids.map(async (uid) => {
        try { await sendNotificationApi({ title: notifTitle.trim() || 'إشعار', body: body, user_id: uid, type: 'promotion' }); ok++; }
        catch { fail++; }
      }));
      showToast(`تم إرسال الإشعار إلى ${ok} مستخدم${fail ? ` وفشل ${fail}` : ''}`, ok && !fail ? 'success' : fail && !ok ? 'error' : 'info');
      setSelectedUserIds(new Set());
      setNotifTitle('');
      setNotifBody('');
    } catch (e) {
      const m = e instanceof Error ? e.message : 'تعذر إرسال الإشعار';
      showToast(m, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    if (markingReadById[id]) return;
    const target = adminNotifications.find((n) => n.id === id);
    if (!target || target.read_at) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
    const prevReadAt = target.read_at;
    setMarkingReadById((prev) => ({ ...prev, [id]: true }));
    setAdminNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markAdminNotificationRead(id, token);
    } catch (e) {
      setAdminNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: prevReadAt || null } : n)));
      const m = e instanceof Error ? e.message : 'تعذر تعليم الإشعار كمقروء';
      showToast(m, 'error');
    } finally {
      try {
        const c = await fetchAdminNotificationsCount(token);
        setUnreadCount(c);
      } catch {}
      setMarkingReadById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const toggleSelectUser = (id: number) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  return (
    <div className="notifications-page">
      {/* Header */}
      <div className="notifications-header">
        <div className="header-content" style={{ justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 className="page-title" style={{ margin: 0 }}>الإشعارات</h1>
              <span className={`notifications-unread-badge ${unreadCount ? 'has-unread' : ''}`}>
                غير مقروء: {unreadCount}
              </span>
            </div>
            <p className="page-description">سجل إشعارات النظام</p>
          </div>
          <div className="header-actions">
            <button className="btn-submit" onClick={() => setSendNotifOpen(true)}>
              إرسال إشعار لمستخدم
            </button>
          </div>
        </div>
      </div>

      <div className="campaigns-section">
        <div className="notifications-toolbar">
          <div className="notifications-counter">
            <span className="notifications-counter-dot" />
            <span className="notifications-counter-label">إشعارات جديدة</span>
            <span className="notifications-counter-value">{unreadCount}</span>
          </div>
          {notificationsMeta && (
            <div className="notifications-pagination">
              <button
                className="notifications-page-btn"
                disabled={notificationsPage <= 1 || notificationsLoading}
                onClick={() => setNotificationsPage((p) => Math.max(1, p - 1))}
              >
                السابق
              </button>
              <span className="notifications-page-info">
                صفحة {notificationsMeta.current_page} من {notificationsMeta.last_page}
              </span>
              <button
                className="notifications-page-btn"
                disabled={notificationsMeta.current_page >= notificationsMeta.last_page || notificationsLoading}
                onClick={() =>
                  setNotificationsPage((p) =>
                    notificationsMeta ? Math.min(notificationsMeta.last_page, p + 1) : p + 1,
                  )
                }
              >
                التالي
              </button>
            </div>
          )}
        </div>
        <div className="filter-bar">
          <span className="filter-label">فلتر بالتاريخ:</span>
          <div className="filter-group">
            <label className="filter-label">من</label>
            <DateInput
              value={dateFilter.start}
              onChange={(v) => { setDateFilter({ ...dateFilter, start: v }); }}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label">إلى</label>
            <DateInput
              value={dateFilter.end}
              onChange={(v) => { setDateFilter({ ...dateFilter, end: v }); }}
            />
          </div>
          {/* <button
            className="btn-cancel filter-reset"
            onClick={() => { setDateFilter({ start: '', end: '' }); setCurrentPage(1); }}
          >
            إعادة تعيين الفلتر
          </button> */}
        </div>
        <div className="notifications-list">
          {notificationsLoading && (
            <div className="empty-state">
              <div className="empty-icon">⏳</div>
              <h3>جاري تحميل الإشعارات</h3>
              <p>يتم الآن جلب أحدث إشعارات النظام</p>
            </div>
          )}
          {notificationsError && !notificationsLoading && (
            <div className="empty-state">
              <div className="empty-icon">⚠️</div>
              <h3>تعذر جلب الإشعارات</h3>
              <p>{notificationsError}</p>
            </div>
          )}
          {!notificationsLoading && !notificationsError && filteredAdminNotifications.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔔</div>
              <h3>لا توجد إشعارات</h3>
              <p>لم يتم استلام أي إشعارات حتى الآن</p>
            </div>
          )}
          {filteredAdminNotifications.map((n) => {
            const isRead = !!n.read_at;
            const createdAt = n.created_at || n.updated_at || '';
            const marking = Boolean(markingReadById[n.id]);
            return (
              <div
                key={n.id}
                className={`notification-card ${isRead ? 'notification-read' : 'notification-unread'}`}
                onClick={() => {
                  if (!isRead) handleMarkRead(n.id);
                }}
              >
                <div className="notification-header">
                  <h4 className="notification-title">{n.title}</h4>
                  <div className="notification-actions">
                    {!isRead && (
                      <button
                        type="button"
                        className="notification-mark-read-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(n.id);
                        }}
                        disabled={marking}
                      >
                        {marking ? 'جارٍ...' : 'تعليم كمقروء'}
                      </button>
                    )}
                    <span className={`notification-type-badge notification-type-${n.type || 'default'}`}>
                      {getAdminNotificationTypeLabel(n.type)}
                    </span>
                  </div>
                </div>
                <p className="notification-description">{n.body}</p>
                <div className="notification-time">
                  تم الإرسال: {createdAt ? formatDate(createdAt) : '-'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Reply Modal */}
      {/* {showQuickReplyModal && (
        <div className="modal-overlay" onClick={() => { setShowQuickReplyModal(false); setEditingQuickReply(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingQuickReply ? 'تعديل رد سريع' : 'إضافة رد سريع جديد'}</h3>
              <button className="modal-close" onClick={() => { setShowQuickReplyModal(false); setEditingQuickReply(null); }}>×</button>
            </div>
            <form className="quick-reply-form" onSubmit={handleQuickReplySubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>عنوان الرد</label>
                  <input
                    type="text"
                    value={quickReplyForm.title}
                    onChange={(e) => setQuickReplyForm({...quickReplyForm, title: e.target.value})}
                    placeholder="أدخل عنوان الرد السريع"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>الفئة</label>
                  <select
                    value={quickReplyForm.category}
                    onChange={(e) => setQuickReplyForm({...quickReplyForm, category: e.target.value})}
                    required
                  >
                    <option value="">اختر الفئة</option>
                    <option value="عام">عام</option>
                    <option value="شكاوى">شكاوى</option>
                    <option value="دعم فني">دعم فني</option>
                    <option value="استفسارات">استفسارات</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>محتوى الرد</label>
                  <textarea
                    value={quickReplyForm.content}
                    onChange={(e) => setQuickReplyForm({...quickReplyForm, content: e.target.value})}
                    placeholder="أدخل محتوى الرد السريع"
                    rows={4}
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => { setShowQuickReplyModal(false); setEditingQuickReply(null); }}>
                  إلغاء
                </button>
                <button type="submit" className="btn-submit">
                  {editingQuickReply ? 'حفظ التعديلات' : 'إضافة الرد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}

      {sendNotifOpen && (
        <div className="modal-overlay" onClick={() => setSendNotifOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>إرسال إشعار لمستخدم</h3>
              <button className="modal-close" onClick={() => setSendNotifOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 700, color: '#111827' }}>اختر المستخدم</div>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="ابحث بالاسم أو الهاتف أو الكود"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    style={{ marginBottom: 10 }}
                  />
                  <div className="user-select-all">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                    <span>تحديد الكل</span>
                    <span style={{ marginRight: 'auto', fontSize: 12, color: '#6b7280' }}>المحدد: {selectedUserIds.size}</span>
                  </div>
                  <div className="user-picker-list">
                    {usersLoading && <div style={{ padding: 12, color: '#6b7280' }}>جاري التحميل...</div>}
                    {usersError && <div style={{ padding: 12, color: '#ef4444' }}>{usersError}</div>}
                    {!usersLoading && !usersError && filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleSelectUser(u.id)}
                        className={`user-picker-item ${selectedUserIds.has(u.id) ? 'selected' : ''}`}
                      >
                        <div className="user-check">
                          <input type="checkbox" checked={selectedUserIds.has(u.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggleSelectUser(u.id)} />
                        </div>
                        <div className="user-main">
                          <div className="user-name">{u.name}</div>
                          <div className="user-phone">{u.phone || '-'}</div>
                        </div>
                        <div className="user-code">{u.user_code || ''}</div>
                      </button>
                    ))}
                    {!usersLoading && !usersError && !filteredUsers.length && (
                      <div style={{ padding: 12, color: '#6b7280' }}>لا توجد نتائج</div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="form-group">
                    <label>عنوان الإشعار</label>
                    <input type="text" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="اختياري" />
                  </div>
                  <div className="form-group" style={{ marginTop: 12 }}>
                    <label>نص الإشعار</label>
                    <textarea rows={5} value={notifBody} onChange={(e) => setNotifBody(e.target.value)} placeholder="اكتب نص الإشعار" />
                  </div>
                </div>
              </div>
              <div className="form-actions" style={{ marginTop: 16 }}>
                <button className="btn-cancel" type="button" onClick={() => setSendNotifOpen(false)}>إلغاء</button>
                <button className="btn-submit" type="button" onClick={sendNotification} disabled={sending}>
                  {sending ? 'جارٍ الإرسال...' : 'إرسال الإشعار'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <div className="toast-icon">{t.type === 'success' ? '✓' : t.type === 'error' ? '!' : 'ℹ'}</div>
            <div className="toast-content">
              <div className="toast-title">إشعار</div>
              <p className="toast-message">{t.message}</p>
            </div>
            <button className="toast-close" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
