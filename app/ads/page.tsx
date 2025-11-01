"use client";

import { useState, useEffect } from "react";

// Mock data for demonstration - 100 ads
const mockAds = [
  {
    id: 1,
    status: "منشور",
    category: "عقارات",
    createdDate: "2024-01-15",
    expiryDate: "2024-02-15",
    ownerCode: "USR001",
    displayType: "عادي",
    value: 500,
    views: 1250,
    reports: 2,
  },
  {
    id: 2,
    status: "قيد المراجعة",
    category: "سيارات",
    createdDate: "2024-01-20",
    expiryDate: "2024-02-20",
    ownerCode: "USR002",
    displayType: "مثبّت",
    value: 1000,
    views: 0,
    reports: 0,
  },
  {
    id: 3,
    status: "مرفوض",
    category: "وظائف",
    createdDate: "2024-01-10",
    expiryDate: "2024-02-10",
    ownerCode: "USR003",
    displayType: "جانبي",
    value: 200,
    views: 45,
    reports: 5,
  },
  // Adding 97 more ads to reach 100 total
  ...Array.from({ length: 97 }, (_, i) => ({
    id: i + 4,
    status: ["منشور", "قيد المراجعة", "مرفوض", "مسودة", "منتهي"][Math.floor(Math.random() * 5)],
    category: ["عقارات", "سيارات", "وظائف", "خدمات", "إلكترونيات", "أزياء", "رياضة", "كتب"][Math.floor(Math.random() * 8)],
    createdDate: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    expiryDate: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    ownerCode: `USR${String(i + 4).padStart(3, '0')}`,
    displayType: ["عادي", "مثبّت", "جانبي", "مميز"][Math.floor(Math.random() * 4)],
    value: Math.floor(Math.random() * 5000) + 100,
    views: Math.floor(Math.random() * 10000),
    reports: Math.floor(Math.random() * 10),
  }))
];

const statusColors = {
  "مسودة": "#9CA3AF",
  "قيد المراجعة": "#FF5C23",
  "منشور": "#1BB28F",
  "مرفوض": "#EF4444",
  "منتهي": "#6B7280",
};

const ITEMS_PER_PAGE = 10;

export default function AdsManagement() {
  const [ads, setAds] = useState(mockAds);
  const [selectedAds, setSelectedAds] = useState<number[]>([]);

  // دمج الإعلانات المقبولة من صفحة المراجعة (localStorage)
  useEffect(() => {
    try {
      const fromModeration = JSON.parse(localStorage.getItem('adsManagementFromModeration') || '[]');
      if (Array.isArray(fromModeration) && fromModeration.length) {
        setAds(prev => [...fromModeration, ...prev]);
      }
    } catch (e) {
      // تجاهل أخطاء القراءة
    }
  }, []);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAds = ads.filter((ad) => {
    const statusMatch = statusFilter ? ad.status === statusFilter : true;
    const categoryMatch = categoryFilter ? ad.category === categoryFilter : true;
    const fromMatch = fromDate ? new Date(ad.createdDate) >= new Date(fromDate) : true;
    const toMatch = toDate ? new Date(ad.createdDate) <= new Date(toDate) : true;
    return statusMatch && categoryMatch && fromMatch && toMatch;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredAds.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentAds = filteredAds.slice(startIndex, endIndex);

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

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
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
      <div className="homepage-header">
        <div>
          <h1 className="welcome-title">إدارة الإعلانات</h1>
          <p className="welcome-subtitle">إدارة وتتبع جميع الإعلانات في النظام</p>
        </div>
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="value-primary">{ads.length}</div>
            <div className="label">إجمالي الإعلانات</div>
          </div>
          <div className="stat-card">
            <div className="value-secondary">{ads.filter(ad => ad.status === "قيد المراجعة").length}</div>
            <div className="label">قيد المراجعة</div>
          </div>
          <div 
            className="stat-card clickable-card" 
            onClick={() => window.location.href = '/ads/rejected'}
            style={{ cursor: 'pointer' }}
          >
            <div className="value-danger">{ads.filter(ad => ad.status === "مرفوض").length}</div>
            <div className="label">الإعلانات المرفوضة
              <div className="clickable-text" onClick={() => window.location.href = '/ads/rejected'}>
                اضغط للمشاهدة
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filter Bar */}
      <div className="filter-bar">
        <div className="filter-item">
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
        </div>

        <div className="filter-item">
          <label className="filter-label">📂 القسم</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-select"
          >
            <option value="">كل الأقسام</option>
            <option value="عقارات"> عقارات</option>
            <option value="سيارات"> سيارات</option>
            <option value="وظائف"> وظائف</option>
            <option value="خدمات"> خدمات</option>
            <option value="إلكترونيات"> إلكترونيات</option>
            <option value="أزياء"> أزياء</option>
            <option value="رياضة"> رياضة</option>
            <option value="كتب"> كتب</option>
          </select>
        </div>

        <div className="filter-item">
          <label className="filter-label">📅 من تاريخ</label>
          <input type="date" className="form-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>

        <div className="filter-item">
          <label className="filter-label">📅 إلى تاريخ</label>
          <input type="date" className="form-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
      </div>

      {/* Enhanced Bulk Actions */}
      {selectedAds.length > 0 && (
        <div className="bulk-actions">
          <div className="count-pill">{selectedAds.length} إعلان محدد</div>
          <button className="btn-approve" onClick={handleBulkApprove}>✅ موافقة</button>
          <button className="btn-reject" onClick={handleBulkReject}>❌ رفض</button>
          <button className="btn-extend" onClick={handleBulkExtend}>⏰ تمديد</button>
          <button className="btn-pause" onClick={handleBulkPause}>إيقاف مؤقت</button>
        </div>
      )}

      {/* Results Info */}
      <div className="results-info">
        <span className="results-count">
          عرض {startIndex + 1} - {Math.min(endIndex, filteredAds.length)} من {filteredAds.length} إعلان
        </span>
        <span className="page-info">
          الصفحة {currentPage} من {totalPages}
        </span>
      </div>

      {/* Enhanced Ads Table */}
      <div className="table-container">
        <table className="ads-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  checked={currentAds.length > 0 && currentAds.every((ad) => selectedAds.includes(ad.id))}
                  className="accent-primary"
                />
              </th>
              <th>📊 الحالة</th>
              <th>📂 القسم</th>
              <th>📅 تاريخ الإنشاء</th>
              <th>⏰ تاريخ الانتهاء</th>
              <th>👤 كود المعلن</th>
              <th>🎯 نوع الظهور</th>
              <th>💰 القيمة</th>
              <th>👁️ المشاهدات</th>
              <th>🚨 البلاغات</th>
              <th>⚙️ إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {currentAds.map((ad, index) => (
              <tr 
                key={ad.id} 
                className="table-row"
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedAds.includes(ad.id)}
                    onChange={(e) => handleSelectAd(ad.id, e.target.checked)}
                    className="accent-primary"
                  />
                </td>
                <td>
                  <span className={`status-badge ${getStatusClass(ad.status)}`}>
                    {ad.status}
                  </span>
                </td>
                <td>{ad.category}</td>
                <td className="cell-muted">{ad.createdDate}</td>
                <td className="cell-muted">{ad.expiryDate}</td>
                <td>
                  <span className="owner-code-badge">{ad.ownerCode}</span>
                </td>
                <td>{ad.displayType}</td>
                <td>
                  <span className="value-strong">{ad.value} ج.م</span>
                </td>
                <td>
                  <span className={`views-badge ${ad.views > 1000 ? 'views-high' : 'views-low'}`}>
                    {ad.views.toLocaleString()}
                  </span>
                </td>
                <td>
                  <span className={`reports-text ${ad.reports > 0 ? 'reports-has' : 'reports-none'}`}>
                    {ad.reports}
                  </span>
                </td>
                <td>
                  <button
                    className="btn-view"
                    onClick={() => (window.location.href = `/ads/${ad.id}`)}
                  >
                    عرض
                  </button>
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
          <h3>لا توجد إعلانات</h3>
          <p>لم يتم العثور على إعلانات تطابق المعايير المحددة</p>
        </div>
      )}
    </div>
  );
}