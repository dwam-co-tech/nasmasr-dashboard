"use client";

import { useState, useEffect } from "react";
import nextDynamic from 'next/dynamic';
import DateInput from "@/components/DateInput";
import ManagedSelect from '@/components/ManagedSelect';
import { ALL_CATEGORIES, CATEGORY_LABELS_AR } from '@/constants/categories';
import "../../back-button.css";
import { fetchAdminRejectedListings, reopenRejectedListing } from '@/services/rejectedListings';
import { fetchListingDetails } from '@/services/publishedListings';
import { deletePublishedListing } from '@/services/publishedListings';
import type { RejectedListing } from '@/models/rejected';
import type { PublishedListing } from '@/models/published';
import type { PendingListingsMeta } from '@/models/listings';

function RejectedAds() {
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning'; actions?: { label: string; variant?: 'primary' | 'secondary'; onClick?: () => void }[]; duration?: number }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sectionFilter, setSectionFilter] = useState("");
  const [rejectedByFilter, setRejectedByFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [codeSearch, setCodeSearch] = useState("");

  const [ads, setAds] = useState<RejectedListing[]>([]);
  const [meta, setMeta] = useState<PendingListingsMeta>({ page: 1, per_page: 0, total: 0, last_page: 1 });
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAdDetails, setSelectedAdDetails] = useState<PublishedListing | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const splitDateTime = (input?: string | null) => {
    const s = String(input || '').trim();
    if (!s) return { date: '-', time: '' };
    const d = new Date(s);
    if (isNaN(d.getTime())) return { date: s, time: '' };
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return { date: `${dd}-${mm}-${yyyy}`, time: `${hh}:${mi}` };
  };
  const renderDateTime = (input?: string | null) => {
    const { date, time } = splitDateTime(input);
    return (<><span>{date}</span><br /><span>{time}</span></>);
  };

  const formatDateDDMMYYYY = (s?: string | null) => {
    const t = String(s || '').trim();
    if (!t) return '-';
    const m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return t;
    return `${m[3]}-${m[2]}-${m[1]}`;
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', options?: { actions?: { label: string; variant?: 'primary' | 'secondary'; onClick?: () => void }[]; duration?: number }) => {
    const id = Date.now().toString();
    const t = { id, message, type, actions: options?.actions, duration: options?.duration };
    setToasts(prev => [...prev, t]);
    const d = options?.duration ?? 4000;
    if (!t.actions && d > 0) {
      setTimeout(() => { setToasts(prev => prev.filter(x => x.id !== id)); }, d);
    }
  };
  const removeToast = (id: string) => { setToasts(prev => prev.filter(x => x.id !== id)); };

  const CATEGORY_SLUG_BY_LABEL: Record<string, string> = (() => {
    const map: Record<string, string> = {};
    for (const [slug, label] of Object.entries(CATEGORY_LABELS_AR)) {
      map[label] = slug;
    }
    return map;
  })();

  const CATEGORY_SLUG_SYNONYMS: Record<string, string> = {
    'قطع غيار سيارات': 'spare-parts',
    'قطع غيار': 'spare-parts',
    'جيمات': 'gym',
    'رياضة': 'gym',
    'مواد البناء والتشطيبات': 'construction',
    'مقاولات': 'construction',
    'الصيانه العامه': 'maintenance',
    'صيانة': 'maintenance',
    'عددو مستلزمات': 'tools',
    'عددومستلزمات': 'tools',
    'أدوات': 'tools',
    'خدمات منزلية': 'home-services',
  };

  const CATEGORY_NAME_TO_SLUG: Record<string, string> = {
    'العقارات': 'real_estate',
    'المتاجر والمولات': 'stores',
    'المطاعم': 'restaurants',
    'محلات غذائيه': 'groceries',
    'منتجات غذائيه': 'food-products',
    'ادوات منزليه': 'home-tools',
    'اثاث ومفروشات': 'furniture',
    'الصحه': 'health',
    'التعليم': 'education',
    'الشحن والتوصيل': 'shipping',
    'الملابس الرجاليه والاحذيه': 'mens-clothes',
    'الساعات والمجوهرات': 'watches-jewelry',
    'المهن الحره والخدمات': 'free-professions',
    ' مستلزمات ولعب الاطفال': 'kids-toys',
    'مستلزمات ولعب الاطفال': 'kids-toys',
    'جيمات': 'gym',
    'مواد البناء والتشطيبات': 'construction',
    'الصيانه العامه': 'maintenance',
    'خدمات وصيانه السيارات': 'car-services',
    'خدمات وصيانه المنازل': 'home-services',
    'الإضاءه والديكور': 'lighting-decor',
    'طيور وحيوانات': 'animals',
    'منتجات مزارع ومصانع': 'farm-products',
    'بيع الجمله': 'wholesale',
    'مواد وخطوط الانتاج': 'production-lines',
    ' دراجات ومركبات خفيفه': 'light-vehicles',
    'دراجات ومركبات خفيفه': 'light-vehicles',
    'عددومستلزمات': 'tools',
    'الاجهزه المنزليه': 'home-appliances',
    'مفقودين': 'missing',
  };

  const resolveCategorySlug = (label: string): string => {
    const l = String(label || '').trim();
    if (!l) return '';
    const nameMap = CATEGORY_NAME_TO_SLUG[l];
    if (nameMap) return nameMap;
    const fromMap = CATEGORY_SLUG_BY_LABEL[l];
    if (fromMap) return fromMap;
    const syn = CATEGORY_SLUG_SYNONYMS[l];
    if (syn) return syn;
    return '';
  };

  const ATTRIBUTE_LABELS_AR: Record<string, string> = {
    year: 'سنة الصنع',
    kilometers: 'عدد الكيلومترات',
    fuel_type: 'نوع الوقود',
    transmission: 'ناقل الحركة',
    exterior_color: 'اللون الخارجي',
    color: 'اللون',
    type: 'النوع',
    property_type: 'نوع العقار',
    contract_type: 'نوع التعاقد',
    area: 'المساحة',
    rooms: 'عدد الغرف',
    bathrooms: 'عدد الحمامات',
    floor: 'الدور',
    furnished: 'مفروش',
    make: 'الماركة',
    model: 'الموديل',
    engine: 'المحرك',
    engine_capacity: 'سعة المحرك',
    body_type: 'نوع الهيكل',
    drive_type: 'نظام الدفع',
    seller_type: 'نوع البائع',
    warranty: 'الضمان',
    size: 'المقاس',
    brand: 'الماركة',
    material: 'الخامة',
    length: 'الطول',
    width: 'العرض',
    height: 'الارتفاع',
    condition: 'الحالة',
    address: 'العنوان',
  };

  const translateAttributeKey = (key: string): string => {
    const k = String(key || '').trim();
    return ATTRIBUTE_LABELS_AR[k] || k.replace(/_/g, ' ');
  };

  useEffect(() => {
    if (!selectedAdDetails) {
      setCurrentImageUrl(null);
      return;
    }
    const urls: string[] = [];
    const main = String(selectedAdDetails.main_image_url || '').trim();
    if (main) urls.push(main);
    const arr = Array.isArray(selectedAdDetails.images_urls) ? selectedAdDetails.images_urls : [];
    for (const u of arr) { if (u) urls.push(String(u).trim()); }
    const imgs = Array.isArray(selectedAdDetails.images) ? selectedAdDetails.images : [];
    for (const im of imgs) { if (im?.url) urls.push(String(im.url).trim()); }
    const unique = Array.from(new Set(urls.filter(Boolean)));
    setCurrentImageUrl(unique[0] || null);
  }, [selectedAdDetails]);

  useEffect(() => {
    fetchAdminRejectedListings(currentPage)
      .then(({ meta, listings }) => {
        setMeta(meta);
        setAds(Array.isArray(listings) ? listings : []);
      })
      .catch(() => {});
  }, [currentPage]);

  const filteredAds = ads.filter((ad) => {
    const sectionMatch = sectionFilter ? ad.category_name === sectionFilter : true;
    const rejectedByMatch = rejectedByFilter ? ad.rejected_by === rejectedByFilter : true;
    const fromMatch = fromDate ? (ad.created_at ? new Date(ad.created_at) >= new Date(fromDate) : false) : true;
    const toMatch = toDate ? (ad.expire_at ? new Date(ad.expire_at) <= new Date(toDate) : false) : true;
    const term = codeSearch.trim().toLowerCase();
    const codeMatch = term ? String(ad.advertiser_id ?? ad.advertiser_phone ?? '').toLowerCase().includes(term) : true;
    return sectionMatch && rejectedByMatch && fromMatch && toMatch && codeMatch;
  });

  const totalPages = meta.last_page || 1;
  const startIndex = (meta.page - 1) * (meta.per_page || filteredAds.length);
  const endIndex = startIndex + filteredAds.length;
  const currentAds = filteredAds;

  const uniqueRejectedBy = [...new Set(ads.map(ad => ad.rejected_by).filter(Boolean))] as string[];

  const handleDeleteAd = async (ad: RejectedListing) => {
    const id = ad.id;
    const rawSlug = (ad as unknown as { category?: string; category_slug?: string }).category || (ad as unknown as { category?: string; category_slug?: string }).category_slug || '';
    const directSlug = /^[a-z0-9\-_]+$/.test(String(rawSlug).trim()) ? String(rawSlug).trim() : '';
    const mappedSlug = resolveCategorySlug(ad.category_name || rawSlug || '');
    const candidatesBase = [directSlug, mappedSlug].filter(Boolean);
    const candidates: string[] = [];
    for (const s of candidatesBase) {
      const snake = s.replace(/-/g, '_');
      const kebab = s.replace(/_/g, '-');
      candidates.push(s, snake, kebab);
    }
    const uniqueCandidates = Array.from(new Set(candidates.filter((x) => x && /^[a-z0-9\-_]+$/.test(x))));
    if (!id || uniqueCandidates.length === 0) {
      showToast('تعذر تحديد قسم الإعلان للحذف', 'error');
      return;
    }
    let deleted = false;
    let lastError = '';
    for (const s of uniqueCandidates) {
      try {
        await deletePublishedListing(s, id!);
        deleted = true;
        break;
      } catch (e) {
        const m = e as unknown;
        const msg = m && typeof m === 'object' && 'message' in m ? String((m as { message?: string }).message || '') : '';
        lastError = msg || lastError;
        continue;
      }
    }
    if (deleted) {
      setAds(prev => prev.filter(a => a.id !== id));
      setMeta(prev => ({ ...prev, total: Math.max(0, (prev.total || 0) - 1), per_page: Math.max(0, (prev.per_page || 0) - 1) }));
      showToast('تم حذف الإعلان', 'success');
    } else {
      showToast(lastError || 'تعذر حذف الإعلان', 'error');
    }
  };
  const confirmDelete = (ad: RejectedListing) => {
    showToast('هل أنت متأكد من حذف هذا الإعلان؟', 'warning', {
      actions: [
        { label: 'حذف', variant: 'primary', onClick: () => handleDeleteAd(ad) },
        { label: 'إلغاء', variant: 'secondary' },
      ],
      duration: 0,
    });
  };

  const handleReopenAd = async (ad: RejectedListing) => {
    const id = ad.id ?? (ad as unknown as { listing_id?: number | string | null }).listing_id ?? (ad as unknown as { listingId?: number | string | null }).listingId ?? null;
    if (!id) {
      showToast('تعذر تحديد الإعلان لإعادة فتحه', 'error');
      return;
    }
    try {
      await reopenRejectedListing(id);
      setAds(prev => prev.filter(a => a.id !== id));
      setMeta(prev => ({ ...prev, total: Math.max(0, (prev.total || 0) - 1), per_page: Math.max(0, (prev.per_page || 0) - 1) }));
      showToast('تم إعادة فتح الإعلان للمراجعة', 'success');
    } catch (e) {
      const m = e as unknown;
      const msg = m && typeof m === 'object' && 'message' in m ? String((m as { message?: string }).message || '') : '';
      showToast(msg || 'تعذر إعادة فتح الإعلان للمراجعة', 'error');
    }
  };
  const confirmReopen = (ad: RejectedListing) => {
    showToast('هل تريد إعادة فتح هذا الإعلان للمراجعة؟', 'warning', {
      actions: [
        { label: 'إعادة فتح', variant: 'primary', onClick: () => handleReopenAd(ad) },
        { label: 'إلغاء', variant: 'secondary' },
      ],
      duration: 0,
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (currentPage > 1) {
      buttons.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="pagination-btn pagination-nav"
        >
          ←
        </button>
      );
    }

    // First page
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="pagination-btn"
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(<span key="dots1" className="pagination-dots">...</span>);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="dots2" className="pagination-dots">...</span>);
      }
      buttons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="pagination-btn"
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      buttons.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="pagination-btn pagination-nav"
        >
          →
        </button>
      );
    }

    return buttons;
  };

  const fetchAdDetails = async (ad: RejectedListing) => {
    setIsLoadingDetails(true);
    setSelectedAdDetails(null);
    setIsDetailsModalOpen(true);

    try {
      if (!ad.id) throw new Error("Invalid Ad ID");

      const rawSlug = (ad as any).category_slug || (ad as any).category || '';
      let slug = rawSlug;
      if (!slug || !/^[a-z0-9\-_]+$/.test(slug)) {
          slug = resolveCategorySlug(ad.category_name || '');
      }
      
      if (!slug) throw new Error("Could not resolve category slug");

      const details = await fetchListingDetails(slug, ad.id);
      setSelectedAdDetails(details);
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : 'تعذر تحميل تفاصيل الإعلان';
      showToast(`خطأ: ${msg}`, 'error');
      setIsDetailsModalOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedAdDetails(null);
  };

  return (
    <div className="page-container">
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <div className="toast-header">
              <span className="toast-icon">{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : 'ℹ'}</span>
              <span className="toast-message">{t.message}</span>
              <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.5 }}>×</button>
            </div>
            {t.actions && (
              <div className="toast-actions">
                {t.actions.map((a, i) => (
                  <button key={i} className={`toast-action-btn toast-action-${a.variant || 'primary'}`} onClick={() => { a.onClick?.(); removeToast(t.id); }}>
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Enhanced Header */}
      <div className="rejected-ads-header">
        <div className="header-content">
          <div className="title-section">
            <button 
              className="back-button"
              onClick={() => window.location.href = '/ads'}
              title="العودة لإدارة الإعلانات"
            >
              ← العودة
            </button>
            {/* <div className="title-icon">🚫</div> */}
            <div>
              <h1 className="page-title">الإعلانات المرفوضة</h1>
              <p className="page-subtitle">إدارة ومراجعة الإعلانات التي تم رفضها</p>
            </div>
          </div>
          <div className="stats-section">
            <div className="stat-card rejected-ads-card" style={{ backgroundColor: "#dc3545" }}>
              <span className="stat-number">{meta.total}</span>
              <span className="stat-label">إجمالي المرفوضة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filter Bar */}
      <div className="filter-bar">
        <div className="filter-item">
          <label className="filter-label">📂 القسم</label>
          <ManagedSelect
            value={sectionFilter}
            onChange={(v) => setSectionFilter(v)}
            options={ALL_CATEGORIES}
            placeholder="كل الأقسام"
          />
        </div>

        <div className="filter-item">
          <label className="filter-label">👤 من قام بالرفض</label>
          <ManagedSelect
            value={rejectedByFilter}
            onChange={(v) => setRejectedByFilter(v)}
            options={uniqueRejectedBy}
            placeholder="كل المراجعين"
          />
        </div>

        <div className="filter-item">
          <label className="filter-label">📅 من تاريخ</label>
          <DateInput
            value={fromDate}
            onChange={(v) => setFromDate(v)}
            className="form-input"
          />
        </div>

        <div className="filter-item">
          <label className="filter-label">📅 إلى تاريخ</label>
          <DateInput
            value={toDate}
            onChange={(v) => setToDate(v)}
            className="form-input"
          />
        </div>
        <div className="filter-item">
          <label className="filter-label">🔎 بحث بكود المعلن</label>
          <input
            type="text"
            className="form-input"
            placeholder="مثال: USR001"
            value={codeSearch}
            onChange={(e) => setCodeSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Results Info */}
      <div className="results-info">
        <span className="results-count">
          عرض {startIndex + 1} - {Math.min(endIndex, filteredAds.length)} من {filteredAds.length} إعلان مرفوض
        </span>
        <span className="page-info">
          الصفحة {currentPage} من {totalPages}
        </span>
      </div>

      {/* Enhanced Rejected Ads Table */}
      <div className="table-container desktop-view">
        <table className="rejected-ads-table">
          <thead>
            <tr>
              <th>📂 القسم</th>
              <th>📅 تاريخ الإنشاء</th>
              <th>⏰ تاريخ الانتهاء</th>
              <th>👤 كود المعلن</th>
              <th>🆔 رقم الإعلان</th>
              <th>🚫 سبب الرفض</th>
              <th>👨‍💼 من قام بالرفض</th>
              <th>⚙️ إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {currentAds.map((ad, index) => (
              <tr key={`rej-${index}`} className="table-row">
                <td>
                  <span className="category-badge">{ad.category_name}</span>
                </td>
                <td className="cell-muted">{formatDateDDMMYYYY(ad.created_at)}</td>
                <td className="cell-muted">{ad.expire_at ? formatDateDDMMYYYY(ad.expire_at) : 'قيد الانتظار'}</td>
                <td>
                  <span className="owner-code-badge">{ad.advertiser_id ?? ad.advertiser_phone ?? '-'}</span>
                </td>
                <td className="ad-id">{ad.id}</td>
                <td>
                  <span className="rejection-reason">{ad.rejection_reason}</span>
                </td>
                <td>
                  <span className="reviewer-name">{ad.rejected_by}</span>
                </td>
                <td>
                  <div className="action-buttons">
                <button
                  className="btn-view"
                  onClick={() => fetchAdDetails(ad)}
                  title="عرض التفاصيل"
                >
                  عرض
                </button>
                <button
                  className="btn-delete"
                  onClick={() => confirmDelete(ad)}
                  title="حذف الإعلان"
                >
                  حذف
                </button>
                <button
                  className="btn-reconsider"
                  onClick={() => confirmReopen(ad)}
                  title="إعادة النظر"
                >
                  🔄
                </button>
               
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="users-cards-container mobile-view">
        {currentAds.map((ad, index) => (
          <div key={`rej-${index}`} className="ad-card">
            <div className="ad-card-header">
              <div className="ad-card-meta">
                <span className="status-badge rejected">مرفوض</span>
                <span className="category-badge">{ad.category_name}</span>
              </div>
              <span className="owner-code-badge">{ad.advertiser_id ?? ad.advertiser_phone ?? '-'}</span>
            </div>
            <div className="ad-card-body">
              <div className="ad-card-field">
                <span className="ad-card-label">تاريخ الإنشاء</span>
                <span className="ad-card-value">{formatDateDDMMYYYY(ad.created_at)}</span>
              </div>
              <div className="ad-card-field">
                <span className="ad-card-label">تاريخ الانتهاء</span>
                <span className="ad-card-value">{ad.expire_at ? formatDateDDMMYYYY(ad.expire_at) : 'قيد الانتظار'}</span>
              </div>
              <div className="ad-card-field">
                <span className="ad-card-label">سبب الرفض</span>
                <span className="ad-card-value">{ad.rejection_reason}</span>
              </div>
              <div className="ad-card-field">
                <span className="ad-card-label">من قام بالرفض</span>
                <span className="ad-card-value">{ad.rejected_by}</span>
              </div>
            </div>
            <div className="ad-card-actions">
              <button
                className="btn-view"
                onClick={() => fetchAdDetails(ad)}
                title="عرض التفاصيل"
              >
                عرض
              </button>
              <button
                className="btn-delete"
                onClick={() => confirmDelete(ad)}
                title="حذف الإعلان"
              >
                حذف
              </button>
              <button className="btn-reconsider" onClick={() => confirmReopen(ad)} title="إعادة النظر">🔄</button>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            <span>إجمالي {meta.total} إعلان في {totalPages} صفحة</span>
          </div>
          <div className="pagination">
            {renderPaginationButtons()}
          </div>
          <div className="pagination-jump">
            <span>الانتقال إلى الصفحة:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  handlePageChange(page);
                }
              }}
              className="page-jump-input"
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredAds.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>لا توجد إعلانات مرفوضة</h3>
          <p>لم يتم العثور على إعلانات مرفوضة تطابق المعايير المحددة</p>
        </div>
      )}
      {/* Details Modal */}
      {isDetailsModalOpen && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()} style={{
              background: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '900px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                تفاصيل الإعلان المرفوض {selectedAdDetails?.id ? `#${selectedAdDetails.id}` : ''}
              </h3>
              <button 
                className="modal-close" 
                onClick={closeDetailsModal}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content" style={{ padding: '0', overflowY: 'auto', flex: 1 }}>
              {isLoadingDetails ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                  جاري التحميل...
                </div>
              ) : selectedAdDetails ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0' }}>
                  {/* Images Section - Left/Top */}
                  <div style={{ padding: '1.5rem', background: '#f9fafb', borderLeft: '1px solid #e5e7eb' }}>
                    {currentImageUrl ? (
                      <div style={{ marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                        <img src={currentImageUrl} alt="Main" style={{ width: '100%', height: 'auto', display: 'block' }} />
                      </div>
                    ) : (
                      <div style={{ padding: '2rem', textAlign: 'center', background: '#e5e7eb', borderRadius: '8px', marginBottom: '1rem' }}>لا توجد صورة</div>
                    )}

                    {(() => {
                      const urls: string[] = [];
                      const main = String(selectedAdDetails?.main_image_url || '').trim();
                      if (main) urls.push(main);
                      const arr = Array.isArray(selectedAdDetails?.images_urls) ? selectedAdDetails!.images_urls! : [];
                      for (const u of arr) { if (u) urls.push(String(u).trim()); }
                      const imgs = Array.isArray(selectedAdDetails?.images) ? selectedAdDetails!.images! : [];
                      for (const im of imgs) { if (im?.url) urls.push(String(im.url).trim()); }
                      const unique = Array.from(new Set(urls.filter(Boolean)));
                      if (!unique.length) return null;
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                          {unique.map((url, i) => (
                            <div
                              key={i}
                              onClick={() => setCurrentImageUrl(url)}
                              style={{ aspectRatio: '1', borderRadius: '4px', overflow: 'hidden', border: `2px solid ${currentImageUrl === url ? '#ef4444' : '#e5e7eb'}`, cursor: 'pointer' }}
                            >
                              <img src={url} alt="Gallery" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Info Section - Right/Bottom */}
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#111827' }}>
                            {selectedAdDetails.title || selectedAdDetails.category_name || 'بدون عنوان'}
                        </h2>
                        <div style={{ fontSize: '1.25rem', color: '#dc2626', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            {selectedAdDetails.price ? `${Number(selectedAdDetails.price).toLocaleString()} ${selectedAdDetails.currency || 'ج.م'}` : 'غير محدد'}
                        </div>
                         {/* Rejection Reason Highlight */}
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '1rem', color: '#991b1b' }}>
                            <strong>سبب الرفض: </strong> 
                            {selectedAdDetails.rejection_reason || 'غير محدد'}
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>الوصف</h4>
                        <p style={{ color: '#4b5563', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                            {selectedAdDetails.description || 'لا يوجد وصف متاح'}
                        </p>
                    </div>
                    
                    {selectedAdDetails.attributes && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>المواصفات</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                {Array.isArray(selectedAdDetails.attributes)
                                  ? selectedAdDetails.attributes.map(attr => (
                                      <div key={attr.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f3f4f6', borderRadius: '6px', fontSize: '0.875rem' }}>
                                        <span style={{ color: '#6b7280' }}>{attr.name}</span>
                                        <span style={{ fontWeight: '500', color: '#111827' }}>{attr.value}</span>
                                      </div>
                                    ))
                                  : Object.entries(selectedAdDetails.attributes as Record<string, string>).map(([k, v]) => (
                                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f3f4f6', borderRadius: '6px', fontSize: '0.875rem' }}>
                                        <span style={{ color: '#6b7280' }}>{translateAttributeKey(k)}</span>
                                        <span style={{ fontWeight: '500', color: '#111827' }}>{v}</span>
                                      </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                        <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>القسم</span><span style={{ color: '#111827', fontWeight: '500' }}>{selectedAdDetails.category_name || selectedAdDetails.category || '-'}</span></div>
                        <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>المدينة</span><span style={{ color: '#111827', fontWeight: '500' }}>{selectedAdDetails.governorate || ''}{selectedAdDetails.city ? ` - ${selectedAdDetails.city}` : ''}</span></div>
                        <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>العنوان</span><span style={{ color: '#111827', fontWeight: '500' }}>{selectedAdDetails.address || '-'}</span></div>
                        <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>الإحداثيات</span><span style={{ color: '#111827', fontWeight: '500' }}>{selectedAdDetails.lat || '-'}{selectedAdDetails.lng ? ` , ${selectedAdDetails.lng}` : ''}</span></div>
                        <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>الهاتف</span><span style={{ color: '#111827', fontWeight: '500' }}>{selectedAdDetails.contact_phone || '-'}</span></div>
                        <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>واتساب</span><span style={{ color: '#111827', fontWeight: '500' }}>{selectedAdDetails.whatsapp_phone || '-'}</span></div>
                        <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>باقة العرض</span><span style={{ color: '#111827', fontWeight: '500' }}>{String(selectedAdDetails.plan_type || '')}</span></div>
                        <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>الحالة</span><span style={{ color: '#111827', fontWeight: '500' }}>{selectedAdDetails.status || '-'}</span></div>
                        <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>المشاهدات</span><span style={{ color: '#111827', fontWeight: '500' }}>{typeof selectedAdDetails.views === 'number' ? selectedAdDetails.views : '-'}</span></div>
                        <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>تاريخ الإنشاء</span><span style={{ color: '#111827', fontWeight: '500' }}>{renderDateTime(selectedAdDetails.created_at)}</span></div>
                        <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>تاريخ النشر</span><span style={{ color: '#111827', fontWeight: '500' }}>{renderDateTime(selectedAdDetails.published_at)}</span></div>
                        <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>آخر تحديث</span><span style={{ color: '#111827', fontWeight: '500' }}>{renderDateTime(selectedAdDetails.updated_at)}</span></div>
                        <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>تاريخ الانتهاء</span><span style={{ color: '#111827', fontWeight: '500' }}>{renderDateTime(selectedAdDetails.expire_at)}</span></div>
                        <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>الماركة</span><span style={{ color: '#111827', fontWeight: '500' }}>{selectedAdDetails.make || '-'}</span></div>
                        <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>الموديل</span><span style={{ color: '#111827', fontWeight: '500' }}>{selectedAdDetails.model || '-'}</span></div>
                        <div style={{ gridColumn: '1 / -1' }}><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>ملاحظات الإدارة</span><span style={{ color: '#111827', fontWeight: '500' }}>{selectedAdDetails.admin_comment || '-'}</span></div>
                    </div>
                    {selectedAdDetails.user_ext && (
                      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
                        <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>اسم المعلن</span><span style={{ color: '#111827', fontWeight: '500' }}>{selectedAdDetails.user_ext?.name || selectedAdDetails.user?.name || '-'}</span></div>
                        <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>انضم</span><span style={{ color: '#111827', fontWeight: '500' }}>{selectedAdDetails.user_ext?.joined_at_human || selectedAdDetails.user_ext?.joined_at || '-'}</span></div>
                        <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>عدد إعلاناته</span><span style={{ color: '#111827', fontWeight: '500' }}>{typeof selectedAdDetails.user_ext?.listings_count === 'number' ? selectedAdDetails.user_ext?.listings_count : '-'}</span></div>
                        <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>معرّف المعلن</span><span style={{ color: '#111827', fontWeight: '500' }}>{selectedAdDetails.user_ext?.id || selectedAdDetails.user?.id || '-'}</span></div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>
                  لم يتم العثور على تفاصيل لهذا الإعلان
                </div>
              )}
            </div>
            
            <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', background: '#f9fafb', borderRadius: '0 0 12px 12px' }}>
              <button 
                className="btn-primary" 
                onClick={closeDetailsModal}
                style={{ 
                    padding: '0.5rem 1rem', 
                    background: '#2563eb', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer', 
                    fontWeight: '500' 
                }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default nextDynamic(() => Promise.resolve(RejectedAds), { ssr: false });
