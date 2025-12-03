"use client";

import ManagedSelect from '@/components/ManagedSelect';
import { ALL_CATEGORIES } from '@/constants/categories';
import { useMemo, useState, useEffect } from "react";

type ReportItem = { reason: string; submittedBy: string; submittedAt: string };
type ReportedAd = {
  id: number;
  title: string;
  status: string;
  category: string;
  ownerCode: string;
  createdDate: string;
  reports: ReportItem[];
};

const reasonsPool = [
  "محتوى مخالف",
  "سعر غير واقعي",
  "وصف مضلل",
  "صور غير مناسبة",
  "تصنيف خاطئ",
  "تكرار الإعلان",
];

const categoriesPool = [
  "عقارات",
  "سيارات",
  "وظائف",
  "خدمات",
  "إلكترونيات",
  "أزياء",
];

const initialReportedAds: ReportedAd[] = Array.from({ length: 16 }, (_, i) => {
  const id = i + 1;
  const reportsCount = Math.floor(Math.random() * 3) + 1;
  const reports: ReportItem[] = Array.from({ length: reportsCount }, () => {
    const reason = reasonsPool[Math.floor(Math.random() * reasonsPool.length)];
    const submittedBy = `USR${String(Math.floor(Math.random() * 900) + 100)}`;
    const submittedAt = new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000)
      .toISOString()
      .slice(0, 10);
    return { reason, submittedBy, submittedAt };
  });
  return {
    id,
    title: `إعلان رقم ${id}`,
    status: ["منشور", "قيد المراجعة"][Math.floor(Math.random() * 2)],
    category: categoriesPool[Math.floor(Math.random() * categoriesPool.length)],
    ownerCode: `OWN${String(id).padStart(3, "0")}`,
    value: Math.floor(Math.random() * 5000) + 200,
    createdDate: new Date(Date.now() - Math.floor(Math.random() * 20) * 86400000)
      .toISOString()
      .slice(0, 10),
    reports,
  };
});

export default function ReportsReviewPage() {
  const [ads, setAds] = useState<ReportedAd[]>(initialReportedAds);
  const [reasonFilter, setReasonFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const uniqueReasons = useMemo(() => {
    const set = new Set<string>();
    ads.forEach((ad) => ad.reports.forEach((r) => set.add(r.reason)));
    return Array.from(set);
  }, [ads]);

  const filteredAds = ads.filter((ad) => {
    const hasReason = reasonFilter ? ad.reports.some((r) => r.reason === reasonFilter) : true;
    const matchesCategory = categoryFilter ? ad.category === categoryFilter : true;
    const matchesStatus = statusFilter ? ad.status === statusFilter : true;
    const matchesSearch = searchTerm
      ? ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.ownerCode.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return hasReason && matchesCategory && matchesStatus && matchesSearch;
  });

  

  const totalPages = Math.ceil(filteredAds.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentAds = filteredAds.slice(startIndex, endIndex);

  const approveReport = (adId: number) => {
    setAds((prev) => prev.map((a) => (a.id === adId ? { ...a, status: "مرفوض" } : a)));
  };

  const rejectReport = (adId: number) => {
    setAds((prev) => prev.map((a) => (a.id === adId ? { ...a, status: "منشور" } : a)));
  };

  return (
    <div className="page-container reports-review-page">
      <div className="reports-review-header">
        <div className="header-content">
          <div className="title-section">
            <button className="back-button" onClick={() => (window.location.href = "/ads")} title="العودة">
              ← العودة
            </button>
            <div className="title-icon">🚨</div>
            <div>
              <h1 className="page-title">مراجعة البلاغات</h1>
              <p className="page-subtitle">مراجعة البلاغات على الإعلانات واتخاذ الإجراءات المناسبة</p>
            </div>
          </div>
          <div className="stats-section">
            <div className="stat-card">
              <span className="value-secondary">{filteredAds.length}</span>
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
              <th>تاريخ الإنشاء</th>
              <th>الأسباب</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {currentAds.map((ad) => (
              <tr key={ad.id}>
                <td className="ad-title-cell" data-label="العنوان">{ad.title}</td>
                <td data-label="القسم">{ad.category}</td>
                <td data-label="الحالة">
                  <span className="status-badge">{ad.status}</span>
                </td>
                <td data-label="كود المعلن">
                  <span className="owner-code-badge">{ad.ownerCode}</span>
                </td>
                
                <td className="cell-muted" data-label="تاريخ الإنشاء">{ad.createdDate}</td>
                <td data-label="الأسباب">
                  <div className="reasons-list">
                    {ad.reports.map((r, idx) => (
                      <span key={idx} className="reason-badge">{r.reason}</span>
                    ))}
                  </div>
                </td>
                <td data-label="إجراءات">
                  <div className="action-buttons reports-actions">
                    <button className="btn-approve" title="موافقة" onClick={() => approveReport(ad.id)}>
                      <span className="btn-text">موافقة</span>
                    </button>
                    <button className="btn-reject" title="رفض" onClick={() => rejectReport(ad.id)}>
                      <span className="btn-text">رفض</span>
                    </button>
                    <button className="btn-view" title="عرض" onClick={() => (window.location.href = `/ads/${ad.id}`)}>
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
            <span>إجمالي {filteredAds.length} إعلان في {totalPages} صفحة</span>
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
  );
}
