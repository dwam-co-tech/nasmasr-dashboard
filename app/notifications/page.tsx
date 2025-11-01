'use client';

import { useEffect, useMemo, useState } from 'react';

interface AdRequest {
  id: string;
  title: string;
  advertiser: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  description: string;
  price: number;
  location: string;
  phone?: string;
  email?: string;
}

interface QuickReply {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function NotificationsPage() {
  const [showQuickReplyModal, setShowQuickReplyModal] = useState(false);
  const [selectedAdRequest, setSelectedAdRequest] = useState<AdRequest | null>(null);
  const [showAdDetails, setShowAdDetails] = useState(false);
  const [editingQuickReply, setEditingQuickReply] = useState<QuickReply | null>(null);
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 3;
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [adRequests, setAdRequests] = useState<AdRequest[]>([
    {
      id: '1',
      title: 'شقة للإيجار في المعادي',
      advertiser: 'أحمد محمد',
      category: 'عقارات',
      status: 'pending',
      submittedAt: '2024-01-15 10:30',
      description: 'شقة 3 غرف وصالة في موقع متميز بالمعادي، الدور الثالث، مساحة 120 متر مربع، مفروشة بالكامل',
      price: 15000,
      location: 'المعادي، القاهرة',
      phone: '01234567890',
      email: 'ahmed.mohamed@email.com'
    },
    {
      id: '2',
      title: 'سيارة تويوتا كامري 2020',
      advertiser: 'سارة أحمد',
      category: 'سيارات',
      status: 'pending',
      submittedAt: '2024-01-15 14:20',
      description: 'سيارة في حالة ممتازة، قطعت 50 ألف كيلو فقط، صيانة دورية منتظمة، لون أبيض',
      price: 280000,
      location: 'الجيزة',
      phone: '01098765432',
      email: 'sara.ahmed@email.com'
    },
    {
      id: '3',
      title: 'لابتوب ديل للبيع',
      advertiser: 'محمد علي',
      category: 'إلكترونيات',
      status: 'approved',
      submittedAt: '2024-01-14 16:45',
      description: 'لابتوب ديل انسبايرون 15، معالج i7 الجيل العاشر، رام 16 جيجا، هارد SSD 512 جيجا',
      price: 25000,
      location: 'الإسكندرية',
      phone: '01156789012',
      email: 'mohamed.ali@email.com'
    },
    {
      id: '4',
      title: 'وظيفة مطور ويب',
      advertiser: 'شركة التقنية المتقدمة',
      category: 'وظائف',
      status: 'rejected',
      submittedAt: '2024-01-14 09:15',
      description: 'مطلوب مطور ويب بخبرة 3 سنوات في React و Node.js، راتب مجزي ومزايا ممتازة',
      price: 0,
      location: 'القاهرة الجديدة',
      phone: '01234567891',
      email: 'hr@techcompany.com'
    },
    {
      id: '5',
      title: 'محل تجاري للإيجار',
      advertiser: 'خالد حسن',
      category: 'عقارات',
      status: 'pending',
      submittedAt: '2024-01-15 08:15',
      description: 'محل تجاري في شارع رئيسي، مساحة 80 متر، مناسب لجميع الأنشطة التجارية',
      price: 25000,
      location: 'وسط البلد، القاهرة',
      phone: '01087654321',
      email: 'khaled.hassan@email.com'
    },
    {
      id: '6',
      title: 'دراجة نارية بحالة ممتازة',
      advertiser: 'محمود حسين',
      category: 'سيارات',
      status: 'pending',
      submittedAt: '2024-01-13 11:20',
      description: 'دراجة نارية 250cc، استخدام خفيف، لا تحتاج أي مصاريف إضافية',
      price: 32000,
      location: 'طنطا',
      phone: '01011223344',
      email: 'mahmoud.hussein@email.com'
    },
    {
      id: '7',
      title: 'قطعة أرض سكنية للبيع',
      advertiser: 'شركة المعمار',
      category: 'عقارات',
      status: 'pending',
      submittedAt: '2024-01-12 10:00',
      description: 'قطعة أرض 200 متر في منطقة سكنية هادئة، جميع المرافق متوفرة',
      price: 450000,
      location: 'المنصورة',
      phone: '01220003344',
      email: 'sales@elmamar.com'
    },
    {
      id: '8',
      title: 'هاتف آيفون 13 برو ماكس',
      advertiser: 'عبدالله سمير',
      category: 'إلكترونيات',
      status: 'approved',
      submittedAt: '2024-01-15 19:45',
      description: 'الهاتف بحالة ممتازة، ذاكرة 256 جيجا، مع العلبة وجميع الملحقات',
      price: 43000,
      location: 'القاهرة',
      phone: '01122334455',
      email: 'abdallah.samir@email.com'
    },
    {
      id: '9',
      title: 'وظيفة محاسب',
      advertiser: 'شركة الأمل',
      category: 'وظائف',
      status: 'pending',
      submittedAt: '2024-01-16 09:05',
      description: 'مطلوب محاسب خبرة سنتين، إجادة برامج المحاسبة والExcel، دوام كامل',
      price: 0,
      location: 'مدينة نصر',
      phone: '01233445566',
      email: 'hr@elamal.com'
    },
    {
      id: '10',
      title: 'فيلا للبيع بكمبوند راقي',
      advertiser: 'معتز عبدالحميد',
      category: 'عقارات',
      status: 'pending',
      submittedAt: '2024-01-16 10:30',
      description: 'فيلا 350 متر، تشطيب فندقي، حديقة خاصة، قريبة من الخدمات',
      price: 5500000,
      location: '6 أكتوبر',
      phone: '01099887766',
      email: 'moataz.abdelhamid@email.com'
    }
  ]);

  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([
    {
      id: '1',
      title: 'رد تلقائي للاستفسارات العامة',
      content: 'شكراً لتواصلك معنا. سيتم الرد عليك في أقرب وقت ممكن.',
      category: 'عام'
    },
    {
      id: '2',
      title: 'رد للشكاوى',
      content: 'نعتذر عن أي إزعاج. سيتم مراجعة شكواك والرد عليك خلال 24 ساعة.',
      category: 'شكاوى'
    },
    {
      id: '3',
      title: 'رد لطلبات الدعم الفني',
      content: 'تم استلام طلب الدعم الفني الخاص بك. سيتواصل معك فريق الدعم قريباً.',
      category: 'دعم فني'
    }
  ]);

  const [quickReplyForm, setQuickReplyForm] = useState({
    title: '',
    content: '',
    category: ''
  });

  const handleQuickReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickReplyForm.title || !quickReplyForm.content || !quickReplyForm.category) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (editingQuickReply) {
      setQuickReplies(prev => prev.map(r => r.id === editingQuickReply.id ? { ...editingQuickReply, ...quickReplyForm } : r));
      setEditingQuickReply(null);
      setShowQuickReplyModal(false);
      setQuickReplyForm({ title: '', content: '', category: '' });
      showToast('تم حفظ التعديلات بنجاح', 'success');
    } else {
      const newQuickReply: QuickReply = {
        id: Date.now().toString(),
        title: quickReplyForm.title,
        content: quickReplyForm.content,
        category: quickReplyForm.category
      };
      setQuickReplies([...quickReplies, newQuickReply]);
      setQuickReplyForm({ title: '', content: '', category: '' });
      setShowQuickReplyModal(false);
      showToast('تم إضافة الرد السريع بنجاح', 'success');
    }
  };

  const handleViewAdDetails = (ad: AdRequest) => {
    setSelectedAdRequest(ad);
    setShowAdDetails(true);
  };

  const handleDeleteQuickReply = (id: string) => {
    setQuickReplies(prev => prev.filter(reply => reply.id !== id));
    showToast('تم حذف الرد السريع', 'info');
  };

  const handleCopyQuickReply = async (reply: QuickReply) => {
    try {
      await navigator.clipboard.writeText(reply.content);
      showToast('تم نسخ محتوى الرد', 'success');
    } catch (err) {
      showToast('تعذر نسخ المحتوى، حاول مرة أخرى', 'error');
    }
  };

  const handleEditQuickReply = (reply: QuickReply) => {
    setEditingQuickReply(reply);
    setQuickReplyForm({ title: reply.title, content: reply.content, category: reply.category });
    setShowQuickReplyModal(true);
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'غير محدد';
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const isWithinRange = (submittedAt: string, start: string, end: string) => {
    const sub = new Date(submittedAt);
    const s = start ? new Date(start) : null;
    const e = end ? new Date(end) : null;
    if (s && sub < s) return false;
    if (e) {
      const endOfDay = new Date(e);
      endOfDay.setHours(23, 59, 59, 999);
      if (sub > endOfDay) return false;
    }
    return true;
  };

  const filteredAdRequests = useMemo(() => {
    return adRequests.filter(ad => isWithinRange(ad.submittedAt, dateFilter.start, dateFilter.end));
  }, [adRequests, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAdRequests.length / pageSize));
  const paginatedAdRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAdRequests.slice(startIndex, startIndex + pageSize);
  }, [filteredAdRequests, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages]);

  return (
    <div className="notifications-page">
      {/* Header */}
      <div className="notifications-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">الإشعارات والرسائل</h1>
            <p className="page-description">سجل إشعارات طلبات نشر الإعلانات</p>
          </div>
        </div>
      </div>

      {/* Ad Requests Section */}
      <div className="campaigns-section">
        <div className="section-header">
          <h3>طلبات نشر الإعلانات</h3>
        </div>
        {/* Date Filter */}
        <div className="filter-bar">
          <span className="filter-label">فلتر بالتاريخ:</span>
          <div className="filter-group">
            <label className="filter-label">من</label>
            <input
              className="filter-input"
              type="date"
              value={dateFilter.start}
              onChange={(e) => { setDateFilter({ ...dateFilter, start: e.target.value }); setCurrentPage(1); }}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label">إلى</label>
            <input
              className="filter-input"
              type="date"
              value={dateFilter.end}
              onChange={(e) => { setDateFilter({ ...dateFilter, end: e.target.value }); setCurrentPage(1); }}
            />
          </div>
          <button
            className="btn-cancel filter-reset"
            onClick={() => { setDateFilter({ start: '', end: '' }); setCurrentPage(1); }}
          >
            إعادة تعيين الفلتر
          </button>
        </div>

        <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {paginatedAdRequests.length === 0 && (
            <div style={{ background: 'white', border: '1px dashed #d1d5db', borderRadius: '12px', padding: '20px', color: '#6b7280' }}>
              لا توجد إشعارات حسب الفلتر المحدد
            </div>
          )}
          {paginatedAdRequests.map((ad) => (
            <div key={ad.id} className="notification-item" style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onClick={() => handleViewAdDetails(ad)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#1f2937' }}>{ad.title}</h4>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px', fontSize: '0.9rem', color: '#6b7280' }}>
                    <span> {ad.advertiser}</span>
                    <span> {ad.category}</span>
                    <span> {ad.location}</span>
                    <span> {formatPrice(ad.price)}</span>
                  </div>
                  
                  <p style={{ margin: '0 0 8px 0', color: '#4b5563', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {ad.description.length > 100 ? `${ad.description.substring(0, 100)}...` : ad.description}
                  </p>
                  
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af' }}>
                    تم التقديم: {formatDate(ad.submittedAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {filteredAdRequests.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
            <button
              className="btn-cancel"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              السابق
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: page === currentPage ? '#111827' : 'white', color: page === currentPage ? 'white' : '#111827', fontWeight: 600 }}
              >
                {page}
              </button>
            ))}
            <button
              className="btn-submit"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              التالي
            </button>
          </div>
        )}
      </div>

      {/* Quick Replies Section */}
      <div className="quick-replies-section">
        <div className="section-header">
          <h3>الردود السريعة</h3>
          <button 
            className="btn-submit"
            onClick={() => setShowQuickReplyModal(true)}
          >
            إضافة رد سريع
          </button>
        </div>
        
        <div className="quick-replies-grid">
          {quickReplies.map((reply) => (
            <div key={reply.id} className="quick-reply-card">
              <div className="card-header">
                <h4>{reply.title}</h4>
                <span className="category-badge">{reply.category}</span>
              </div>
              <div className="card-body">
                <p>{reply.content}</p>
              </div>
              <div className="card-actions">
                <div className="action-buttons">
                  <button className="btn-action copy" onClick={() => handleCopyQuickReply(reply)}>نسخ</button>
                  <button className="btn-action edit" onClick={() => handleEditQuickReply(reply)}>تعديل</button>
                  <button 
                    className="btn-action delete"
                    onClick={() => handleDeleteQuickReply(reply.id)}
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ad Details Modal */}
      {showAdDetails && selectedAdRequest && (
        <div className="modal-overlay" onClick={() => setShowAdDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>تفاصيل طلب الإعلان</h3>
              <button className="modal-close" onClick={() => setShowAdDetails(false)}>×</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: '600' }}>{selectedAdRequest.title}</h4>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <strong>المعلن:</strong> {selectedAdRequest.advertiser}
                </div>
                <div>
                  <strong>الفئة:</strong> {selectedAdRequest.category}
                </div>
                <div>
                  <strong>الموقع:</strong> {selectedAdRequest.location}
                </div>
                <div>
                  <strong>السعر:</strong> {formatPrice(selectedAdRequest.price)}
                </div>
                {selectedAdRequest.phone && (
                  <div>
                    <strong>الهاتف:</strong> {selectedAdRequest.phone}
                  </div>
                )}
                {selectedAdRequest.email && (
                  <div>
                    <strong>البريد الإلكتروني:</strong> {selectedAdRequest.email}
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <strong>الوصف:</strong>
                <p style={{ margin: '8px 0 0 0', lineHeight: '1.6', color: '#4b5563' }}>{selectedAdRequest.description}</p>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <strong>تاريخ التقديم:</strong> {formatDate(selectedAdRequest.submittedAt)}
              </div>
              
              <div className="form-actions">
                <button className="btn-cancel" onClick={() => setShowAdDetails(false)}>إغلاق</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Reply Modal */}
      {showQuickReplyModal && (
        <div className="modal-overlay" onClick={() => { setShowQuickReplyModal(false); setEditingQuickReply(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingQuickReply ? 'تعديل رد سريع' : 'إضافة رد سريع جديد'}</h3>
              <button className="modal-close" onClick={() => { setShowQuickReplyModal(false); setEditingQuickReply(null); }}>×</button>
            </div>
            <form className="quick-reply-form" onSubmit={handleQuickReplySubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>عنوان الرد</label>
                  <input
                    type="text"
                    value={quickReplyForm.title}
                    onChange={(e) => setQuickReplyForm({...quickReplyForm, title: e.target.value})}
                    placeholder="أدخل عنوان الرد السريع"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>الفئة</label>
                  <select
                    value={quickReplyForm.category}
                    onChange={(e) => setQuickReplyForm({...quickReplyForm, category: e.target.value})}
                    required
                  >
                    <option value="">اختر الفئة</option>
                    <option value="عام">عام</option>
                    <option value="شكاوى">شكاوى</option>
                    <option value="دعم فني">دعم فني</option>
                    <option value="استفسارات">استفسارات</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>محتوى الرد</label>
                  <textarea
                    value={quickReplyForm.content}
                    onChange={(e) => setQuickReplyForm({...quickReplyForm, content: e.target.value})}
                    placeholder="أدخل محتوى الرد السريع"
                    rows={4}
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => { setShowQuickReplyModal(false); setEditingQuickReply(null); }}>
                  إلغاء
                </button>
                <button type="submit" className="btn-submit">
                  {editingQuickReply ? 'حفظ التعديلات' : 'إضافة الرد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div style={{ position: 'fixed', bottom: '24px', left: '24px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1000 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: t.type === 'success' ? '#10b981' : t.type === 'error' ? '#ef4444' : '#374151', color: 'white', padding: '10px 14px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontWeight: 600, minWidth: '220px' }}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
