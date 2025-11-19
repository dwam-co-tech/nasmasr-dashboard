'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAdminStats, fetchRecentActivities } from '@/services/adminStats';
import type { AdminStatsResponse } from '@/models/stats';

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [statsData, setStatsData] = useState<AdminStatsResponse | null>(null);
  const [recentActivities, setRecentActivities] = useState<{ action: string; time: string; type: string }[]>([]);
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
          return { action, time, type: cls };
        });
        setRecentActivities(mapped);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  

  if (!isAuthenticated) {
    return null;
  }

  const formatTrend = (percent: number, direction: 'up' | 'down') => {
    const sign = direction === 'up' ? '+' : '-';
    const v = Math.abs(percent);
    return `${sign}${v}%`;
  };

  const cards = statsData?.cards;
  const stats = [
    {
      title: 'إجمالي الإعلانات',
      value: typeof cards?.total?.count === 'number' ? cards.total.count.toLocaleString('en-US') : '0',
      icon: '📢',
      trend: typeof cards?.total?.percent === 'number' && typeof cards?.total?.direction === 'string' ? formatTrend(cards.total.percent, cards.total.direction) : '0%',
      color: 'blue',
    },
    {
      title: 'الإعلانات النشطة',
      value: typeof cards?.active?.count === 'number' ? cards.active.count.toLocaleString('en-US') : '0',
      icon: '✅',
      trend: typeof cards?.active?.percent === 'number' && typeof cards?.active?.direction === 'string' ? formatTrend(cards.active.percent, cards.active.direction) : '0%',
      color: 'green',
    },
    {
      title: 'الاعلانات المعلقة ',
      value: typeof cards?.pending?.count === 'number' ? cards.pending.count.toLocaleString('en-US') : '0',
      icon: '🔍',
      trend: typeof cards?.pending?.percent === 'number' && typeof cards?.pending?.direction === 'string' ? formatTrend(cards.pending.percent, cards.pending.direction) : '0%',
      color: 'orange',
    },
    {
      title: ' الاعلانات المرفوضة',
      value: typeof cards?.rejected?.count === 'number' ? cards.rejected.count.toLocaleString('en-US') : '0',
      icon: '👥',
      trend: typeof cards?.rejected?.percent === 'number' && typeof cards?.rejected?.direction === 'string' ? formatTrend(cards.rejected.percent, cards.rejected.direction) : '0%',
      color: 'red',
    },
  ];

  const quickActions = [
    { title: 'مراجعة الإعلانات', icon: '🔍', color: 'teal' },
    { title: 'إضافة قسم جديد', icon: '➕', color: 'violet' },
    { title: 'إدارة المستخدمين', icon: '👤', color: 'indigo' },
    { title: 'إرسال إشعار', icon: '📣', color: 'pink' },
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

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card stat-${stat.color}`}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-title">{stat.title}</p>
              <span className={`stat-trend ${stat.trend.startsWith('+') ? 'positive' : 'negative'}`}>{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="quick-actions-section">
        <h2 className="section-title">الإجراءات السريعة</h2>
        <div className="quick-actions-grid">
          {quickActions.map((action, index) => (
            <div key={index} className={`quick-action-card action-${action.color}`}>
              <div className="action-icon">{action.icon}</div>
              <h3 className="action-title">{action.title}</h3>
              <button className="action-button" onClick={() => router.push('/dashboard/ads')}>انتقال<span className="arrow">←</span></button>
            </div>
          ))}
        </div>
      </div>

      <div className="recent-activities-section">
        <h2 className="section-title">النشاطات الأخيرة</h2>
        <div className="activities-list">
          {recentActivities.map((activity, index) => (
            <div key={index} className={`activity-item activity-${activity.type}`}>
              <div className="activity-indicator"></div>
              <div className="activity-content">
                <p className="activity-action">{activity.action}</p>
                <span className="activity-time">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}