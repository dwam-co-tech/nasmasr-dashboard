"use client";

import { useState, useEffect } from "react";
import DateInput from "@/components/DateInput";
import ManagedSelect from '@/components/ManagedSelect';
import { ALL_CATEGORIES } from '@/constants/categories';
import "../../back-button.css";

// Mock data for rejected ads - 100 entries
const mockRejectedAds = [
  {
    id: 1,
    section: "عقارات",
    creationDate: "2024-01-15",
    endDate: "2024-02-15",
    advertiserCode: "USR001",
    rejectionReason: "محتوى غير مناسب",
    rejectedBy: "أحمد محمد",
  },
  {
    id: 2,
    section: "سيارات",
    creationDate: "2024-01-20",
    endDate: "2024-02-20",
    advertiserCode: "USR002",
    rejectionReason: "صور غير واضحة",
    rejectedBy: "فاطمة علي",
  },
  {
    id: 3,
    section: "وظائف",
    creationDate: "2024-01-10",
    endDate: "2024-02-10",
    advertiserCode: "USR003",
    rejectionReason: "معلومات ناقصة",
    rejectedBy: "محمد حسن",
  },
  // Adding 97 more rejected ads to reach 100 total
  ...Array.from({ length: 97 }, (_, i) => ({
    id: i + 4,
    section: ["عقارات", "سيارات", "وظائف", "خدمات", "إلكترونيات", "أزياء", "رياضة", "كتب"][Math.floor(Math.random() * 8)],
    creationDate: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    endDate: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    advertiserCode: `USR${String(i + 4).padStart(3, '0')}`,
    rejectionReason: [
      "محتوى غير مناسب",
      "صور غير واضحة", 
      "معلومات ناقصة",
      "انتهاك شروط الاستخدام",
      "إعلان مضلل",
      "محتوى مكرر",
      "سعر غير منطقي",
      "معلومات اتصال خاطئة",
      "صور محمية بحقوق الطبع",
      "وصف غير دقيق"
    ][Math.floor(Math.random() * 10)],
    rejectedBy: [
      "أحمد محمد",
      "فاطمة علي", 
      "محمد حسن",
      "سارة أحمد",
      "عمر خالد",
      "نور الدين",
      "ليلى محمود",
      "يوسف إبراهيم",
      "مريم عبدالله",
      "حسام الدين"
    ][Math.floor(Math.random() * 10)],
  }))
];

const ITEMS_PER_PAGE = 10;

export default function RejectedAds() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sectionFilter, setSectionFilter] = useState("");
  const [rejectedByFilter, setRejectedByFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [codeSearch, setCodeSearch] = useState("");

  const [ads, setAds] = useState(mockRejectedAds);
  // دمج الإعلانات المرفوضة القادمة من صفحة المراجعة (localStorage)
  useEffect(() => {
    try {
      const fromModeration = JSON.parse(localStorage.getItem('rejectedAdsFromModeration') || '[]');
      if (Array.isArray(fromModeration) && fromModeration.length) {
        setAds(prev => [...fromModeration, ...prev]);
      }
    } catch (e) {
      // تجاهل أخطاء القراءة
    }
  }, []);
  // Filter the ads based on selected filters
  const filteredAds = ads.filter((ad) => {
    const sectionMatch = sectionFilter ? ad.section === sectionFilter : true;
    const rejectedByMatch = rejectedByFilter ? ad.rejectedBy === rejectedByFilter : true;
    const fromMatch = fromDate ? new Date(ad.creationDate) >= new Date(fromDate) : true;
    const toMatch = toDate ? new Date(ad.endDate) <= new Date(toDate) : true;
    const codeMatch = codeSearch
      ? String(ad.advertiserCode).toLowerCase().includes(codeSearch.toLowerCase().trim())
      : true;
    return sectionMatch && rejectedByMatch && fromMatch && toMatch && codeMatch;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredAds.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentAds = filteredAds.slice(startIndex, endIndex);

  // Get unique values for filters
  const uniqueSections = [...new Set(ads.map(ad => ad.section))];
  const uniqueRejectedBy = [...new Set(ads.map(ad => ad.rejectedBy))];

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

  return (
    <div className="page-container">
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
            <div className="title-icon">🚫</div>
            <div>
              <h1 className="page-title">الإعلانات المرفوضة</h1>
              <p className="page-subtitle">إدارة ومراجعة الإعلانات التي تم رفضها</p>
            </div>
          </div>
          <div className="stats-section">
            <div className="stat-card rejected-ads-card" style={{ backgroundColor: "#dc3545" }}>
              <span className="stat-number">{filteredAds.length}</span>
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
      <div className="table-container">
        <table className="rejected-ads-table">
          <thead>
            <tr>
              <th>📂 القسم</th>
              <th>📅 تاريخ الإنشاء</th>
              <th>⏰ تاريخ الانتهاء</th>
              <th>👤 كود المعلن</th>
              <th>🚫 سبب الرفض</th>
              <th>👨‍💼 من قام بالرفض</th>
              <th>⚙️ إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {currentAds.map((ad, index) => (
              <tr key={ad.id} className="table-row">
                <td>
                  <span className="category-badge">{ad.section}</span>
                </td>
                <td className="cell-muted">{ad.creationDate}</td>
                <td className="cell-muted">{ad.endDate}</td>
                <td>
                  <span className="owner-code-badge">{ad.advertiserCode}</span>
                </td>
                <td>
                  <span className="rejection-reason">{ad.rejectionReason}</span>
                </td>
                <td>
                  <span className="reviewer-name">{ad.rejectedBy}</span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-view"
                      onClick={() => (window.location.href = `/ads/${ad.id}`)}
                      title="عرض التفاصيل"
                    >
                      عرض
                    </button>
                    <button
                      className="btn-reconsider"
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

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            <span>إجمالي {filteredAds.length} إعلان في {totalPages} صفحة</span>
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
    </div>
  );
}
