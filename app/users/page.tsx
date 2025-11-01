'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface User {
  id: string;
  name: string;
  phone: string;
  userCode: string;
  status: 'active' | 'banned';
  registrationDate: string;
  adsCount: number;
  role: string;
  lastLogin: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// Generate 100 mock users
const generateMockUsers = (): User[] => {
  const names = [
    'أحمد محمد علي', 'فاطمة أحمد', 'محمد حسن', 'سارة إبراهيم', 'علي أحمد',
    'نور الدين', 'مريم محمود', 'يوسف عبدالله', 'هدى سالم', 'عمر خالد',
    'ليلى حسام', 'كريم محمد', 'رانيا عادل', 'طارق سعيد', 'دينا أشرف',
    'حسام الدين', 'نادية فؤاد', 'وائل صلاح', 'منى عبدالرحمن', 'أسامة نبيل'
  ];
  
  const roles = ['معلن', 'مستخدم', 'مشرف', 'مراجع'];
  const statuses: ('active' | 'banned')[] = ['active', 'banned'];
  
  const users: User[] = [];
  
  for (let i = 1; i <= 100; i++) {
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    const randomStatus = Math.random() > 0.8 ? 'banned' : 'active'; // 20% chance of being banned
    const randomAdsCount = Math.floor(Math.random() * 50);
    const randomPhone = `+2010${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
    
    // Generate random dates within the last 6 months
    const registrationDate = new Date();
    registrationDate.setDate(registrationDate.getDate() - Math.floor(Math.random() * 180));
    
    const lastLoginDate = new Date();
    lastLoginDate.setDate(lastLoginDate.getDate() - Math.floor(Math.random() * 30));
    
    users.push({
      id: String(i),
      name: `${randomName} ${i}`,
      phone: randomPhone,
      userCode: `USR${String(i).padStart(3, '0')}`,
      status: randomStatus,
      registrationDate: registrationDate.toISOString().split('T')[0],
      adsCount: randomAdsCount,
      role: randomRole,
      lastLogin: lastLoginDate.toISOString().split('T')[0]
    });
  }
  
  return users;
};

const mockUsers: User[] = generateMockUsers();

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('data');
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const usersPerPage = 10;

  // Mock ads data with categories and images
  const mockAds = [
    {
      id: '1',
      title: 'شقة للبيع في المعادي',
      status: 'منشور',
      publishDate: '2024-01-15',
      category: 'عقارات',
      image: '/flat.jpg'
    },
    {
      id: '2',
      title: 'سيارة BMW للبيع',
      status: 'قيد المراجعة',
      publishDate: '2024-01-18',
      category: 'سيارات',
      image: '/car.webp'
    },
    {
      id: '3',
      title: 'لابتوب Dell للبيع',
      status: 'منشور',
      publishDate: '2024-01-20',
      category: 'إلكترونيات',
      image: '/laptop.jpg'
    },
    {
      id: '4',
      title: 'سيارة تويوتا 2020',
      status: 'منشور',
      publishDate: '2024-01-22',
      category: 'سيارات',
      image: '/car2.webp'
    }
  ];

  const categories = ['all', 'عقارات', 'سيارات', 'إلكترونيات'];

  // Filter ads by category
  const filteredAds = selectedCategory === 'all' 
    ? mockAds 
    : mockAds.filter(ad => ad.category === selectedCategory);
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm) ||
    user.userCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Toast functions
  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type };
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleBanUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    const newStatus = user?.status === 'active' ? 'banned' : 'active';
    
    setUsers(users.map(user =>
      user.id === userId
        ? { ...user, status: newStatus }
        : user
    ));
    
    showToast(
      newStatus === 'banned' 
        ? `تم حظر المستخدم ${user?.name} بنجاح` 
        : `تم إلغاء حظر المستخدم ${user?.name} بنجاح`,
      'success'
    );
  };

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setShowUserProfile(true);
  };

  const handleResetPassword = (userId: string) => {
    const user = users.find(u => u.id === userId);
    showToast(`تم إرسال رابط إعادة تعيين كلمة السر للمستخدم ${user?.name}`, 'success');
  };

  const handleChangePassword = (userId: string) => {
    const user = users.find(u => u.id === userId);
    const newPassword = Math.random().toString(36).slice(-8); // Generate random password
    
    // Update user data (in real app, this would be an API call)
    setUsers(users.map(u => 
      u.id === userId 
        ? { ...u, lastLogin: new Date().toISOString().split('T')[0] }
        : u
    ));
    
    showToast(`تم تغيير كلمة السر للمستخدم ${user?.name} بنجاح. كلمة السر الجديدة: ${newPassword}`, 'success');
  };

  const handleSetPIN = (userId: string) => {
    const user = users.find(u => u.id === userId);
    const newPIN = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit PIN
    
    // Update user data (in real app, this would be an API call)
    setUsers(users.map(u => 
      u.id === userId 
        ? { ...u, lastLogin: new Date().toISOString().split('T')[0] }
        : u
    ));
    
    showToast(`تم تعيين الرقم السري للمستخدم ${user?.name} بنجاح. الرقم السري الجديد: ${newPIN}`, 'success');
  };

  // Pagination functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Export filtered users to Excel with Arabic headers and values
  const exportToExcel = async (data: User[], filename: string) => {
    if (!data || data.length === 0) {
      showToast('لا توجد بيانات للتصدير', 'warning');
      return;
    }

    const rows = data.map(u => ({
      'الاسم': u.name,
      'رقم الهاتف': u.phone,
      'كود المستخدم': u.userCode,
      'الحالة': u.status === 'active' ? 'نشط' : 'محظور',
      'تاريخ التسجيل': u.registrationDate,
      'عدد الإعلانات': u.adsCount,
      'الدور': u.role,
      'آخر تسجيل دخول': u.lastLogin,
    }));

    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'المستخدمون');
      XLSX.writeFile(wb, `${filename}.xlsx`);
      showToast('تم إنشاء ملف Excel بنجاح', 'success');
    } catch (e) {
      console.error('Excel export failed', e);
      showToast('تعذر إنشاء ملف Excel، حاول لاحقًا', 'error');
    }
  };

  if (showUserProfile && selectedUser) {
    return (
      <div className="users-page">
        <div className="users-header">
          <div className="header-content">
            <button 
              className="back-btn"
              onClick={() => setShowUserProfile(false)}
            >
              ← العودة للقائمة
            </button>
            <h1>ملف المستخدم: {selectedUser.name}</h1>
            <p>كود المستخدم: {selectedUser.userCode}</p>
          </div>
        </div>

        <div className="user-profile-container">
          <div className="profile-tabs">
            <button 
              className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
              onClick={() => setActiveTab('data')}
            >
              البيانات 
            </button>
            <button 
              className={`tab-btn ${activeTab === 'ads' ? 'active' : ''}`}
              onClick={() => setActiveTab('ads')}
            >
              الإعلانات
            </button>
            <button 
              className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              المعاملات
            </button>
            <button 
              className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              السجل
            </button>
            <button 
              className={`tab-btn ${activeTab === 'permissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('permissions')}
            >
              الأذونات
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'data' && (
              <div className="user-data-tab">
                <div className="data-grid">
                  <div className="data-item">
                    <label>الاسم الكامل:</label>
                    <span>{selectedUser.name}</span>
                  </div>
                  <div className="data-item">
                    <label>رقم الهاتف:</label>
                    <span>{selectedUser.phone}</span>
                  </div>
                  <div className="data-item">
                    <label>كود المستخدم:</label>
                    <span>{selectedUser.userCode}</span>
                  </div>
                  <div className="data-item">
                    <label>الحالة:</label>
                    <span className={`status-badge ${selectedUser.status}`}>
                      {selectedUser.status === 'active' ? 'نشط' : 'محظور'}
                    </span>
                  </div>
                  <div className="data-item">
                    <label>تاريخ التسجيل:</label>
                    <span>{selectedUser.registrationDate}</span>
                  </div>
                  <div className="data-item">
                    <label>آخر تسجيل دخول:</label>
                    <span>{selectedUser.lastLogin}</span>
                  </div>
                  <div className="data-item">
                    <label>الدور:</label>
                    <span>{selectedUser.role}</span>
                  </div>
                  <div className="data-item">
                    <label>عدد الإعلانات:</label>
                    <span>{selectedUser.adsCount}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ads' && (
              <div className="user-ads-tab">
                <div className="ads-header">
                  <h3>إعلانات المستخدم</h3>
                  <div className="ads-filter">
                    <label htmlFor="category-filter">فلترة حسب القسم:</label>
                    <select 
                      id="category-filter"
                      value={selectedCategory} 
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="category-select"
                    >
                      <option value="all">جميع الأقسام</option>
                      {categories.filter(cat => cat !== 'all').map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="ads-list">
                  {filteredAds.length > 0 ? (
                    filteredAds.map((ad) => (
                      <div key={ad.id} className="ad-item">
                        <div className="ad-image">
                          <Image 
                            src={ad.image} 
                            alt={ad.title}
                            width={120}
                            height={90}
                            style={{ objectFit: 'cover', borderRadius: '8px' }}
                          />
                        </div>
                        <div className="ad-content">
                          <h4>{ad.title}</h4>
                          <div className="ad-details">
                            <p><span className="detail-label">القسم:</span> <span className="category-badge">{ad.category}</span></p>
                            <p><span className="detail-label">الحالة:</span> <span className={`status-badge ${ad.status === 'منشور' ? 'published' : 'pending'}`}>{ad.status}</span></p>
                            <p><span className="detail-label">تاريخ النشر:</span> {ad.publishDate}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-ads-message">
                      <div className="no-ads-icon">📢</div>
                      <p>لا توجد إعلانات في هذا القسم</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="user-transactions-tab">
                <h3>المعاملات المالية</h3>
                <div className="transactions-list">
                  <div className="transaction-item">
                    <span>رسوم إعلان</span>
                    <span>-50 جنيه</span>
                    <span>2024-01-15</span>
                  </div>
                  <div className="transaction-item">
                    <span>إيداع</span>
                    <span>+200 جنيه</span>
                    <span>2024-01-10</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="user-logs-tab">
                <h3>سجل النشاطات</h3>
                <div className="logs-list">
                  <div className="log-item">
                    <span>تسجيل دخول</span>
                    <span>2024-01-20 10:30</span>
                  </div>
                  <div className="log-item">
                    <span>نشر إعلان جديد</span>
                    <span>2024-01-18 14:20</span>
                  </div>
                  <div className="log-item">
                    <span>تعديل الملف الشخصي</span>
                    <span>2024-01-15 09:15</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="user-permissions-tab">
                <h3>الأذونات والصلاحيات</h3>
                <div className="permissions-list">
                  <div className="permission-item">
                    <label>
                      <input type="checkbox" defaultChecked />
                      نشر الإعلانات
                    </label>
                  </div>
                  <div className="permission-item">
                    <label>
                      <input type="checkbox" defaultChecked />
                      تعديل الملف الشخصي
                    </label>
                  </div>
                  <div className="permission-item">
                    <label>
                      <input type="checkbox" />
                      الوصول للإحصائيات المتقدمة
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-content">
              <span className="toast-message">{toast.message}</span>
              <button 
                className="toast-close"
                onClick={() => removeToast(toast.id)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="users-header">
        <div className="header-content">
          <h1>المستخدمون والمعلِنون</h1>
          <p>إدارة حسابات المستخدمين والمعلنين</p>
        </div>
      </div>

      <div className="users-content">
        <div className="search-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="البحث برقم الهاتف أو كود المستخدم أو الاسم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button className="search-btn">🔍</button>
          </div>
        </div>

        {/* Results Info */}
        <div className="results-info">
          <div className="results-count">
            عرض {startIndex + 1} - {Math.min(endIndex, filteredUsers.length)} من {filteredUsers.length} مستخدم
          </div>
          <div className="page-info">
            الصفحة {currentPage} من {totalPages}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="users-table-container desktop-view">
          <div className="table-actions">
            <button
              className="btn-export-table excel"
              onClick={() => exportToExcel(filteredUsers, 'users-export')}
            >
              تصدير Excel
            </button>
          </div>
          <table className="users-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>رقم الهاتف</th>
                <th>كود المستخدم</th>
                <th>الحالة</th>
                <th>تاريخ التسجيل</th>
                <th>عدد الإعلانات</th>
                <th>الدور</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <tr key={user.id}>
                  <td className="user-name">{user.name}</td>
                  <td className="user-phone">{user.phone}</td>
                  <td className="user-code">{user.userCode}</td>
                  <td>
                    <span className={`status-badge ${user.status}`}>
                      {user.status === 'active' ? 'نشط' : 'محظور'}
                    </span>
                  </td>
                  <td className="registration-date">{user.registrationDate}</td>
                  <td className="ads-count">{user.adsCount}</td>
                  <td className="user-role">{user.role}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-view"
                        onClick={() => handleViewProfile(user)}
                        title="عرض الملف الشخصي"
                      >
                        عرض
                      </button>
                      <button
                        className={`btn-ban ${user.status === 'banned' ? 'unban' : ''}`}
                        onClick={() => handleBanUser(user.id)}
                        title={user.status === 'active' ? 'حظر المستخدم' : 'إلغاء الحظر'}
                      >
                        {user.status === 'active' ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
                            <path d="m4.9 4.9 14.2 14.2" stroke="white" strokeWidth="2"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
                          </svg>
                        )}
                      </button>
                      <button
                        className="btn-reset-password"
                        onClick={() => handleResetPassword(user.id)}
                        title="إعادة تعيين كلمة السر"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M21 3v5h-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 16H3v5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {/* <button
                        className="btn-change-password"
                        onClick={() => handleChangePassword(user.id)}
                        title="تغيير كلمة السر"
                      >
                        🔑
                      </button> */}
                      <button
                        className="btn-set-pin"
                        onClick={() => handleSetPIN(user.id)}
                        title="تغيير كلمة السر"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="white" strokeWidth="2"/>
                          <circle cx="12" cy="16" r="1" fill="white"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="white" strokeWidth="2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="users-cards-container mobile-view">
          {currentUsers.map((user) => (
            <div key={user.id} className="user-card">
              <div className="card-header">
                <div className="user-info">
                  <h3 className="user-name">{user.name}</h3>
                  <span className="user-code">{user.userCode}</span>
                </div>
                <span className={`status-badge ${user.status}`}>
                  {user.status === 'active' ? 'نشط' : 'محظور'}
                </span>
              </div>
              
              <div className="card-body">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">رقم الهاتف:</span>
                    <span className="info-value">{user.phone}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">الدور:</span>
                    <span className="info-value">{user.role}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">تاريخ التسجيل:</span>
                    <span className="info-value">{user.registrationDate}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">عدد الإعلانات:</span>
                    <span className="info-value">{user.adsCount}</span>
                  </div>
                </div>
              </div>
              
              <div className="card-actions">
                <button
                  className="btn-view"
                  onClick={() => handleViewProfile(user)}
                  title="عرض الملف الشخصي"
                >
                  عرض الملف
                </button>
                <button
                  className={`btn-ban ${user.status === 'banned' ? 'unban' : ''}`}
                  onClick={() => handleBanUser(user.id)}
                  title={user.status === 'active' ? 'حظر المستخدم' : 'إلغاء الحظر'}
                >
                  {user.status === 'active' ? 'حظر' : 'إلغاء الحظر'}
                </button>
                <button
                  className="btn-reset-password"
                  onClick={() => handleResetPassword(user.id)}
                  title="إعادة تعيين كلمة السر"
                >
                  إعادة تعيين
                </button>
                <button
                  className="btn-change-password"
                  onClick={() => handleChangePassword(user.id)}
                  title="تغيير كلمة السر"
                >
                  تغيير كلمة السر
                </button>
                <button
                  className="btn-set-pin"
                  onClick={() => handleSetPIN(user.id)}
                  title="تعيين PIN"
                >
                  تعيين PIN
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              عرض {filteredUsers.length} مستخدم في {totalPages} صفحة
            </div>
            
            <div className="pagination">
              <button 
                className="pagination-btn pagination-nav"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
              >
                السابق
              </button>
              
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  className={`pagination-btn ${
                    page === currentPage ? 'active' : ''
                  } ${page === '...' ? 'pagination-dots' : ''}`}
                  onClick={() => typeof page === 'number' && goToPage(page)}
                  disabled={page === '...'}
                >
                  {page}
                </button>
              ))}
              
              <button 
                className="pagination-btn pagination-nav"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>لا توجد نتائج</h3>
            <p>لم يتم العثور على مستخدمين يطابقون البحث</p>
          </div>
        )}
      </div>
    </div>
  );
}