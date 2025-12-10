"use client";

import ManagedSelect from '@/components/ManagedSelect';
import { ALL_CATEGORIES } from '@/constants/categories';
import { useMemo, useState, useEffect, useRef } from "react";
import { ListingReport, ListingReportReadResponse } from '@/models/reports';
import { fetchListingReports, acceptListingReport, dismissListingReport, markListingReportsReadAndFetch } from '@/services/reports';
import { PendingListingsMeta } from '@/models/listings';

const formatDateDDMMYYYY = (s?: string) => {
  const t = String(s || '').trim();
  if (!t) return '-';
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return t;
  return `${m[3]}-${m[2]}-${m[1]}`;
};

const formatDateHM = (s?: string | null) => {
  const t = String(s || '').trim();
  if (!t) return '-';
  const d = new Date(t);
  if (isNaN(d.getTime())) return t;
  const date = d.toLocaleDateString('ar-EG');
  const time = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
};

const isReadAllMessage = (m?: string | null) => {
  const t = String(m || '').trim().replace(/[.!]+$/, '').toLowerCase();
  return t === 'all reports for this listing marked as read';
};

const labelizeAttrKey = (k: string) => {
  const t = String(k || '');
  return t === 'admin_approval' ? 'الادمن' : t;
};

const labelizePublishVia = (s?: string | null) => {
  const t = String(s || '').trim();
  if (!t) return '-';
  if (t.toLowerCase() === 'admin_approval') return 'الادمن';
  return t;
};

export default function ReportsReviewPage() {
  const [reports, setReports] = useState<ListingReport[]>([]);
  const [meta, setMeta] = useState<PendingListingsMeta | null>(null);
  const [reasonFilter, setReasonFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [details, setDetails] = useState<ListingReportReadResponse | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [highlightedRows, setHighlightedRows] = useState<Set<number>>(new Set());

  interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    actions?: { label: string; variant?: 'primary' | 'secondary'; onClick?: () => void }[];
    duration?: number;
  }
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const showToast = (
    message: string,
    type: Toast['type'] = 'info',
    options?: { actions?: Toast['actions']; duration?: number }
  ) => {
    const id = String(++toastIdRef.current);
    const newToast: Toast = { id, message, type, actions: options?.actions, duration: options?.duration };
    setToasts(prev => [...prev, newToast]);
    const autoDuration = options?.duration ?? 4000;
    if (!newToast.actions && autoDuration > 0) {
      setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, autoDuration);
    }
  };
  const removeToast = (id: string) => { setToasts(prev => prev.filter(t => t.id !== id)); };

  const uniqueReasons = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((ad) => (ad.reasons || []).forEach((r) => set.add(r)));
    return Array.from(set);
  }, [reports]);

  const filteredAds = reports.filter((ad) => {
    const hasReason = reasonFilter ? (ad.reasons || []).some((r) => r === reasonFilter) : true;
    const matchesCategory = categoryFilter ? ad.category_name === categoryFilter : true;
    const matchesStatus = statusFilter ? ad.status === statusFilter : true;
    const matchesSearch = searchTerm
      ? ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(ad.advertiser_code).toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return hasReason && matchesCategory && matchesStatus && matchesSearch;
  });

  const totalPages = Math.max(1, meta?.last_page ?? 1);
  const currentAds = [...filteredAds].sort((a, b) => {
    const ap = String(a.report_status || '').toLowerCase() === 'pending' ? 0 : 1;
    const bp = String(b.report_status || '').toLowerCase() === 'pending' ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return 0;
  });

  const reportStatusText = (s: string) => {
    const v = String(s || '').toLowerCase();
    if (v === 'pending') return 'قيد المراجعة';
    if (v === 'resolved') return 'تمت المعالجة';
    if (v === 'rejected') return 'مرفوض';
    if (v === 'dismissed') return 'تم رفض البلاغ';
    return s;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetchListingReports(currentPage, 20);
        setReports(resp.data);
        setMeta(resp.meta);
      } catch {}
    };
    load();
  }, [currentPage]);

  const approveReport = async (adId: number) => {
    try {
      const resp = await acceptListingReport(adId);
      const msg = 'تم قبول البلاغ وتم رفض الإعلان';
      showToast(resp?.message ? msg : msg, 'success');
      setReports((prev) => prev.map((a) => (a.id === adId ? { ...a, status: 'مرفوض', report_status: 'resolved' } : a)));
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : 'تعذر قبول البلاغ';
      showToast(m, 'error');
    }
  };

  const rejectReport = async (adId: number) => {
    try {
      const resp = await dismissListingReport(adId);
      const msg = 'تم رفض البلاغ والإعلان مازال صالحًا';
      showToast(resp?.message ? msg : msg, 'success');
      setReports((prev) => prev.map((a) => (a.id === adId ? { ...a, report_status: 'dismissed' } : a)));
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : 'تعذر رفض البلاغ';
      showToast(m, 'error');
    }
  };

  const viewDetails = async (adId: number) => {
    try {
      const resp = await markListingReportsReadAndFetch(adId);
      setDetails(resp);
      setDetailsOpen(true);
      const msg = resp?.message || 'تم التعليم كمقروء وجلب التفاصيل';
      showToast(msg, 'success');
      if (isReadAllMessage(resp?.message)) {
        setHighlightedRows((prev) => {
          const next = new Set(prev);
          next.add(adId);
          return next;
        });
      }
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : 'تعذر جلب تفاصيل الإعلان';
      showToast(m, 'error');
    }
  };

  return (
    <>
    <div className="page-container reports-review-page">
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-header">
              <span className="toast-icon">
                {toast.type === 'success' && '✓'}
                {toast.type === 'error' && '✕'}
                {toast.type === 'warning' && '⚠'}
                {toast.type === 'info' && 'ℹ'}
              </span>
              <span className="toast-message">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.5 }}>×</button>
            </div>
            {toast.actions && (
              <div className="toast-actions">
                {toast.actions.map((action, idx) => (
                  <button
                    key={idx}
                    className={`toast-action-btn toast-action-${action.variant || 'primary'}`}
                    onClick={() => { action.onClick?.(); removeToast(toast.id); }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="reports-review-header">
        <div className="header-content">
          <div className="title-section">
            <button className="back-button" onClick={() => (window.location.href = "/ads")} title="العودة">
              ← العودة
            </button>
            {/* <div className="title-icon">🚨</div> */}
            <div>
              <h1 className="page-title">مراجعة البلاغات</h1>
              <p className="page-subtitle">مراجعة البلاغات على الإعلانات واتخاذ الإجراءات المناسبة</p>
            </div>
          </div>
          <div className="stats-section">
            <div className="stat-card">
              <span className="value-secondary">{meta?.total ?? filteredAds.length}</span>
              <span className="label">إعلانات ببلاغات</span>
            </div>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-item">
          <label className="filter-label">سبب البلاغ</label>
          <ManagedSelect
            value={reasonFilter}
            onChange={(v) => { setReasonFilter(v); setCurrentPage(1); }}
            options={uniqueReasons}
            placeholder="كل الأسباب"
          />
        </div>
        <div className="filter-item">
          <label className="filter-label">القسم</label>
          <ManagedSelect
            value={categoryFilter}
            onChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}
            options={ALL_CATEGORIES}
            placeholder="كل الأقسام"
          />
        </div>
        <div className="filter-item">
          <label className="filter-label">الحالة</label>
          <ManagedSelect
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
            options={['منشور', 'قيد المراجعة', 'مرفوض']}
            placeholder="كل الحالات"
          />
        </div>
        <div className="filter-item">
          <label className="filter-label">بحث</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="العنوان أو كود المعلن"
            className="form-input"
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>العنوان</th>
              <th>القسم</th>
              <th>الحالة</th>
              <th>كود المعلن</th>
              <th>تاريخ البلاغ</th>
              <th>الأسباب</th>
              <th>عدد البلاغات</th>
              <th>حالة البلاغ</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {currentAds.map((ad) => (
              <tr
                key={ad.id}
                className={String(ad.report_status || '').toLowerCase() !== 'pending' ? 'reports-row-inactive' : ''}
                style={highlightedRows.has(ad.id) ? { backgroundColor: '#dcfce7' } : undefined}
              >
                <td className="ad-title-cell" data-label="العنوان">{ad.title}</td>
                <td data-label="القسم">{ad.category_name}</td>
                <td data-label="الحالة">
                  <span className="status-badge">{ad.status}</span>
                </td>
                <td data-label="كود المعلن">
                  <span className="owner-code-badge">{ad.advertiser_code}</span>
                </td>
                <td className="cell-muted" data-label="تاريخ البلاغ">{formatDateDDMMYYYY(ad.report_date)}</td>
                <td data-label="الأسباب">
                  <div className="reasons-list">
                    {(ad.reasons || []).map((r, idx) => (
                      <span key={idx} className="reason-badge">{r}</span>
                    ))}
                  </div>
                </td>
                <td data-label="عدد البلاغات">{ad.reports_count}</td>
                <td data-label="حالة البلاغ"><span className="status-badge">{reportStatusText(ad.report_status)}</span></td>
                <td data-label="إجراءات">
                  <div className="action-buttons reports-actions">
                    <button className="btn-approve" title="موافقة" onClick={() => approveReport(ad.id)}>
                      <span className="btn-text">موافقة</span>
                    </button>
                    <button className="btn-reject" title="رفض" onClick={() => rejectReport(ad.id)}>
                      <span className="btn-text">رفض</span>
                    </button>
                    <button className="btn-view" title="عرض" onClick={() => viewDetails(ad.id)}>
                      <span className="btn-text">عرض</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            <span>إجمالي {meta?.total ?? 0} إعلان في {totalPages} صفحة</span>
          </div>
          <div className="pagination">
            <button
              className="pagination-btn pagination-nav"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              ← السابق
            </button>
            <span className="page-info">الصفحة {currentPage} من {totalPages}</span>
            <button
              className="pagination-btn pagination-nav"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              التالي →
            </button>
          </div>
        </div>
      )}
    </div>
    {detailsOpen && details && (
      <div className="modal-overlay" onClick={() => setDetailsOpen(false)}>
        <div className="start-chat-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1000 }}>
          <div className="modal-header">
            <h3>تفاصيل الإعلان</h3>
            <button className="modal-close" onClick={() => setDetailsOpen(false)}>✕</button>
          </div>
          <div className="modal-content">
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
              <div>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 10 }}>
                  {details.data.main_image_url ? (
                    <img src={details.data.main_image_url} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 6 }} />
                  ) : (
                    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>لا توجد صورة رئيسية</div>
                  )}
                </div>
                <div style={{ marginTop: 10, background: '#f1f5f9', borderRadius: 8, padding: 10 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>صور إضافية</div>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                    {(details.data.images_urls || []).map((u, i) => (
                      <img key={i} src={u} alt="" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                    ))}
                    {(!details.data.images_urls || details.data.images_urls.length === 0) && (
                      <div style={{ color: '#94a3b8' }}>لا توجد صور إضافية</div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{details.data.title || 'إعلان بدون عنوان'}</div>
                    <div style={{ background: '#0ea5e9', color: '#fff', padding: '4px 10px', borderRadius: 9999, fontSize: '0.8rem' }}>{details.data.category_name || details.data.category || '-'}</div>
                    <div style={{ background: '#10b981', color: '#fff', padding: '4px 10px', borderRadius: 9999, fontSize: '0.8rem' }}>{details.data.status || '-'}</div>
                    <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ background: '#fde68a', color: '#7c2d12', padding: '4px 10px', borderRadius: 9999, fontSize: '0.8rem' }}>{details.data.price || '-' } {details.data.currency || ''}</div>
                      <div style={{ background: '#e5e7eb', color: '#111827', padding: '4px 10px', borderRadius: 9999, fontSize: '0.8rem' }}>{details.data.plan_type || '-'}</div>
                    </div>
                  </div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>الوصف</div>
                  <div style={{ color: '#111827' }}>{details.data.description || '-'}</div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>البيانات</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                    <div><div style={{ color: '#64748b', fontSize: 12 }}>المعرف</div><div>{details.data.id}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: 12 }}>المشاهدات</div><div>{details.data.views}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: 12 }}>الترتيب</div><div>{details.data.rank}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: 12 }}>مُنشأ في</div><div>{formatDateHM(details.data.created_at)}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: 12 }}>آخر تحديث</div><div>{formatDateHM(details.data.updated_at)}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: 12 }}>ينتهي في</div><div>{formatDateHM(details.data.expire_at)}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: 12 }}>مدفوع</div><div>{details.data.isPayment ? 'نعم' : 'لا'}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: 12 }}>النشر عبر</div><div>{labelizePublishVia(details.data.publish_via)}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: 12 }}>كود الدولة</div><div>{details.data.country_code || '-'}</div></div>
                  </div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>الموقع والتواصل</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                    <div><div style={{ color: '#64748b', fontSize: 12 }}>المحافظة</div><div>{details.data.governorate || '-'}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: 12 }}>المدينة</div><div>{details.data.city || '-'}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: 12 }}>العنوان</div><div>{details.data.address || '-'}</div></div>
                    {/* <div><div style={{ color: '#64748b', fontSize: 12 }}>إحداثيات</div><div>{details.data.lat || '-'}, {details.data.lng || '-'}</div></div> */}
                    <div><div style={{ color: '#64748b', fontSize: 12 }}>هاتف التواصل</div><div style={{ whiteSpace: 'pre-wrap' }}>{details.data.contact_phone || '-'}</div></div>
                    <div></div>
                    <div><div style={{ color: '#64748b', fontSize: 12 }}>واتس آب</div><div style={{ whiteSpace: 'pre-wrap' }}>{details.data.whatsapp_phone || '-'}</div></div>
                  </div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>المواصفات</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {Object.entries(details.data.attributes || {}).map(([k, v]) => (
                      <div key={k} style={{ background: '#e5e7eb', padding: '6px 10px', borderRadius: 9999, fontSize: 13 }}>
                        {labelizeAttrKey(k)}: {v}
                      </div>
                    ))}
                    {Object.keys(details.data.attributes || {}).length === 0 && (
                      <div style={{ color: '#94a3b8' }}>لا توجد خصائص</div>
                    )}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>بيانات المستخدم</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                    <div><div style={{ color: '#64748b', fontSize: 12 }}>داخل الإعلان</div><div>{details.data.user?.name || '-'} (#{details.data.user?.id})</div></div>
                    <div><div style={{ color: '#64748b', fontSize: 12 }}>هاتف المستخدم</div><div>{details.data.user?.phone || '-'}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: 12 }}>المستخدم</div><div>{details.user?.name || '-'} (#{details.user?.id})</div></div>
                    <div><div style={{ color: '#64748b', fontSize: 12 }}>انضم في</div><div>{formatDateHM(details.user?.joined_at)}</div></div>
                    <div><div style={{ color: '#64748b', fontSize: 12 }}>منذ</div><div>{details.user?.joined_at_human || '-'}</div></div>
                  </div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>تعليق الإدمن</div>
                  <div style={{ color: '#111827' }}>{details.data.admin_comment || '-'}</div>
                </div>
              </div>
            </div>
          </div>
          {/* <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ color: '#64748b' }}>{details.message || ''}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" onClick={() => (window.location.href = `/ads/${details.data.id}`)}>فتح صفحة الإعلان</button>
              <button className="btn-secondary" onClick={() => setDetailsOpen(false)}>إغلاق</button>
            </div>
          </div> */}
        </div>
      </div>
    )}
    </>
  );
}
