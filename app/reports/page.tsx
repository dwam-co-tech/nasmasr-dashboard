'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import DateInput from '@/components/DateInput';
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

  const ManagedSelectFilter = ({ options, value, onChange, placeholder, className }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; placeholder: string; className?: string }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
      const h = (e: MouseEvent) => {
        if (!ref.current) return;
        const t = e.target as Node;
        if (!ref.current.contains(t)) setOpen(false);
      };
      document.addEventListener('mousedown', h);
      return () => document.removeEventListener('mousedown', h);
    }, []);
    const currentLabel = value ? (options.find(o => o.value === value)?.label || placeholder) : placeholder;
    return (
      <div className={`managed-select ${className ? className : ''}`} ref={ref}>
        <button type="button" className="managed-select-toggle" onClick={() => setOpen(p => !p)}>
          <span className={`managed-select-value ${value ? 'filled' : ''}`}>{currentLabel}</span>
          <span className={`managed-select-caret ${open ? 'open' : ''}`}>▾</span>
        </button>
        {open && (
          <div className="managed-select-menu">
            <div className={`managed-select-item ${value === '' ? 'selected' : ''}`} onClick={() => { onChange(''); setOpen(false); }}>
              <span className="managed-select-text">{placeholder}</span>
            </div>
            {options.filter(o => o.value !== '').map(opt => (
              <div key={opt.value} className={`managed-select-item ${value === opt.value ? 'selected' : ''}`} onClick={() => { onChange(opt.value); setOpen(false); }}>
                <span className="managed-select-text">{opt.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

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
    {
      id: 201,
      name: 'شركة النور',
      phone: '+20 100 123 4567',
      transactionType: 'single_ad',
      packageType: 'featured',
      paidAmount: 250,
      adsCount: 45,
      spending: 15000,
      discounts: 2250,
      adId: 101,
      lastTransaction: { id: 'INV-201-A', title: 'إعلان مميز', amount: 250, date: '2024-02-12' },
      transactions: [
        { id: 'INV-201-A', title: 'إعلان مميز', amount: 250, date: '2024-02-12', type: 'single_ad' },
        { id: 'INV-201-B', title: 'إيداع', amount: 1000, date: '2024-02-01', type: 'deposit' }
      ]
    },
    {
      id: 202,
      name: 'مؤسسة الريان',
      phone: '+20 110 987 6543',
      transactionType: 'package',
      packageType: 'standard',
      paidAmount: 1200,
      adsCount: 28,
      spending: 8200,
      discounts: 820,
      lastTransaction: { id: 'INV-202-C', title: 'باقة عادية', amount: 1200, date: '2024-02-08' },
      transactions: [
        { id: 'INV-202-C', title: 'باقة عادية', amount: 1200, date: '2024-02-08', type: 'package' },
        { id: 'INV-202-D', title: 'رسوم إعلان', amount: 50, date: '2024-01-15', type: 'fee' }
      ]
    },
    {
      id: 203,
      name: 'بيزنس تك',
      phone: '+20 120 222 3344',
      transactionType: 'subscription',
      packageType: 'premium',
      paidAmount: 3000,
      adsCount: 5,
      spending: 600,
      discounts: 0,
      lastTransaction: { id: 'INV-203-E', title: 'اشتراك سنوي ذهبي', amount: 3000, date: '2024-01-20' },
      transactions: [
        { id: 'INV-203-E', title: 'اشتراك سنوي ذهبي', amount: 3000, date: '2024-01-20', type: 'subscription' }
      ]
    },
    {
      id: 204,
      name: 'أفق',
      phone: '+20 115 555 6677',
      transactionType: 'single_ad',
      packageType: 'standard',
      paidAmount: 50,
      adsCount: 12,
      spending: 2200,
      discounts: 200,
      adId: 105,
      lastTransaction: { id: 'INV-204-F', title: 'رسوم إعلان', amount: 50, date: '2024-02-18' },
      transactions: [
        { id: 'INV-204-F', title: 'رسوم إعلان', amount: 50, date: '2024-02-18', type: 'single_ad' },
        { id: 'INV-204-G', title: 'إيداع', amount: 500, date: '2024-01-10', type: 'deposit' }
      ]
    }
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
    { header: 'الاسم', accessor: 'name' },
    { header: 'رقم التليفون', accessor: 'phone' },
    { header: 'نوع المعاملة', accessor: 'transactionType' },
    { header: 'نوع الباقة', accessor: 'packageType' },
    { header: 'المبلغ المدفوع', accessor: 'paidAmount' },
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
  const transactionTypeLabel: Record<string, string> = {
    single_ad: 'إعلان واحد',
    package: 'باقة',
    subscription: 'اشتراك سنوي',
    deposit: 'إيداع',
    fee: 'رسوم'
  };
  const packageTypeLabel: Record<string, string> = {
    standard: 'عادية',
    featured: 'مميزة',
    premium: 'ذهبية'
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

  const [isAdvertiserModalOpen, setIsAdvertiserModalOpen] = useState(false);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<any | null>(null);
  const openAdvertiserDetails = (a: any) => { setSelectedAdvertiser(a); setIsAdvertiserModalOpen(true); };
  const closeAdvertiserDetails = () => { setIsAdvertiserModalOpen(false); setSelectedAdvertiser(null); };

  const [isAdDetailsModalOpen, setIsAdDetailsModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<any | null>(null);
  const openAdDetails = (a: any) => {
    const found = adsData.find(ad => ad.id === a.adId) || { title: a.lastTransaction?.title, category: a.packageType, status: 'نشط', value: a.paidAmount, views: 0 };
    setSelectedAd(found);
    setIsAdDetailsModalOpen(true);
  };
  const closeAdDetails = () => { setSelectedAd(null); setIsAdDetailsModalOpen(false); };

  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
  const [selectedTransactionsAdvertiser, setSelectedTransactionsAdvertiser] = useState<any | null>(null);
  const openAdvertiserTransactions = (a: any) => { setSelectedTransactionsAdvertiser(a); setIsTransactionsModalOpen(true); };
  const closeAdvertiserTransactions = () => { setSelectedTransactionsAdvertiser(null); setIsTransactionsModalOpen(false); };

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const openInvoiceDetails = (a: any) => { setSelectedInvoice(a.lastTransaction); setIsInvoiceModalOpen(true); };
  const closeInvoiceDetails = () => { setSelectedInvoice(null); setIsInvoiceModalOpen(false); };

  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedAdvertiserForSubscription, setSelectedAdvertiserForSubscription] = useState<any | null>(null);
  const [subscriptionForm, setSubscriptionForm] = useState({ title: '', annualFee: 0, paidAmount: 0 });
  const [subscriptionTransactions, setSubscriptionTransactions] = useState<any[]>([]);
  const openSubscriptionModal = (a: any) => {
    setSelectedAdvertiserForSubscription(a);
    setIsSubscriptionModalOpen(true);
    setSubscriptionForm({ title: '', annualFee: 0, paidAmount: a.paidAmount || 0 });
    setSubscriptionTransactions(a.transactions?.map((t: any) => ({ title: t.title, annualFee: t.amount, paidAmount: t.amount, date: t.date })) || []);
  };
  const closeSubscriptionModal = () => { setIsSubscriptionModalOpen(false); setSelectedAdvertiserForSubscription(null); };
  const handleSubscriptionChange = (key: 'title' | 'annualFee' | 'paidAmount', value: any) => { setSubscriptionForm(prev => ({ ...prev, [key]: value })); };
  const saveSubscriptionForAdvertiser = () => {
    const newTx = { title: subscriptionForm.title || 'اشتراك سنوي', annualFee: subscriptionForm.annualFee, paidAmount: subscriptionForm.paidAmount, date: new Date().toISOString().slice(0, 10) };
    setSubscriptionTransactions(prev => [newTx, ...prev]);
    alert('تم حفظ الاشتراك');
  };

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
        case 'transactionType': return transactionTypeLabel[String(val)] ?? String(val);
        case 'packageType': return packageTypeLabel[String(val)] ?? String(val);
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
            <DateInput
              value={dateRange.from}
              onChange={(v) => setDateRange({ ...dateRange, from: v })}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label>إلى تاريخ</label>
            <DateInput
              value={dateRange.to}
              onChange={(v) => setDateRange({ ...dateRange, to: v })}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label>القسم</label>
            <ManagedSelectFilter
              options={[
                { value: '', label: 'جميع الأقسام' },
                { value: 'cars', label: 'سيارات' },
                { value: 'real-estate', label: 'عقارات' },
                { value: 'electronics', label: 'إلكترونيات' },
                { value: 'jobs', label: 'وظائف' }
              ]}
              value={selectedFilters.category}
              onChange={(v) => setSelectedFilters({ ...selectedFilters, category: v })}
              placeholder={'جميع الأقسام'}
              className="filter-select-wide"
            />
          </div>
          <div className="filter-group">
            <label>المدينة</label>
            <ManagedSelectFilter
              options={[
                { value: '', label: 'جميع المدن' },
                { value: 'cairo', label: 'القاهرة' },
                { value: 'alexandria', label: 'الإسكندرية' },
                { value: 'giza', label: 'الجيزة' }
              ]}
              value={selectedFilters.city}
              onChange={(v) => setSelectedFilters({ ...selectedFilters, city: v })}
              placeholder={'جميع المدن'}
              className="filter-select-wide"
            />
          </div>
          <div className="filter-group">
            <label>الحالة</label>
            <ManagedSelectFilter
              options={[
                { value: '', label: 'كل الحالات' },
                { value: 'active', label: 'نشط' },
                { value: 'pending', label: 'قيد المراجعة' },
                { value: 'blocked', label: 'محظور' },
                { value: 'rejected', label: 'مرفوض' }
              ]}
              value={selectedFilters.status}
              onChange={(v) => setSelectedFilters({ ...selectedFilters, status: v })}
              placeholder={'كل الحالات'}
              className="filter-select-wide"
            />
          </div>
          {activeTab === 'ads' && (
            <div className="filter-group">
              <label>نوع العرض</label>
              <ManagedSelectFilter
                options={[
                  { value: '', label: 'كل الأنواع' },
                  { value: 'standard', label: 'عادي' },
                  { value: 'featured', label: 'مميز' },
                  { value: 'premium', label: 'ذهبي' }
                ]}
                value={selectedFilters.displayType}
                onChange={(v) => setSelectedFilters({ ...selectedFilters, displayType: v })}
                placeholder={'كل الأنواع'}
                className="filter-select-wide"
              />
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
              <table className="data-table advertisers-table">
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>رقم التليفون</th>
                    <th>نوع المعاملة</th>
                    <th>نوع الباقة</th>
                    <th>المبلغ المدفوع</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdvertisers.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center' }}>لا توجد بيانات مطابقة للفلاتر</td>
                    </tr>
                  )}
                  {filteredAdvertisers.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div className="name-cell">
                          <span className="name">{a.name}</span>
                        </div>
                      </td>
                      <td><span className="phone">{a.phone}</span></td>
                      <td><span className={`type-badge ${a.transactionType}`}>{transactionTypeLabel[a.transactionType] ?? a.transactionType}</span></td>
                      <td><span className={`package-badge ${a.packageType}`}>{packageTypeLabel[a.packageType] ?? a.packageType}</span></td>
                      <td><span className="money">{Number(a.paidAmount).toLocaleString()} ج.م</span></td>
                      <td>
                        <div className="reports-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button className="btn-view" onClick={() => openAdvertiserDetails(a)}>بيانات المعلن</button>
                          {a.transactionType === 'single_ad' && (
                            <button className="btn-view" onClick={() => openAdDetails(a)}>تفاصيل الإعلان</button>
                          )}
                          <button className="btn-view" onClick={() => openAdvertiserTransactions(a)}>معاملات المعلن</button>
                          <button className="btn-view" onClick={() => openInvoiceDetails(a)}>عرض الفاتورة</button>
                          <button className="btn-view" onClick={() => openSubscriptionModal(a)}>اشتراك سنوي</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isAdvertiserModalOpen && selectedAdvertiser && (
        <div className="reports-modal-overlay" onClick={closeAdvertiserDetails}>
          <div className="reports-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>بيانات المعلن</h3>
              <button className="modal-close" onClick={closeAdvertiserDetails}>✕</button>
            </div>
            <div className="modal-content">
              <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="info-item" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="info-label">الاسم:</span>
                  <span className="info-value">{selectedAdvertiser.name}</span>
                </div>
                <div className="info-item" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="info-label">الهاتف:</span>
                  <span className="info-value">{selectedAdvertiser.phone}</span>
                </div>
                <div className="info-item" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="info-label">نوع المعاملة:</span>
                  <span className="info-value">{transactionTypeLabel[selectedAdvertiser.transactionType] ?? selectedAdvertiser.transactionType}</span>
                </div>
                <div className="info-item" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="info-label">نوع الباقة:</span>
                  <span className="info-value">{packageTypeLabel[selectedAdvertiser.packageType] ?? selectedAdvertiser.packageType}</span>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={closeAdvertiserDetails}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {isAdDetailsModalOpen && selectedAd && (
        <div className="reports-modal-overlay" onClick={closeAdDetails}>
          <div className="reports-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>تفاصيل الإعلان</h3>
              <button className="modal-close" onClick={closeAdDetails}>✕</button>
            </div>
            <div className="modal-content">
              <div className="ad-details-grid" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
                <div className="ad-details-image">
                  <Image src={"/ad-placeholder.jpg"} alt={selectedAd.title || 'إعلان'} width={320} height={240} style={{ objectFit: 'cover', borderRadius: 12 }} />
                </div>
                <div className="ad-details-info">
                  <h4 className="ad-details-title" style={{ marginBottom: 8 }}>{selectedAd.title || '—'}</h4>
                  <div className="ad-details-rows" style={{ display: 'grid', gap: 8 }}>
                    <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between' }}><span className="detail-label">القسم</span><span className="detail-value">{selectedAd.category ?? '-'}</span></div>
                    <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between' }}><span className="detail-label">الحالة</span><span className="detail-value">{selectedAd.status ?? '-'}</span></div>
                    <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between' }}><span className="detail-label">القيمة</span><span className="detail-value">{selectedAd.value ?? '-'}</span></div>
                    <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between' }}><span className="detail-label">المشاهدات</span><span className="detail-value">{selectedAd.views ?? '-'}</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={closeAdDetails}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {isTransactionsModalOpen && selectedTransactionsAdvertiser && (
        <div className="reports-modal-overlay" onClick={closeAdvertiserTransactions}>
          <div className="reports-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>معاملات المعلن</h3>
              <button className="modal-close" onClick={closeAdvertiserTransactions}>✕</button>
            </div>
            <div className="modal-content">
              <div className="transactions-list" style={{ display: 'grid', gap: 8 }}>
                {selectedTransactionsAdvertiser.transactions?.map((t: any) => (
                  <div className="transaction-item" key={t.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8 }}>
                    <span>{t.title}</span>
                    <span>{Number(t.amount).toLocaleString()} ج.م</span>
                    <span>{t.date}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={closeAdvertiserTransactions}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {isInvoiceModalOpen && selectedInvoice && (
        <div className="reports-modal-overlay" onClick={closeInvoiceDetails}>
          <div className="reports-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>تفاصيل المعاملة</h3>
              <button className="modal-close" onClick={closeInvoiceDetails}>✕</button>
            </div>
            <div className="modal-content">
              <div className="info-grid" style={{ display: 'grid', gap: 8 }}>
                <div className="info-item" style={{ display: 'flex', justifyContent: 'space-between' }}><span className="info-label">رقم الفاتورة</span><span className="info-value">{selectedInvoice.id}</span></div>
                <div className="info-item" style={{ display: 'flex', justifyContent: 'space-between' }}><span className="info-label">العنوان</span><span className="info-value">{selectedInvoice.title}</span></div>
                <div className="info-item" style={{ display: 'flex', justifyContent: 'space-between' }}><span className="info-label">المبلغ</span><span className="info-value">{Number(selectedInvoice.amount).toLocaleString()} ج.م</span></div>
                <div className="info-item" style={{ display: 'flex', justifyContent: 'space-between' }}><span className="info-label">التاريخ</span><span className="info-value">{selectedInvoice.date}</span></div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={closeInvoiceDetails}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {isSubscriptionModalOpen && selectedAdvertiserForSubscription && (
        <div className="reports-modal-overlay" onClick={closeSubscriptionModal}>
          <div className="reports-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>اشتراك سنوي للمعلن</h3>
              <button className="modal-close" onClick={closeSubscriptionModal}>✕</button>
            </div>
            <div className="modal-content">
              <div className="subscription-form">
                <h4>اشتراك سنوي للمستخدم</h4>
                <div className="subscription-grid">
                  <div className="form-group">
                    <label>العنوان</label>
                    <input
                      type="text"
                      className="form-input"
                      value={subscriptionForm.title}
                      onChange={(e) => handleSubscriptionChange('title', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>قيمة الاشتراك السنوي</label>
                    <input
                      type="number"
                      min={0}
                      className="form-input"
                      value={subscriptionForm.annualFee}
                      onChange={(e) => handleSubscriptionChange('annualFee', Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>المبلغ المدفوع</label>
                    <input
                      type="number"
                      min={0}
                      className="form-input"
                      value={subscriptionForm.paidAmount}
                      onChange={(e) => handleSubscriptionChange('paidAmount', Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="subscription-actions">
                  <button className="btn-save" onClick={saveSubscriptionForAdvertiser}>حفظ الاشتراك</button>
                </div>
              </div>

              <div className="transactions-list" style={{ marginTop: 12 }}>
                {subscriptionTransactions.map((t, i) => (
                  <div className="transaction-item" key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8 }}>
                    <span>{t.title || '—'}</span>
                    <span>{`قيمة الاشتراك: ${t.annualFee} | المدفوع: ${t.paidAmount} جنيه`}</span>
                    <span>{t.date}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={closeSubscriptionModal}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
