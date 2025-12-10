"use client";

import { useState, useEffect } from "react";
import nextDynamic from 'next/dynamic';
import DateInput from "@/components/DateInput";
import ManagedSelect from '@/components/ManagedSelect';
import { ALL_CATEGORIES_OPTIONS, CATEGORY_LABELS_AR } from '@/constants/categories';
import { fetchAdminPublishedListings, deletePublishedListing, fetchListingDetails } from '@/services/publishedListings';
import { fetchAdminRejectedListings } from '@/services/rejectedListings';
import { fetchListingReports } from '@/services/reports';
import { PublishedListing, ListingAttribute, ListingImage } from '@/models/published';
import { PendingListingsMeta } from '@/models/listings';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  actions?: { label: string; variant?: 'primary' | 'secondary'; onClick?: () => void }[];
  duration?: number;
}

type AdRow = {
  id: number;
  status: string;
  category: string;
  categorySlug: string;
  createdDate: string;
  expiryDate: string;
  ownerCode: string;
  displayType: string;
  value: number;
  views: number;
};

const statusColors = {
  // "مسودة": "#9CA3AF",
  // "قيد المراجعة": "#FF5C23",
  "منشور": "#1BB28F",
  // "مرفوض": "#EF4444",
  // "منتهي": "#6B7280",
};

const planTypeLabel: Record<string, string> = { free: 'مجاني', standard: 'باقة ستاندر', featured: 'باقه مميزه' };
const normalizeStatusAr = (s: string) => {
  const v = String(s || '').trim().toLowerCase();
  if (v === 'valid' || v === 'published' || v === 'approved') return 'منشور';
  // if (v === 'pending') return 'قيد المراجعة';
  // if (v === 'rejected') return 'مرفوض';
  // if (v === 'expired') return 'منتهي';
  return s;
};

function AdsManagement() {
  const [ads, setAds] = useState<AdRow[]>([]);
  const [selectedAds, setSelectedAds] = useState<number[]>([]);
  const [meta, setMeta] = useState<PendingListingsMeta | null>(null);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [reportsCount, setReportsCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [allAds, setAllAds] = useState<AdRow[]>([]);
  const [allLoaded, setAllLoaded] = useState(false);
  const [codeSearch, setCodeSearch] = useState("");
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

  const normalizeDigits = (s: string) => s.replace(/[٠-٩]/g, (ch) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(ch)]);

  const showToast = (
    message: string,
    type: Toast['type'] = 'info',
    options?: { actions?: Toast['actions']; duration?: number }
  ) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type, actions: options?.actions, duration: options?.duration };
    setToasts(prev => [...prev, newToast]);
    const autoDuration = options?.duration ?? 4000;
    if (!newToast.actions && autoDuration > 0) {
      setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, autoDuration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };
  

  const CATEGORY_SLUG_BY_LABEL: Record<string, string> = Object.fromEntries(Object.entries(CATEGORY_LABELS_AR).map(([slug, label]) => [label, slug]));

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
    'أدوات': 'tools',
    'خدمات منزلية': 'home-services',
  };

  const resolveCategorySlug = (l: PublishedListing, label: string): string => {
    const direct = String(l.category_slug || '').trim();
    if (direct) return direct;
    const catField = String((l as unknown as { category?: string }).category || '').trim();
    if (catField && /^[a-z0-9\-_]+$/.test(catField)) return catField;
    const fromMap = CATEGORY_SLUG_BY_LABEL[label];
    if (fromMap) return fromMap;
    const syn = CATEGORY_SLUG_SYNONYMS[label];
    if (syn) return syn;
    return '';
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

  const mapListingToRow = (l: PublishedListing): AdRow => {
    const idVal = (typeof l.id === 'number' ? l.id : (typeof l.id === 'string' ? Number(l.id) : undefined));
    const id = typeof idVal === 'number' ? idVal : 0;
    const status = normalizeStatusAr(String(l.status || ''));
    const category = String(l.category_name || '').trim();
    const categorySlug = resolveCategorySlug(l, category);
    const createdDate = String(l.published_at || '').trim();
    const expiryDate = String(l.expire_at || '').trim();
    const ownerCode = l.advertiser_id ? String(l.advertiser_id) : String(l.advertiser_phone || '');
    const pt = String(l.plan_type || '').trim().toLowerCase();
    const displayType = planTypeLabel[pt] ?? (l.plan_type || '');
    const valueRaw = l.price;
    const value = typeof valueRaw === 'number' ? valueRaw : Number(valueRaw) || 0;
    const views = typeof l.views === 'number' ? l.views : 0;
    return { id, status, category, categorySlug, createdDate, expiryDate, ownerCode, displayType, value, views };
  };

  useEffect(() => {
    const load = async () => {
      try {
        const hasFilter = Boolean(statusFilter || categoryFilter || fromDate || toDate || codeSearch);
        if (hasFilter) return;
        const resp = await fetchAdminPublishedListings(currentPage, 20);
        setMeta(resp.meta);
        setAds(resp.listings.map(mapListingToRow));
      } catch {}
    };
    load();
  }, [currentPage, statusFilter, categoryFilter, fromDate, toDate, codeSearch]);

  useEffect(() => {
    const loadRejected = async () => {
      try {
        const resp = await fetchAdminRejectedListings(1);
        setRejectedCount(resp?.meta?.total ?? 0);
      } catch {}
    };
    loadRejected();
  }, []);

  useEffect(() => {
    const loadReportsCount = async () => {
      try {
        const resp = await fetchListingReports(1, 1);
        setReportsCount(resp?.meta?.total ?? (resp?.data?.length ?? 0));
      } catch {}
    };
    loadReportsCount();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (allLoaded) return;
      const last = meta?.last_page ?? 1;
      const per = meta?.per_page ?? 20;
      if (!last || last <= 1) {
        setAllAds(ads);
        setAllLoaded(true);
        return;
      }
      const pages = Array.from({ length: last }, (_, i) => i + 1);
      try {
        const results = await Promise.all(pages.map((p) => fetchAdminPublishedListings(p, per)));
        const combined = results.flatMap((r) => r.listings).map(mapListingToRow);
        setAllAds(combined);
        setAllLoaded(true);
      } catch {
        setAllAds(ads);
        setAllLoaded(true);
      }
    };
    run();
  }, [meta, ads]);

  const source = (allLoaded && allAds.length) ? allAds : ads;
  const mapOptions = new Map<string, string>();
  for (const ad of source) {
    const slug = (ad.categorySlug || ad.category || '').trim();
    const label = (ad.category || '').trim();
    if (slug) mapOptions.set(slug, label || slug);
  }
  const categoryOptions = Array.from(mapOptions.entries()).map(([value, label]) => ({ value, label }));

  // حساب عدد الإعلانات لكل قسم
  const getCategoryCount = (slug: string) => {
    const source = (allLoaded && allAds.length) ? allAds : ads;
    return source.filter(ad => (ad.categorySlug || ad.category || '').trim() === slug).length;
  };

  // حساب إجمالي الإعلانات
  const totalAdsCount = (allLoaded && allAds.length) ? allAds.length : (meta?.total ?? ads.length);

  const baseAds = (categoryFilter || fromDate || toDate || statusFilter || codeSearch) ? ((allLoaded && allAds.length) ? allAds : ads) : ads;
  const filteredAds = baseAds.filter((ad) => {
    const statusMatch = statusFilter ? ad.status === statusFilter : true;
    const categoryMatch = categoryFilter ? (ad.categorySlug === categoryFilter || ad.category === categoryFilter) : true;
    const fromMatch = fromDate ? new Date(ad.createdDate) >= new Date(fromDate) : true;
    const toMatch = toDate ? new Date(ad.createdDate) <= new Date(toDate) : true;
    const raw = codeSearch.trim();
    const norm = normalizeDigits(raw);
    const tokens = norm.split(/[\s,،]+/).filter(Boolean);
    const code = normalizeDigits(String(ad.ownerCode).trim());
    const codeMatch = tokens.length ? tokens.includes(code) : true;
    return statusMatch && categoryMatch && fromMatch && toMatch && codeMatch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, fromDate, toDate, codeSearch]);

  const hasFilter = Boolean(statusFilter || categoryFilter || fromDate || toDate || codeSearch);
  const perPage = meta?.per_page ?? 20;
  const totalPages = hasFilter ? Math.max(1, Math.ceil(filteredAds.length / perPage)) : Math.max(1, meta?.last_page ?? 1);
  const serverPage = currentPage;
  const serverTotal = hasFilter ? filteredAds.length : (meta?.total ?? filteredAds.length);
  const startIndex = (serverPage - 1) * perPage;
  const endIndex = hasFilter ? Math.min(startIndex + perPage, serverTotal) : (startIndex + filteredAds.length);
  const currentAds = hasFilter ? filteredAds.slice(startIndex, startIndex + perPage) : filteredAds;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAds(currentAds.map((ad) => ad.id));
    } else {
      // إزالة التحديد عن الصفوف الظاهرة فقط
      setSelectedAds((prev) => prev.filter((id) => !currentAds.some((ad) => ad.id === id)));
    }
  };

  const handleSelectAd = (adId: number, checked: boolean) => {
    if (checked) {
      setSelectedAds([...selectedAds, adId]);
    } else {
      setSelectedAds(selectedAds.filter((id) => id !== adId));
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "مسودة":
        return "status-draft";
      case "قيد المراجعة":
        return "status-pending";
      case "منشور":
        return "status-published";
      case "مرفوض":
        return "status-rejected";
      case "منتهي":
        return "status-expired";
      case "إيقاف مؤقت":
        return "status-expired";
      default:
        return "status-default";
    }
  };

  const addDays = (dateStr: string, days: number) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const handleBulkApprove = () => {
    setAds((prev) => prev.map((ad) => (selectedAds.includes(ad.id) ? { ...ad, status: "منشور" } : ad)));
    setSelectedAds([]);
  };

  const handleBulkReject = () => {
    setAds((prev) => prev.map((ad) => (selectedAds.includes(ad.id) ? { ...ad, status: "مرفوض" } : ad)));
    setSelectedAds([]);
  };

  const handleBulkExtend = () => {
    setAds((prev) =>
      prev.map((ad) => (selectedAds.includes(ad.id) ? { ...ad, expiryDate: addDays(ad.expiryDate, 30) } : ad))
    );
    setSelectedAds([]);
  };

  const handleBulkPause = () => {
    setAds((prev) => prev.map((ad) => (selectedAds.includes(ad.id) ? { ...ad, status: "إيقاف مؤقت" } : ad)));
    setSelectedAds([]);
  };

  const handleDeleteAd = async (adId: number, categorySlug: string) => {
    try {
      await deletePublishedListing(categorySlug, adId);
      setAds((prev) => prev.filter((ad) => ad.id !== adId));
      setSelectedAds((prev) => prev.filter((id) => id !== adId));
      showToast('تم حذف الإعلان', 'success');
    } catch (e) {
      const m = e as unknown;
      const msg = m && typeof m === 'object' && 'message' in m ? String((m as { message?: string }).message || '') : '';
      showToast(msg || 'تعذر حذف الإعلان', 'error');
    }
  };

  const confirmDelete = (adId: number, categorySlug: string) => {
    showToast('هل أنت متأكد من حذف هذا الإعلان؟', 'warning', {
      actions: [
        { label: 'حذف', variant: 'primary', onClick: () => handleDeleteAd(adId, categorySlug) },
        { label: 'إلغاء', variant: 'secondary' },
      ],
    });
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, serverPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (serverPage > 1) {
      buttons.push(
        <button
          key="prev"
          onClick={() => handlePageChange(serverPage - 1)}
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
          className={`pagination-btn ${serverPage === i ? 'active' : ''}`}
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
    if (serverPage < totalPages) {
      buttons.push(
        <button
          key="next"
          onClick={() => handlePageChange(serverPage + 1)}
          className="pagination-btn pagination-nav"
        >
          →
        </button>
      );
    }

    return buttons;
  };

  const fetchAdDetails = async (id: number, categoryLabel: string, categorySlug: string) => {
    setIsLoadingDetails(true);
    setSelectedAdDetails(null);
    setIsDetailsModalOpen(true);

    try {
      if (!id || id <= 0) throw new Error("Invalid Ad ID");

      // Use provided slug or resolve it
      let slug = categorySlug;
      if (!slug) {
         slug = CATEGORY_SLUG_BY_LABEL[categoryLabel] || '';
         if (!slug) {
             const syn = CATEGORY_SLUG_SYNONYMS[categoryLabel];
             if (syn) slug = syn;
         }
      }
      
      if (!slug) {
          throw new Error("Could not resolve category slug");
      }

      const details = await fetchListingDetails(slug, id);
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
      {/* Enhanced Header */}
      <div className="homepage-header">
        <div>
          <h1 className="welcome-title">إدارة الإعلانات</h1>
          <p className="welcome-subtitle">إدارة وتتبع جميع الإعلانات في النظام</p>
        </div>
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="value-primary">{serverTotal}</div>
            <div className="label">إجمالي الإعلانات</div>
          </div>
          {/* <div className="stat-card">
            <div className="value-secondary">{ads.filter(ad => ad.status === "قيد المراجعة").length}</div>
            <div className="label">قيد المراجعة</div>
          </div> */}
          <div 
            className="stat-card clickable-card" 
            onClick={() => window.location.href = '/ads/rejected'}
            style={{ cursor: 'pointer' }}
          >
            <div className="value-danger">{rejectedCount}</div>
            <div className="label">الإعلانات المرفوضة
              <div className="clickable-text" onClick={() => window.location.href = '/ads/rejected'}>
                اضغط للمشاهدة
              </div>
            </div>
          </div>
          <div 
            className="stat-card clickable-card" 
            onClick={() => window.location.href = '/ads/reports-review'}
            style={{ cursor: 'pointer' }}
          >
            <div className="value-secondary">{reportsCount}</div>
            <div className="label">مراجعة البلاغات
              <div className="clickable-text" onClick={() => window.location.href = '/ads/reports-review'}>
                اضغط للمراجعة
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filter Bar */}
      <div className="filter-bar">
        {/* <div className="filter-item">
          <label className="filter-label">🔍 البحث بالحالة</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
          >
            <option value="">كل الحالات</option>
            <option value="مسودة">مسودة</option>
            <option value="قيد المراجعة">قيد المراجعة</option>
            <option value="منشور">منشور</option>
            <option value="مرفوض">مرفوض</option>
            <option value="منتهي">منتهي</option>
          </select>
        </div> */}

        {/* <div className="filter-item">
          <label className="filter-label">📂 القسم</label>
          <ManagedSelect
            options={ALL_CATEGORIES_OPTIONS}
            value={categoryFilter}
            onChange={(v) => setCategoryFilter(v)}
            placeholder="كل الأقسام"
          />
        </div> */}
        <div className="filters-row">
           <label className="filter-label">📂 القسم</label>
                    <ManagedSelect
                      options={categoryOptions.length ? categoryOptions : ALL_CATEGORIES_OPTIONS}
                      value={categoryFilter}
                      onChange={(v) => setCategoryFilter(v)}
                      placeholder={`كل الأقسام (${totalAdsCount})`}
                      getCount={getCategoryCount}
                      className="category-select-wide"
                    />
                   
                  </div>
        <div className="filter-item">
          <label className="filter-label">🔢 كود المعلن</label>
          <input
            type="text"
            value={codeSearch}
            onChange={(e) => setCodeSearch(e.target.value)}
            placeholder="اكتب كود أو أكثر (افصل بمسافة/فاصلة)"
            className="form-input"
          />
        </div>

        <div className="filter-item">
          <label className="filter-label">📅 من تاريخ</label>
          <DateInput value={fromDate} onChange={(v) => setFromDate(v)} className="form-input" />
        </div>

        <div className="filter-item">
          <label className="filter-label">📅 إلى تاريخ</label>
          <DateInput value={toDate} onChange={(v) => setToDate(v)} className="form-input" />
        </div>
      </div>

      {/* Enhanced Bulk Actions */}
      {/* {selectedAds.length > 0 && (
        <div className="bulk-actions">
          <div className="count-pill">{selectedAds.length} إعلان محدد</div>
          <button className="btn-approve" onClick={handleBulkApprove}>✅ موافقة</button>
          <button className="btn-reject" onClick={handleBulkReject}>❌ رفض</button>
          <button className="btn-extend" onClick={handleBulkExtend}>⏰ تمديد</button>
          <button className="btn-pause" onClick={handleBulkPause}>إيقاف مؤقت</button>
        </div>
      )} */}

      {/* Results Info */}
      <div className="results-info">
        <span className="results-count">عرض {serverTotal > 0 ? (startIndex + 1) : 0} - {Math.min(endIndex, serverTotal)} من {serverTotal} إعلان</span>
        <span className="page-info">
          الصفحة {serverPage} من {totalPages}
        </span>
      </div>

      {/* Enhanced Ads Table */}
      <div className="table-container desktop-view">
        <table className="ads-table">
          <thead>
            <tr>
              {/* <th>
                <input
                  type="checkbox"
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  checked={currentAds.length > 0 && currentAds.every((ad) => selectedAds.includes(ad.id))}
                  className="accent-primary"
                />
              </th> */}
              <th>📊 الحالة</th>
              <th>📂 القسم</th>
              <th>📅 تاريخ الإنشاء</th>
              <th>⏰ تاريخ الانتهاء</th>
              <th>👤 كود المعلن</th>
              <th>🆔 رقم الإعلان</th>
              <th>🎯 نوع الظهور</th>
              <th>💰 القيمة</th>
              <th>�️ المشاهدات</th>
              {/* <th>🚨 البلاغات</th> */}
              <th>⚙️ إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {currentAds.map((ad, index) => (
              <tr 
                key={ad.id} 
                className="table-row"
              >
                {/* <td>
                  <input
                    type="checkbox"
                    checked={selectedAds.includes(ad.id)}
                    onChange={(e) => handleSelectAd(ad.id, e.target.checked)}
                    className="accent-primary"
                  />
                </td> */}
                <td>
                  <span className={`status-badge ${getStatusClass(ad.status)}`}>
                    {ad.status}
                  </span>
                </td>
                <td>{ad.category}</td>
                <td className="cell-muted">{formatDateDDMMYYYY(ad.createdDate)}</td>
                <td className="cell-muted">{formatDateDDMMYYYY(ad.expiryDate)}</td>
                <td>
                  <span className="owner-code-badge">{ad.ownerCode}</span>
                </td>
                <td className="ad-id">{ad.id}</td>
                <td>{ad.displayType}</td>
                <td>
                  <span className="value-strong">{ad.value} ج.م</span>
                </td>
                <td>
                  <span className={`views-badge ${ad.views > 1000 ? 'views-high' : 'views-low'}`}>
                    {ad.views.toLocaleString()}
                  </span>
                </td>
                {/* <td>
                  <span className={`reports-text ${ad.reports > 0 ? 'reports-has' : 'reports-none'}`}>
                    {ad.reports}
                  </span>
                </td> */}
                <td>
                  <div className="action-buttons ads-actions">
                    <button
                      className="btn-view"
                      onClick={() => fetchAdDetails(ad.id, ad.category, ad.categorySlug)}
                    >
                      عرض
                    </button>
                    <button
                      className="btn-delete"
                    onClick={() => { confirmDelete(ad.id, ad.categorySlug); }}
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="users-cards-container mobile-view">
        {currentAds.map((ad) => (
          <div key={ad.id} className="ad-card">
            <div className="ad-card-header">
              <div className="ad-card-meta">
                <span className={`status-badge ${getStatusClass(ad.status)}`}>{ad.status}</span>
                <span className="category-badge">{ad.category}</span>
              </div>
              <span className="owner-code-badge">{ad.ownerCode}</span>
            </div>
            <div className="ad-card-body">
              <div className="ad-card-field">
                <span className="ad-card-label">تاريخ الإنشاء</span>
                <span className="ad-card-value">{formatDateDDMMYYYY(ad.createdDate)}</span>
              </div>
              <div className="ad-card-field">
                <span className="ad-card-label">تاريخ الانتهاء</span>
                <span className="ad-card-value">{formatDateDDMMYYYY(ad.expiryDate)}</span>
              </div>
              <div className="ad-card-field">
                <span className="ad-card-label">نوع الظهور</span>
                <span className="ad-card-value">{ad.displayType}</span>
              </div>
              <div className="ad-card-field">
                <span className="ad-card-label">القيمة</span>
                <span className="ad-card-value">{ad.value} ج.م</span>
              </div>
              <div className="ad-card-field">
                <span className="ad-card-label">المشاهدات</span>
                <span className={`views-badge ${ad.views > 1000 ? 'views-high' : 'views-low'}`}>{ad.views.toLocaleString()}</span>
              </div>
              {/* <div className="ad-card-field">
                <span className="ad-card-label">البلاغات</span>
                <span className={`reports-text ${ad.reports > 0 ? 'reports-has' : 'reports-none'}`}>{ad.reports}</span>
              </div> */}
            </div>
            <div className="ad-card-actions">
              <button
                className="btn-view"
                onClick={() => fetchAdDetails(ad.id, ad.category, ad.categorySlug)}
              >
                عرض
              </button>
              <button
                className="btn-delete"
                onClick={() => { confirmDelete(ad.id, ad.categorySlug || ad.category); }}
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            <span>إجمالي {serverTotal} إعلان في {totalPages} صفحة</span>
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
              value={serverPage}
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
          <h3>لا توجد إعلانات</h3>
          <p>لم يتم العثور على إعلانات تطابق المعايير المحددة</p>
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
                تفاصيل الإعلان {selectedAdDetails?.id ? `#${selectedAdDetails.id}` : ''}
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
                              style={{ aspectRatio: '1', borderRadius: '4px', overflow: 'hidden', border: `2px solid ${currentImageUrl === url ? '#10b981' : '#e5e7eb'}`, cursor: 'pointer' }}
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
                        <div style={{ fontSize: '1.25rem', color: '#059669', fontWeight: 'bold' }}>
                            {selectedAdDetails.price ? `${Number(selectedAdDetails.price).toLocaleString()} ${selectedAdDetails.currency || 'ج.م'}` : 'غير محدد'}
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
                        <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>باقة العرض</span><span style={{ color: '#111827', fontWeight: '500' }}>{planTypeLabel[String(selectedAdDetails.plan_type || '').toLowerCase()] || selectedAdDetails.plan_type || '-'}</span></div>
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

export default nextDynamic(() => Promise.resolve(AdsManagement), { ssr: false });
  const ATTRIBUTE_LABELS_AR: Record<string, string> = ({
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
  });

  const translateAttributeKey = (key: string): string => {
    const k = String(key || '').trim();
    return ATTRIBUTE_LABELS_AR[k] || k.replace(/_/g, ' ');
  };
 
