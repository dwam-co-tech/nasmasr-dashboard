'use client';

import { useState, useEffect, useMemo } from 'react';
import DateInput from '@/components/DateInput';
import {
  fetchRevenueSummary,
  fetchTransactions,
  fetchAdsByCategory,
  fetchAdsByPlan,
} from '@/services/dashboardReports';
import type {
  FinancialRevenueResponse,
  TransactionsResponse,
  AdsByCategoryResponse,
  AdsByPlanResponse,
} from '@/models/dashboardReports';

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

// ==================== Helper Components ====================

function DonutChart({
  data,
  title,
  centerValue,
  centerLabel
}: {
  data: { name: string; value: number; color: string }[];
  title: string;
  centerValue: string;
  centerLabel: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="reports-donut-card">
      <h3 className="reports-chart-title">{title}</h3>
      <div className="reports-donut-container">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [
                new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(value),
                ''
              ]}
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                padding: '12px 16px',
                direction: 'rtl'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="reports-donut-center">
          <div className="reports-donut-value">{centerValue}</div>
          <div className="reports-donut-label">{centerLabel}</div>
        </div>
      </div>
      <div className="reports-donut-legend">
        {data.map((item, idx) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={idx} className="reports-legend-item">
              <span className="reports-legend-dot" style={{ backgroundColor: item.color }} />
              <span className="reports-legend-text">{item.name}</span>
              <span className="reports-legend-percent">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  color,
  delay = 0
}: {
  title: string;
  value: string;
  icon: string;
  trend?: number;
  trendLabel?: string;
  color: string;
  delay?: number;
}) {
  return (
    <div
      className="reports-stat-card"
      style={{
        '--card-color': color,
        '--card-delay': `${delay}ms`
      } as React.CSSProperties}
    >
      <div className="reports-stat-header">
        <div className="reports-stat-icon-wrapper" style={{ background: `linear-gradient(135deg, ${color}20, ${color}10)` }}>
          <span className="reports-stat-icon">{icon}</span>
        </div>
        {trend !== undefined && (
          <div className={`reports-stat-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
            <span>{trend >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="reports-stat-content">
        <h3 className="reports-stat-title">{title}</h3>
        <p className="reports-stat-value">{value}</p>
        {trendLabel && (
          <span className="reports-stat-trend-label">{trendLabel}</span>
        )}
      </div>
      <div className="reports-stat-glow" style={{ background: color }} />
    </div>
  );
}

function CategoryBreakdown({ categories }: { categories: { name: string; value: number; percentage: number }[] }) {
  const maxValue = Math.max(...categories.map(c => c.value));
  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

  return (
    <div className="reports-breakdown-card">
      <h3 className="reports-chart-title">📊 الإيرادات حسب القسم</h3>
      <div className="reports-breakdown-list">
        {categories.slice(0, 6).map((cat, idx) => (
          <div key={idx} className="reports-breakdown-item">
            <div className="reports-breakdown-header">
              <span className="reports-breakdown-name">{cat.name}</span>
              <span className="reports-breakdown-value">
                {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(cat.value)}
              </span>
            </div>
            <div className="reports-breakdown-bar-bg">
              <div
                className="reports-breakdown-bar-fill"
                style={{
                  width: `${(cat.value / maxValue) * 100}%`,
                  background: `linear-gradient(90deg, ${colors[idx % colors.length]}, ${colors[idx % colors.length]}80)`
                }}
              />
            </div>
            <span className="reports-breakdown-percent">{cat.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== Main Component ====================

export default function ReportsPage() {
  // State for Financial Data
  const [revenueStats, setRevenueStats] = useState<FinancialRevenueResponse | null>(null);
  const [transactionsData, setTransactionsData] = useState<TransactionsResponse | null>(null);
  const [categoryData, setCategoryData] = useState<AdsByCategoryResponse | null>(null);
  const [planData, setPlanData] = useState<AdsByPlanResponse | null>(null);

  // Loading States
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingTable, setIsLoadingTable] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [activeTab, setActiveTab] = useState<'ads' | 'subscriptions'>('ads');
  const [activePeriod, setActivePeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);

  // Current time for hero
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Period preset handlers
  const handlePeriodChange = (period: typeof activePeriod) => {
    setActivePeriod(period);
    const now = new Date();
    let from = '';
    let to = now.toISOString().split('T')[0];

    switch (period) {
      case 'today':
        from = to;
        break;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        from = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        from = monthAgo.toISOString().split('T')[0];
        break;
      case 'year':
        const yearAgo = new Date(now);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        from = yearAgo.toISOString().split('T')[0];
        break;
      case 'custom':
        return;
    }

    setDateRange({ from, to });
    setPage(1);
  };

  // Fetch Data
  useEffect(() => {
    const loadStats = async () => {
      setIsLoadingStats(true);
      try {
        const [stats, cats, plans] = await Promise.all([
          fetchRevenueSummary({ from: dateRange.from, to: dateRange.to }),
          fetchAdsByCategory(),
          fetchAdsByPlan()
        ]);
        setRevenueStats(stats);
        setCategoryData(cats);
        setPlanData(plans);
      } catch (error) {
        console.error('Error loading revenue stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStats();
  }, [dateRange]);

  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoadingTable(true);
      try {
        const transactions = await fetchTransactions({
          page,
          per_page: perPage,
          from: dateRange.from,
          to: dateRange.to,
        });
        setTransactionsData(transactions);
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setIsLoadingTable(false);
      }
    };

    loadTransactions();
  }, [page, perPage, dateRange]);

  // Derived Data
  const stats = useMemo(() => {
    if (!revenueStats?.summary) return null;
    return revenueStats.summary;
  }, [revenueStats]);

  const transactions = useMemo(() => {
    if (!transactionsData) return [];
    const items = activeTab === 'ads'
      ? transactionsData.ads?.items || []
      : transactionsData.subscriptions?.items || [];

    if (!searchQuery) return items;

    return items.filter((t: any) =>
      (t.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(t.id).includes(searchQuery)
    );
  }, [transactionsData, activeTab, searchQuery]);

  const currentMeta = useMemo(() => {
    if (!transactionsData) return null;
    return activeTab === 'ads'
      ? transactionsData.ads?.meta
      : transactionsData.subscriptions?.meta;
  }, [transactionsData, activeTab]);

  // Chart data
  const donutData = useMemo(() => {
    if (!revenueStats?.breakdown) return [];
    return [
      { name: 'الإعلانات', value: revenueStats.breakdown.ad_payments || 0, color: '#3b82f6' },
      { name: 'الاشتراكات', value: revenueStats.breakdown.subscriptions || 0, color: '#8b5cf6' },
    ];
  }, [revenueStats]);

  const planDonutData = useMemo(() => {
    if (!planData?.by_plan) return [];
    const colors = ['#f59e0b', '#10b981', '#ef4444', '#06b6d4'];
    return planData.by_plan.map((p, idx) => ({
      name: p.plan_name || p.plan_type,
      value: p.total_revenue || 0,
      color: colors[idx % colors.length]
    }));
  }, [planData]);

  const categoryBreakdownData = useMemo(() => {
    if (!revenueStats?.by_category) return [];
    return revenueStats.by_category.map(c => ({
      name: c.category_name,
      value: c.revenue,
      percentage: c.percentage
    }));
  }, [revenueStats]);

  // Chart data for area chart
  const chartData = useMemo(() => {
    if (!revenueStats?.chart_data) return [];
    return revenueStats.chart_data;
  }, [revenueStats]);

  // Helper for currency formatting
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
  };

  const formatShortCurrency = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}م ج.م`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}ك ج.م`;
    return formatCurrency(amount);
  };

  return (
    <div className="reports-page">
      {/* Premium Hero Section */}
      <div className="reports-hero">
        <div className="reports-hero-pattern" />
        <div className="reports-hero-content">
          <div className="reports-hero-text">
            <h1 className="reports-hero-title">📊 التقارير المالية</h1>
            <p className="reports-hero-subtitle">
              نظرة شاملة على الإيرادات، المعاملات المالية، واشتراكات المعلنين
            </p>
          </div>
          <div className="reports-hero-time">
            <div className="reports-hero-clock">
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </div>
            <div className="reports-hero-date">
              {currentTime.toLocaleDateString('ar-EG', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Quick Period Filters */}
        <div className="reports-quick-filters">
          {[
            { key: 'today', label: 'اليوم', icon: '📅' },
            { key: 'week', label: 'هذا الأسبوع', icon: '📆' },
            { key: 'month', label: 'هذا الشهر', icon: '🗓️' },
            { key: 'year', label: 'هذه السنة', icon: '📊' },
            { key: 'custom', label: 'مخصص', icon: '⚙️' },
          ].map((period) => (
            <button
              key={period.key}
              className={`reports-filter-btn ${activePeriod === period.key ? 'active' : ''}`}
              onClick={() => handlePeriodChange(period.key as typeof activePeriod)}
            >
              <span>{period.icon}</span>
              <span>{period.label}</span>
            </button>
          ))}
        </div>

        {/* Custom Date Range */}
        {activePeriod === 'custom' && (
          <div className="reports-custom-range">
            <div className="reports-date-input">
              <label>من تاريخ</label>
              <DateInput
                value={dateRange.from}
                onChange={(v) => setDateRange({ ...dateRange, from: v })}
                className="reports-date-field"
              />
            </div>
            <div className="reports-date-input">
              <label>إلى تاريخ</label>
              <DateInput
                value={dateRange.to}
                onChange={(v) => setDateRange({ ...dateRange, to: v })}
                className="reports-date-field"
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards Grid */}
      <div className="reports-stats-grid">
        {isLoadingStats ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="reports-stat-card skeleton">
              <div className="skeleton-icon" />
              <div className="skeleton-text" />
              <div className="skeleton-value" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              title="إجمالي الإيرادات"
              value={formatCurrency(stats?.total_revenue || 0)}
              icon="💰"
              trend={stats?.growth_rate}
              trendLabel="مقارنة بالفترة السابقة"
              color="#10b981"
              delay={0}
            />
            <StatCard
              title="إيرادات الإعلانات"
              value={formatCurrency(revenueStats?.breakdown?.ad_payments || 0)}
              icon="📢"
              color="#3b82f6"
              delay={100}
            />
            <StatCard
              title="إيرادات الاشتراكات"
              value={formatCurrency(revenueStats?.breakdown?.subscriptions || 0)}
              icon="👔"
              color="#8b5cf6"
              delay={200}
            />
            <StatCard
              title="الفترة السابقة"
              value={formatCurrency(stats?.previous_period || 0)}
              icon="📈"
              color="#f59e0b"
              delay={300}
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="reports-charts-section">
        {/* Revenue Timeline Chart */}
        <div className="reports-chart-card reports-main-chart">
          <h3 className="reports-chart-title">📈 تحليل الإيرادات</h3>
          <div className="reports-chart-container">
            {isLoadingStats ? (
              <div className="reports-chart-loading">
                <div className="reports-loading-spinner" />
                <span>جارٍ تحميل الرسم البياني...</span>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="label"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#6b7280' }}
                    dy={10}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val: number) => formatShortCurrency(val)}
                    tick={{ fill: '#6b7280' }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'الإيرادات']}
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                      padding: '16px 20px',
                      direction: 'rtl'
                    }}
                    labelStyle={{ color: '#111827', fontWeight: 'bold', marginBottom: '8px' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="reports-chart-empty">
                <span className="reports-empty-icon">📊</span>
                <p>لا توجد بيانات للرسم البياني</p>
              </div>
            )}
          </div>
        </div>

        {/* Donut Charts */}
        <div className="reports-donuts-grid">
          <DonutChart
            data={donutData}
            title="💳 توزيع الإيرادات"
            centerValue={formatShortCurrency(stats?.total_revenue || 0)}
            centerLabel="الإجمالي"
          />
          {planDonutData.length > 0 && (
            <DonutChart
              data={planDonutData}
              title="📦 الإيرادات حسب الباقة"
              centerValue={planData?.total_ads?.toString() || '0'}
              centerLabel="إعلان"
            />
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryBreakdownData.length > 0 && (
        <CategoryBreakdown categories={categoryBreakdownData} />
      )}

      {/* Transactions Table Section */}
      <div className="reports-table-section">
        <div className="reports-table-header">
          <div className="reports-table-title-section">
            <h3 className="reports-table-title">📝 سجل المعاملات</h3>
            <span className="reports-table-count">
              {currentMeta?.total || 0} معاملة
            </span>
          </div>

          <div className="reports-table-controls">
            {/* Search */}
            <div className="reports-search-box">
              <span className="reports-search-icon">🔍</span>
              <input
                type="text"
                placeholder="بحث بالاسم أو رقم المعاملة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="reports-search-input"
              />
            </div>

            {/* Tabs */}
            <div className="reports-tabs">
              <button
                onClick={() => { setActiveTab('ads'); setPage(1); }}
                className={`reports-tab ${activeTab === 'ads' ? 'active' : ''}`}
              >
                <span>📢</span>
                مدفوعات الإعلانات
              </button>
              <button
                onClick={() => { setActiveTab('subscriptions'); setPage(1); }}
                className={`reports-tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
              >
                <span>👔</span>
                الاشتراكات
              </button>
            </div>
          </div>
        </div>

        <div className="reports-table-container">
          {isLoadingTable ? (
            <div className="reports-table-loading">
              <div className="reports-loading-spinner" />
              <span>جارٍ تحميل البيانات...</span>
            </div>
          ) : (
            <table className="reports-table">
              <thead>
                <tr>
                  <th>رقم المعاملة</th>
                  <th>المستخدم/المعلن</th>
                  <th>المبلغ</th>
                  <th>التاريخ</th>
                  {activeTab === 'ads' ? (
                    <th>طريقة الدفع</th>
                  ) : (
                    <>
                      <th>نوع الباقة</th>
                      <th>تاريخ الانتهاء</th>
                    </>
                  )}
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'ads' ? 6 : 7} className="reports-empty-row">
                      <div className="reports-empty-state">
                        <span className="reports-empty-icon">📭</span>
                        <h4>لا توجد معاملات</h4>
                        <p>لم يتم العثور على بيانات في هذه الفترة</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((t: any, idx: number) => {
                    const userName = t.user_name || 'مستخدم غير معروف';
                    const amount = t.amount !== undefined ? t.amount : (t.price !== undefined ? t.price : 0);
                    const dateStr = t.paid_at || t.subscribed_at || t.created_at || new Date().toISOString();
                    const status = t.status || 'active';

                    return (
                      <tr key={t.id} style={{ animationDelay: `${idx * 30}ms` }}>
                        <td>
                          <span className="reports-id-badge">#{t.id}</span>
                        </td>
                        <td>
                          <span className="reports-user-name">{userName}</span>
                        </td>
                        <td>
                          <span className="reports-amount">{formatCurrency(Number(amount))}</span>
                        </td>
                        <td className="reports-date">
                          {new Date(dateStr).toLocaleDateString('ar-EG')}
                        </td>

                        {activeTab === 'ads' ? (
                          <td>
                            {t.payment_method ? (
                              <span className="reports-payment-method">{t.payment_method}</span>
                            ) : (
                              <span className="reports-no-data">--</span>
                            )}
                          </td>
                        ) : (
                          <>
                            <td>
                              <span className={`reports-plan-badge ${t.plan_type === 'featured' ? 'featured' : 'standard'}`}>
                                {t.plan_type === 'featured' ? 'متميز' : 'ستاندرد'}
                              </span>
                            </td>
                            <td className="reports-date">
                              {t.expires_at ? new Date(t.expires_at).toLocaleDateString('ar-EG') : '-'}
                            </td>
                          </>
                        )}

                        <td>
                          <span className={`reports-status-badge ${status === 'completed' || status === 'paid' || status === 'active'
                              ? 'success'
                              : 'pending'
                            }`}>
                            {status === 'completed' || status === 'paid' ? 'مكتمل' : (status === 'active' ? 'نشط' : status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {currentMeta && currentMeta.last_page > 1 && (
          <div className="reports-pagination">
            <div className="reports-pagination-info">
              صفحة <strong>{currentMeta.page}</strong> من <strong>{currentMeta.last_page}</strong>
              <span className="reports-pagination-total">• إجمالي {currentMeta.total} معاملة</span>
            </div>
            <div className="reports-pagination-controls">
              <button
                disabled={page === 1}
                onClick={() => setPage(1)}
                className="reports-pagination-btn"
              >
                ⟪ الأولى
              </button>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="reports-pagination-btn"
              >
                → السابق
              </button>

              <div className="reports-pagination-pages">
                {Array.from({ length: Math.min(5, currentMeta.last_page) }, (_, i) => {
                  let pageNum;
                  if (currentMeta.last_page <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= currentMeta.last_page - 2) {
                    pageNum = currentMeta.last_page - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`reports-pagination-page ${page === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={page === currentMeta.last_page}
                onClick={() => setPage(p => p + 1)}
                className="reports-pagination-btn"
              >
                التالي ←
              </button>
              <button
                disabled={page === currentMeta.last_page}
                onClick={() => setPage(currentMeta.last_page)}
                className="reports-pagination-btn"
              >
                الأخيرة ⟫
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
