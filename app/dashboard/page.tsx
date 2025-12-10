'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAdminStats, fetchRecentActivities } from '@/services/adminStats';
import type { AdminStatsResponse } from '@/models/stats';

type DonutSegment = { label: string; value: number; color: string };

function DonutChart({ segments, centerTitle, centerValue }: { segments: DonutSegment[]; centerTitle: string; centerValue: string }) {
  const total = segments.reduce((s, x) => s + (Number.isFinite(x.value) ? x.value : 0), 0) || 0;
  const bg = useMemo(() => {
    let acc = 0;
    const parts: string[] = [];
    for (const seg of segments) {
      const pct = total > 0 ? (seg.value / total) * 360 : 0;
      const start = acc;
      const end = acc + pct;
      parts.push(`${seg.color} ${start}deg ${end}deg`);
      acc = end;
    }
    return `conic-gradient(${parts.join(', ')})`;
  }, [segments, total]);

  return (
    <div className="chart-card">
      <div className="donut-chart" style={{ background: bg }}>
        <div className="donut-center">
          <div className="donut-value">{centerValue}</div>
          <div className="donut-title">{centerTitle}</div>
        </div>
      </div>
      <div className="chart-legend">
        {segments.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <div key={s.label} className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: s.color }} />
              <span className="legend-text">{s.label}</span>
              <span className="legend-value">{s.value.toLocaleString('en-US')}</span>
              <span className="legend-percent">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarsChart({ data, title }: { data: { label: string; value: number; color: string }[]; title: string }) {
  const max = data.reduce((m, x) => Math.max(m, x.value), 0) || 1;
  return (
    <div className="chart-card">
      <div className="chart-header">{title}</div>
      <div className="bars-chart">
        {data.map((d) => {
          const h = Math.round((d.value / max) * 100);
          return (
            <div key={d.label} className="bar-item">
              <div
                className="bar"
                style={{ height: `${h}%`, ['--bar-color' as any]: d.color } as React.CSSProperties}
              >
                <div className="bar-value">{d.value}</div>
              </div>
              <div className="bar-label">{d.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivitySparkline({ series }: { series: number[] }) {
  const max = series.reduce((m, v) => Math.max(m, v), 0) || 1;
  return (
    <div className="sparkline">
      {series.map((v, i) => {
        const h = Math.round((v / max) * 100);
        return <div key={i} className="spark-bar" style={{ height: `${h}%` }} />;
      })}
    </div>
  );
}

function ActivityTimeline({ items }: { items: { action: string; time: string; type: string }[] }) {
  return (
    <div className="timeline">
      {items.map((it, idx) => (
        <div key={idx} className={`timeline-item timeline-${it.type}`}>
          <div className="timeline-dot" />
          <div className="timeline-line" />
          <div className="timeline-content">
            <div className="timeline-badge">{it.type === 'approve' ? '✓' : it.type === 'reject' ? '✕' : '👤'}</div>
            <p className="activity-action">{it.action}</p>
            <span className="timeline-time">{it.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [statsData, setStatsData] = useState<AdminStatsResponse | null>(null);
  const [recentActivities, setRecentActivities] = useState<{ action: string; time: string; type: string; ts: number }[]>([]);
  const [activityPage, setActivityPage] = useState(0);
  const activityPageSize = 4;
  const [activityFilter, setActivityFilter] = useState<'all' | 'approve' | 'reject' | 'user'>('all');
  const [isAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('isAuthenticated') === 'true';
    } catch {
      return false;
    }
  });
  
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('authToken') ?? undefined;
    fetchAdminStats(token)
      .then((d) => setStatsData(d))
      .catch(() => {});
    fetchRecentActivities(20, token)
      .then((d) => {
        const items = Array.isArray(d.activities) ? d.activities : [];
        const mapped = items.map((a) => {
          const t = (a.type || '').toLowerCase();
          const cls = t.includes('approved') ? 'approve' : t.includes('reject') || t.includes('rejected') ? 'reject' : 'user';
          const action = a.message || '';
          const time = a.ago || '';
          const ts = Date.parse(a.timestamp || '') || Date.now();
          return { action, time, type: cls, ts };
        });
        setRecentActivities(mapped);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    setActivityPage(0);
  }, [recentActivities, activityFilter]);

  const totalActivityPages = useMemo(() => {
    const filtered = activityFilter === 'all' ? recentActivities : recentActivities.filter((a) => a.type === activityFilter);
    const total = filtered.length;
    const pages = Math.ceil(total / activityPageSize);
    return pages || 1;
  }, [recentActivities, activityFilter]);

  const currentActivities = useMemo(() => {
    const filtered = activityFilter === 'all' ? recentActivities : recentActivities.filter((a) => a.type === activityFilter);
    const start = activityPage * activityPageSize;
    return filtered.slice(start, start + activityPageSize);
  }, [recentActivities, activityPage, activityFilter]);

  const sparkSeries = useMemo(() => {
    const now = Date.now();
    const buckets = new Array(12).fill(0);
    recentActivities.forEach((a) => {
      const dh = (now - a.ts) / 3600000;
      const idx = Math.floor(dh / 2);
      if (idx >= 0 && idx < buckets.length) buckets[buckets.length - 1 - idx] += 1;
    });
    return buckets;
  }, [recentActivities]);

  

  if (!isAuthenticated) {
    return null;
  }

  const formatTrend = (percent: number, direction: 'up' | 'down') => {
    const sign = direction === 'up' ? '+' : '-';
    const v = Math.abs(percent);
    return `${sign}${v}%`;
  };

  const cards = statsData?.cards;
  const totalAds = typeof cards?.total?.count === 'number' ? cards.total.count : 0;
  const activeAds = typeof cards?.active?.count === 'number' ? cards.active.count : 0;
  const pendingAds = typeof cards?.pending?.count === 'number' ? cards.pending.count : 0;
  const rejectedAds = typeof cards?.rejected?.count === 'number' ? cards.rejected.count : 0;
  const othersAds = Math.max(totalAds - (activeAds + pendingAds + rejectedAds), 0);

  const donutSegments: DonutSegment[] = [
    { label: 'نشطة', value: activeAds, color: '#22c55e' },
    { label: 'معلقة', value: pendingAds, color: '#f59e0b' },
    { label: 'مرفوضة', value: rejectedAds, color: '#ef4444' },
    ...(othersAds > 0 ? [{ label: 'أخرى', value: othersAds, color: 'var(--color-primary)' }] : []),
  ];

  const centerTitle = 'إجمالي الإعلانات';
  const centerValue = (totalAds || activeAds + pendingAds + rejectedAds).toLocaleString('en-US');

  const quickActions = [
    { title: 'إدارة الإعلانات', icon: '🔍', color: 'teal', href: '/moderation' },
    { title: 'إدارة الأقسام', icon: '⚙️', color: 'violet', href: '/categories' },
    { title: 'إدارة المستخدمين', icon: '👤', color: 'indigo', href: '/users' },
    { title: 'إدارة الإشعارات', icon: '📣', color: 'pink', href: '/notifications' },
  ];

  

  return (
    <div className="dashboard-container">
      <div className="dashboard-hero">
        <div className="hero-text">
          <h1 className="hero-title">مرحباً بك في لوحة التحكم</h1>
          <p className="hero-subtitle">إدارة شاملة وفعّالة لجميع إعلاناتك</p>
        </div>
        <div className="hero-time">
          <div className="hero-clock">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </div>
          <div className="hero-date">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="charts-section">
        <DonutChart segments={donutSegments} centerTitle={centerTitle} centerValue={centerValue} />
      </div>

      <div className="quick-actions-section">
        <h2 className="section-title">الإجراءات السريعة</h2>
        <div className="quick-actions-grid">
          {quickActions.map((action, index) => (
            <div key={index} className={`quick-action-card action-${action.color}`}>
              <div className="action-icon">{action.icon}</div>
              <h3 className="action-title">{action.title}</h3>
              <button className="action-button" onClick={() => router.push(action.href)}>انتقال<span className="arrow">←</span></button>
            </div>
          ))}
        </div>
      </div>

      <div className="recent-activities-section">
        <h2 className="section-title">النشاطات الأخيرة</h2>
        {/* <ActivitySparkline series={sparkSeries} /> */}
        <div className="activity-filters">
          {[
            { key: 'all', label: 'الكل' },
            { key: 'approve', label: 'موافقات' },
            { key: 'reject', label: 'رفض' },
            { key: 'user', label: 'إداري/مستخدم' },
          ].map((f) => (
            <button
              key={f.key}
              className={`filter-chip ${activityFilter === (f.key as any) ? 'active' : ''}`}
              onClick={() => setActivityFilter(f.key as any)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <ActivityTimeline items={currentActivities} />
        <div className="pagination-container">
          <div className="pagination-info">صفحة {activityPage + 1} من {totalActivityPages}</div>
          <div className="pagination-controls">
            <button
              className="pagination-btn pagination-nav-btn"
              disabled={activityPage <= 0}
              onClick={() => setActivityPage((p) => Math.max(0, p - 1))}
            >
              السابق
            </button>
            <button
              className="pagination-btn pagination-nav-btn"
              disabled={activityPage >= totalActivityPages - 1}
              onClick={() => setActivityPage((p) => Math.min(totalActivityPages - 1, p + 1))}
            >
              التالي
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
