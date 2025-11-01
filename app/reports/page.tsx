'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedFilters, setSelectedFilters] = useState({
    category: '',
    city: '',
    status: '',
    displayType: ''
  });

  const [appliedFilters, setAppliedFilters] = useState(selectedFilters);
  const [appliedDateRange, setAppliedDateRange] = useState(dateRange);

  // Demo datasets (can be replaced with real API data)
  const usersData = [
    { id: 1, name: 'أحمد محمد', registeredAt: '2024-01-15', activity: 'high', city: 'cairo', status: 'active', adsCount: 12 },
    { id: 2, name: 'فاطمة علي', registeredAt: '2024-01-10', activity: 'medium', city: 'alexandria', status: 'active', adsCount: 8 },
    { id: 3, name: 'محمد حسن', registeredAt: '2024-01-05', activity: 'low', city: 'giza', status: 'blocked', adsCount: 3 },
    { id: 4, name: 'سارة محمود', registeredAt: '2024-02-02', activity: 'medium', city: 'cairo', status: 'pending', adsCount: 4 },
    { id: 5, name: 'كريم أشرف', registeredAt: '2024-02-18', activity: 'high', city: 'giza', status: 'active', adsCount: 15 },
  ];

  const adsData = [
    { id: 101, title: 'سيارة تويوتا 2020', category: 'cars', city: 'cairo', publishedAt: '2024-02-03', views: 1450, status: 'active', displayType: 'featured', value: 450000 },
    { id: 102, title: 'شقة للبيع 3 غرف', category: 'real-estate', city: 'alexandria', publishedAt: '2024-02-10', views: 1200, status: 'pending', displayType: 'standard', value: 1600000 },
    { id: 103, title: 'هاتف آيفون 13', category: 'electronics', city: 'giza', publishedAt: '2024-01-22', views: 770, status: 'rejected', displayType: 'standard', value: 27000 },
    { id: 104, title: 'وظيفة مطور ويب', category: 'jobs', city: 'cairo', publishedAt: '2024-02-14', views: 980, status: 'active', displayType: 'premium', value: 0 },
    { id: 105, title: 'سيارة كيا 2019', category: 'cars', city: 'giza', publishedAt: '2024-01-28', views: 860, status: 'active', displayType: 'standard', value: 380000 },
  ];

  const advertisersData = [
    { id: 201, name: 'شركة النور',  adsCount: 45, spending: 15000, discounts: 2250 },
    { id: 202, name: 'مؤسسة الريان', adsCount: 28, spending: 8200, discounts: 820 },
    { id: 203, name: 'بيزنس تك',   adsCount: 5, spending: 600, discounts: 0 },
    { id: 204, name: 'أفق',   adsCount: 12, spending: 2200, discounts: 200 },
  ];

  // Sample data for demonstration
  const userStats = {
    totalRegistrations: 1250,
    activeUsers: 890,
    blockedUsers: 45,
    organicTraffic: 65
  };

  const adStats = {
    totalAds: 3420,
    activeAds: 2890,
    pendingAds: 340,
    rejectedAds: 190
  };

  const advertiserStats = {
    totalSpending: 125000,
    totalAds: 2340,
    appliedDiscounts: 15600
  };

  // Column definitions used for tables and export headers
  const usersColumns = [
    { header: 'اسم المستخدم', accessor: 'name' },
    { header: 'تاريخ التسجيل', accessor: 'registeredAt' },
    { header: 'النشاط', accessor: 'activity' },
    { header: 'المدينة', accessor: 'city' },
    { header: 'الحالة', accessor: 'status' },
    { header: 'عدد الإعلانات', accessor: 'adsCount' },
  ];

  const adsColumns = [
    { header: 'عنوان الإعلان', accessor: 'title' },
    { header: 'تاريخ النشر', accessor: 'publishedAt' },
    { header: 'القسم', accessor: 'category' },
    { header: 'المدينة', accessor: 'city' },
    { header: 'الحالة', accessor: 'status' },
    { header: 'نوع العرض', accessor: 'displayType' },
    { header: 'القيمة', accessor: 'value' },
  ];

  const advertisersColumns = [
    { header: 'اسم المعلن', accessor: 'name' },
   
    { header: 'عدد الإعلانات', accessor: 'adsCount' },
    { header: 'الإنفاق', accessor: 'spending' },
    { header: 'الخصومات', accessor: 'discounts' },
  ];

  const cityLabel: Record<string, string> = {
    cairo: 'القاهرة',
    alexandria: 'الإسكندرية',
    giza: 'الجيزة',
  };
  const statusLabel: Record<string, string> = {
    active: 'نشط',
    blocked: 'محظور',
    pending: 'قيد المراجعة',
    rejected: 'مرفوض',
  };
  const activityLabel: Record<string, string> = {
    high: 'عالي',
    medium: 'متوسط',
    low: 'منخفض',
  };
  const categoryLabel: Record<string, string> = {
    cars: 'سيارات',
    'real-estate': 'عقارات',
    electronics: 'إلكترونيات',
    jobs: 'وظائف',
  };
  const displayLabel: Record<string, string> = {
    featured: 'مميز',
    standard: 'عادي',
    premium: 'ذهبي',
  };

  const parseDate = (s: string) => (s ? new Date(s) : null);
  const inRange = (d: Date | null, from: string, to: string) => {
    if (!d) return true;
    const f = parseDate(from);
    const t = parseDate(to);
    if (f && d < f) return false;
    if (t && d > t) return false;
    return true;
  };

  const filteredUsers = useMemo(() => {
    return usersData.filter(u => (
      (!appliedFilters.city || u.city === appliedFilters.city) &&
      (!appliedFilters.status || u.status === appliedFilters.status) &&
      inRange(parseDate(u.registeredAt), appliedDateRange.from, appliedDateRange.to)
    ));
  }, [usersData, appliedFilters, appliedDateRange]);

  const filteredAds = useMemo(() => {
    return adsData.filter(a => (
      (!appliedFilters.category || a.category === appliedFilters.category) &&
      (!appliedFilters.city || a.city === appliedFilters.city) &&
      (!appliedFilters.status || a.status === appliedFilters.status) &&
      (!appliedFilters.displayType || a.displayType === appliedFilters.displayType) &&
      inRange(parseDate(a.publishedAt), appliedDateRange.from, appliedDateRange.to)
    ));
  }, [adsData, appliedFilters, appliedDateRange]);

  const filteredAdvertisers = useMemo(() => {
    return advertisersData; // Show all accepted advertisers without filtering by status
  }, [advertisersData]);

  const currentData = useMemo(() => {
    if (activeTab === 'users') return filteredUsers;
    if (activeTab === 'ads') return filteredAds;
    return filteredAdvertisers;
  }, [activeTab, filteredUsers, filteredAds, filteredAdvertisers]);

  const currentColumns = useMemo(() => {
    if (activeTab === 'users') return usersColumns;
    if (activeTab === 'ads') return adsColumns;
    return advertisersColumns;
  }, [activeTab]);

  const handleApplyFilters = () => {
    setAppliedFilters(selectedFilters);
    setAppliedDateRange(dateRange);
  };

  const exportToExcel = async (data: any[], columns: { header: string; accessor: string }[], filename: string) => {
    if (!data || data.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }
    const mapValueToArabic = (accessor: string, val: any) => {
      if (val === undefined || val === null) return '';
      switch (accessor) {
        case 'city': return cityLabel[String(val)] ?? String(val);
        case 'status': return statusLabel[String(val)] ?? String(val);
        case 'activity': return activityLabel[String(val)] ?? String(val);
        case 'category': return categoryLabel[String(val)] ?? String(val);
        case 'displayType': return displayLabel[String(val)] ?? String(val);
        default: return val; // keep numbers as numbers for Excel
      }
    };

    try {
      const XLSX = await import('xlsx');
      const rows = data.map(row => {
        const obj: Record<string, any> = {};
        columns.forEach(c => { obj[c.header] = mapValueToArabic(c.accessor, row[c.accessor as keyof typeof row]); });
        return obj;
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'البيانات');
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (e) {
      console.error('فشل تصدير Excel عبر xlsx، تأكد من التثبيت', e);
      alert('تعذر إنشاء ملف Excel، برجاء المحاولة لاحقًا');
    }
  };

  // Removed Excel export per request

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="reports-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">التقارير والإحصائيات</h1>
            <p className="page-description">
              تقارير شاملة عن المستخدمين والإعلانات والمعلنين مع إمكانية التصدير
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-export excel" onClick={() => exportToExcel(currentData, currentColumns, activeTab === 'users' ? 'users-report' : activeTab === 'ads' ? 'ads-report' : 'advertisers-report')}>
              <span>📈</span>
              تصدير Excel
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-container">
          <div className="filter-group">
            <label>من تاريخ</label>
            <input 
              type="date" 
              value={dateRange.from}
              onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label>إلى تاريخ</label>
            <input 
              type="date" 
              value={dateRange.to}
              onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label>القسم</label>
            <select 
              value={selectedFilters.category}
              onChange={(e) => setSelectedFilters({...selectedFilters, category: e.target.value})}
              className="filter-select"
            >
              <option value="">جميع الأقسام</option>
              <option value="cars">سيارات</option>
              <option value="real-estate">عقارات</option>
              <option value="electronics">إلكترونيات</option>
              <option value="jobs">وظائف</option>
            </select>
          </div>
          <div className="filter-group">
            <label>المدينة</label>
            <select 
              value={selectedFilters.city}
              onChange={(e) => setSelectedFilters({...selectedFilters, city: e.target.value})}
              className="filter-select"
            >
              <option value="">جميع المدن</option>
              <option value="cairo">القاهرة</option>
              <option value="alexandria">الإسكندرية</option>
              <option value="giza">الجيزة</option>
            </select>
          </div>
          <div className="filter-group">
            <label>الحالة</label>
            <select 
              value={selectedFilters.status}
              onChange={(e) => setSelectedFilters({...selectedFilters, status: e.target.value})}
              className="filter-select"
            >
              <option value="">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="pending">قيد المراجعة</option>
              <option value="blocked">محظور</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>
          {activeTab === 'ads' && (
            <div className="filter-group">
              <label>نوع العرض</label>
              <select 
                value={selectedFilters.displayType}
                onChange={(e) => setSelectedFilters({...selectedFilters, displayType: e.target.value})}
                className="filter-select"
              >
                <option value="">كل الأنواع</option>
                <option value="standard">عادي</option>
                <option value="featured">مميز</option>
                <option value="premium">ذهبي</option>
              </select>
            </div>
          )}
          <button className="btn-filter" onClick={handleApplyFilters}>
            <span>🔍</span>
            تطبيق الفلاتر
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-navigation" role="tablist" aria-label="تقارير النظام">
        <button 
          role="tab"
          aria-selected={activeTab === 'users'}
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <span>👥</span>
          تقارير المستخدمين
        </button>
        <button 
          role="tab"
          aria-selected={activeTab === 'ads'}
          className={`tab-btn ${activeTab === 'ads' ? 'active' : ''}`}
          onClick={() => setActiveTab('ads')}
        >
          <span>📢</span>
          تقارير الإعلانات
        </button>
        <button 
          role="tab"
          aria-selected={activeTab === 'advertisers'}
          className={`tab-btn ${activeTab === 'advertisers' ? 'active' : ''}`}
          onClick={() => setActiveTab('advertisers')}
        >
          <span>💼</span>
          تقارير المعلنين
        </button>
      </div>

      {/* Users Reports Tab */}
      {activeTab === 'users' && (
        <div className="tab-content">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card registrations">
              <div className="stat-icon">👤</div>
              <div className="stat-info">
                <h3>التسجيلات</h3>
                <p className="stat-number">{userStats.totalRegistrations.toLocaleString()}</p>
                <span className="stat-change positive">+12% من الشهر الماضي</span>
              </div>
            </div>
            <div className="stat-card activity">
              <div className="stat-icon">⚡</div>
              <div className="stat-info">
                <h3>المستخدمون النشطون</h3>
                <p className="stat-number">{userStats.activeUsers.toLocaleString()}</p>
                <span className="stat-change positive">+8% من الشهر الماضي</span>
              </div>
            </div>
            <div className="stat-card blocked">
              <div className="stat-icon">🚫</div>
              <div className="stat-info">
                <h3>المستخدمون المحظورون</h3>
                <p className="stat-number">{userStats.blockedUsers}</p>
                <span className="stat-change negative">-3% من الشهر الماضي</span>
              </div>
            </div>
            <div className="stat-card traffic">
              <div className="stat-icon">🌐</div>
              <div className="stat-info">
                <h3>الزيارات العضوية</h3>
                <p className="stat-number">{userStats.organicTraffic}%</p>
                <span className="stat-change positive">+5% من الشهر الماضي</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ads Reports Tab */}
      {activeTab === 'ads' && (
        <div className="tab-content">
          <div className="stats-grid">
            <div className="stat-card total-ads">
              <div className="stat-icon">📢</div>
              <div className="stat-info">
                <h3>إجمالي الإعلانات</h3>
                <p className="stat-number">{adStats.totalAds.toLocaleString()}</p>
                <span className="stat-change positive">+15% من الشهر الماضي</span>
              </div>
            </div>
            <div className="stat-card active-ads">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>الإعلانات النشطة</h3>
                <p className="stat-number">{adStats.activeAds.toLocaleString()}</p>
                <span className="stat-change positive">+10% من الشهر الماضي</span>
              </div>
            </div>
            <div className="stat-card pending-ads">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>في انتظار المراجعة</h3>
                <p className="stat-number">{adStats.pendingAds}</p>
                <span className="stat-change neutral">نفس الشهر الماضي</span>
              </div>
            </div>
            <div className="stat-card rejected-ads">
              <div className="stat-icon">❌</div>
              <div className="stat-info">
                <h3>الإعلانات المرفوضة</h3>
                <p className="stat-number">{adStats.rejectedAds}</p>
                <span className="stat-change negative">-5% من الشهر الماضي</span>
              </div>
            </div>
          </div>

          <div className="chart-section">
            <div className="chart-container full-width">
              <h3>توزيع الإعلانات حسب الفئة</h3>
              <div className="chart-placeholder horizontal">
                <div className="horizontal-bars">
                  <div className="h-bar">
                    <span className="bar-label">سيارات</span>
                    <div className="bar-fill" style={{width: '85%'}}></div>
                    <span className="bar-value">1,450</span>
                  </div>
                  <div className="h-bar">
                    <span className="bar-label">عقارات</span>
                    <div className="bar-fill" style={{width: '70%'}}></div>
                    <span className="bar-value">1,200</span>
                  </div>
                  <div className="h-bar">
                    <span className="bar-label">إلكترونيات</span>
                    <div className="bar-fill" style={{width: '45%'}}></div>
                    <span className="bar-value">770</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Advertisers Reports Tab */}
      {activeTab === 'advertisers' && (
        <div className="tab-content">
          <div className="stats-grid">
            <div className="stat-card spending">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <h3>إجمالي الإنفاق</h3>
                <p className="stat-number">{advertiserStats.totalSpending.toLocaleString()} ج.م</p>
                <span className="stat-change positive">+22% من الشهر الماضي</span>
              </div>
            </div>
            <div className="stat-card advertiser-ads">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>عدد الإعلانات</h3>
                <p className="stat-number">{advertiserStats.totalAds.toLocaleString()}</p>
                <span className="stat-change positive">+18% من الشهر الماضي</span>
              </div>
            </div>
            <div className="stat-card discounts">
              <div className="stat-icon">🎯</div>
              <div className="stat-info">
                <h3>الخصومات المطبقة</h3>
                <p className="stat-number">{advertiserStats.appliedDiscounts.toLocaleString()} ج.م</p>
                <span className="stat-change positive">+7% من الشهر الماضي</span>
              </div>
            </div>
          </div>
          {/* Data Table - Advertisers */}
          <div className="data-table-section">
            <div className="table-header">
              <h3>تفاصيل المعلنين</h3>
              <div className="table-actions">
                <button className="btn-export-table excel" onClick={() => exportToExcel(filteredAdvertisers, advertisersColumns, 'advertisers-report')}>
                  تصدير Excel
                </button>
              </div>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>اسم المعلن</th>
                    
                    <th>عدد الإعلانات</th>
                    <th>الإنفاق</th>
                    <th>الخصومات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdvertisers.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center' }}>لا توجد بيانات مطابقة للفلاتر</td>
                    </tr>
                  )}
                  {filteredAdvertisers.map(a => (
                    <tr key={a.id}>
                      <td>{a.name}</td>
                     
                      <td>{a.adsCount}</td>
                      <td>{a.spending.toLocaleString()} ج.م</td>
                      <td>{a.discounts.toLocaleString()} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}