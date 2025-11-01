'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const authStatus = localStorage.getItem('isAuthenticated');
      if (authStatus === 'true') {
        setIsAuthenticated(true);
      } else {
        router.push('/auth/login');
        return;
      }
      setIsLoading(false);
    };

    checkAuth();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        جاري التحميل...
      </div>
    );
  }

  // Don't render the dashboard if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const stats = [
    { title: 'إجمالي الإعلانات', value: '1,234', icon: '📢', trend: '+12%', color: 'blue' },
    { title: 'الإعلانات النشطة', value: '856', icon: '✅', trend: '+8%', color: 'green' },
    { title: 'الإعلانات المعلقة', value: '234', icon: '⏳', trend: '-3%', color: 'orange' },
    { title: 'الإعلانات المرفوضة', value: '144', icon: '❌', trend: '-15%', color: 'red' },
  ];

  const quickActions = [
    { title: 'إضافة إعلان جديد', icon: '➕', href: '/ads/new', color: 'blue' },
    { title: 'مراجعة الإعلانات', icon: '✅', href: '/ads', color: 'green' },
    { title: 'التقارير والإحصائيات', icon: '📊', href: '/reports', color: 'purple' },
    { title: 'إعدادات النظام', icon: '⚙️', href: '/settings', color: 'gray' },
  ];

  const recentActivities = [
    { action: 'تم إضافة إعلان جديد', time: 'منذ 5 دقائق', type: 'success' },
    { action: 'تم رفض إعلان', time: 'منذ 15 دقيقة', type: 'error' },
    { action: 'تم تفعيل إعلان', time: 'منذ 30 دقيقة', type: 'success' },
    { action: 'تم تحديث الإعدادات', time: 'منذ ساعة', type: 'info' },
  ];

  return (
    <div className="homepage-container">
      {/* Header Section */}
      <div className="homepage-header">
        <div className="welcome-section">
          <h1 className="welcome-title">
            مرحبًا بك في لوحة التحكم
          </h1>
          <p className="welcome-subtitle">
            إدارة شاملة وفعالة لجميع إعلاناتك
          </p>
        </div>
        <div className="time-section">
          <div className="current-time">
            {currentTime.toLocaleTimeString('en-US')}
          </div>
          <div className="current-date">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card stat-${stat.color}`}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-title">{stat.title}</p>
              <span className={`stat-trend ${stat.trend.startsWith('+') ? 'positive' : 'negative'}`}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2 className="section-title">الإجراءات السريعة</h2>
        <div className="quick-actions-grid">
          {quickActions.map((action, index) => (
            <div key={index} className={`quick-action-card action-${action.color}`}>
              <div className="action-icon">{action.icon}</div>
              <h3 className="action-title">{action.title}</h3>
              <button className="action-button">
                انتقال
                <span className="arrow">←</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
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

      {/* System Status */}
      {/* <div className="system-status-section">
        <h2 className="section-title">حالة النظام</h2>
        <div className="status-grid">
          <div className="status-item status-online">
            <div className="status-indicator"></div>
            <span>الخادم متصل</span>
          </div>
          <div className="status-item status-online">
            <div className="status-indicator"></div>
            <span>قاعدة البيانات متصلة</span>
          </div>
          <div className="status-item status-online">
            <div className="status-indicator"></div>
            <span>النسخ الاحتياطي محدث</span>
          </div>
        </div>
      </div> */}
    </div>
  );
}
