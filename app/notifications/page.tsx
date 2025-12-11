'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { UserSummary } from '@/models/users';
import { sendNotification as sendNotificationApi, fetchAllUsersSummary } from '@/services/notifications';

interface AdRequest {
  id: string;
  title: string;
  advertiser: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  description: string;
  price: number;
  location: string;
  phone?: string;
  email?: string;
}

interface QuickReply {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
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
  const [showQuickReplyModal, setShowQuickReplyModal] = useState(false);
  const [selectedAdRequest, setSelectedAdRequest] = useState<AdRequest | null>(null);
  const [showAdDetails, setShowAdDetails] = useState(false);
  const [editingQuickReply, setEditingQuickReply] = useState<QuickReply | null>(null);
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 3;
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

  const [adRequests, setAdRequests] = useState<AdRequest[]>([]);


  const handleViewAdDetails = (ad: AdRequest) => {
    setSelectedAdRequest(ad);
    setShowAdDetails(true);
  };


  const formatPrice = (price: number) => {
    if (price === 0) return 'غير محدد';
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(price);
  };

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

  const isWithinRange = (submittedAt: string, start: string, end: string) => {
    const sub = new Date(submittedAt);
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

  const filteredAdRequests = useMemo(() => {
    return adRequests.filter(ad => isWithinRange(ad.submittedAt, dateFilter.start, dateFilter.end));
  }, [adRequests, dateFilter]);

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

  const totalPages = Math.max(1, Math.ceil(filteredAdRequests.length / pageSize));
  const paginatedAdRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAdRequests.slice(startIndex, startIndex + pageSize);
  }, [filteredAdRequests, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

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
            <h1 className="page-title">الإشعارات </h1>
            <p className="page-description">سجل إشعارات طلبات نشر الإعلانات</p>
          </div>
          <div className="header-actions">
            <button className="btn-submit" onClick={() => setSendNotifOpen(true)}>
              إرسال إشعار لمستخدم
            </button>
          </div>
        </div>
      </div>

      <div className="campaigns-section">
        <div className="filter-bar">
          <span className="filter-label">فلتر بالتاريخ:</span>
          <div className="filter-group">
            <label className="filter-label">من</label>
            <DateInput
              value={dateFilter.start}
              onChange={(v) => { setDateFilter({ ...dateFilter, start: v }); setCurrentPage(1); }}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label">إلى</label>
            <DateInput
              value={dateFilter.end}
              onChange={(v) => { setDateFilter({ ...dateFilter, end: v }); setCurrentPage(1); }}
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
          {paginatedAdRequests.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔔</div>
              <h3>لا توجد إشعارات</h3>
              <p>لا توجد إشعارات حسب الفلتر المحدد</p>
            </div>
          )}
          {paginatedAdRequests.map((ad) => (
            <div key={ad.id} className="notification-card" onClick={() => handleViewAdDetails(ad)}>
              <div className="notification-header">
                <h4 className="notification-title">{ad.title}</h4>
                {/* <span className={`status-badge ${ad.status}`}>{ad.status === 'pending' ? 'قيد المراجعة' : ad.status === 'approved' ? 'تمت الموافقة' : 'مرفوض'}</span> */}
              </div>
              <div className="notification-meta">
                <span className="meta-item">- {ad.advertiser}</span>
                {/* <span className="meta-sep">•</span> */}
                <span className="meta-item">- {ad.category}</span>
                {/* <span className="meta-sep">•</span> */}
                <span className="meta-item">- {ad.location}</span>
                {/* <span className="meta-sep">•</span> */}
                <span className="meta-item">- {formatPrice(ad.price)}</span>
              </div>
              <p className="notification-description">{ad.description.length > 100 ? `${ad.description.substring(0, 100)}...` : ad.description}</p>
              <div className="notification-time">تم التقديم: {formatDate(ad.submittedAt)}</div>
            </div>
          ))}
        </div>

        {filteredAdRequests.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">صفحة {currentPage} من {totalPages}</div>
            <div className="pagination-controls">
              <button
                className="pagination-btn pagination-nav-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                السابق
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="pagination-btn pagination-nav-btn"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Replies Section */}
      {/* <div className="quick-replies-section">
        <div className="section-header">
          <h3>الردود السريعة</h3>
          <button 
            className="btn-submit"
            onClick={() => setShowQuickReplyModal(true)}
          >
            إضافة رد سريع
          </button>
        </div>
        
        <div className="quick-replies-grid">
          {quickReplies.map((reply) => (
            <div key={reply.id} className="quick-reply-card">
              <div className="card-header">
                <h4>{reply.title}</h4>
                <span className="category-badge">{reply.category}</span>
              </div>
              <div className="card-body">
                <p>{reply.content}</p>
              </div>
              <div className="card-actions">
                <div className="action-buttons">
                  <button className="btn-action copy" onClick={() => handleCopyQuickReply(reply)}>نسخ</button>
                  <button className="btn-action edit" onClick={() => handleEditQuickReply(reply)}>تعديل</button>
                  <button 
                    className="btn-action delete"
                    onClick={() => handleDeleteQuickReply(reply.id)}
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div> */}

      {/* Ad Details Modal */}
      {showAdDetails && selectedAdRequest && (
        <div className="modal-overlay" onClick={() => setShowAdDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>تفاصيل طلب الإعلان</h3>
              <button className="modal-close" onClick={() => setShowAdDetails(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: 24 }}>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: '600' }}>{selectedAdRequest.title}</h4>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <strong>المعلن:</strong> {selectedAdRequest.advertiser}
                </div>
                <div>
                  <strong>الفئة:</strong> {selectedAdRequest.category}
                </div>
                <div>
                  <strong>الموقع:</strong> {selectedAdRequest.location}
                </div>
                <div>
                  <strong>السعر:</strong> {formatPrice(selectedAdRequest.price)}
                </div>
                {selectedAdRequest.phone && (
                  <div>
                    <strong>الهاتف:</strong> {selectedAdRequest.phone}
                  </div>
                )}
                {selectedAdRequest.email && (
                  <div>
                    <strong>البريد الإلكتروني:</strong> {selectedAdRequest.email}
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <strong>الوصف:</strong>
                <p style={{ margin: '8px 0 0 0', lineHeight: '1.6', color: '#4b5563' }}>{selectedAdRequest.description}</p>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <strong>تاريخ التقديم:</strong> {formatDate(selectedAdRequest.submittedAt)}
              </div>
              
              <div className="form-actions">
                <button className="btn-cancel" onClick={() => setShowAdDetails(false)}>إغلاق</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
