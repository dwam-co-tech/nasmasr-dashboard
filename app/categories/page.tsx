'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Category {
  id: number;
  name: string;
  icon: string;
  status: 'active' | 'disabled';
  order: number;
  customFields: { [key: string]: string };
  showOnHomepage: boolean;
  homepageImage?: string;
  cardsCount?: number;
}

const initialCategories: Category[] = [
  { id: 1, name: 'إيجار السيارات', icon: '🚗', status: 'active', order: 1, customFields: { 'نوع السيارة': 'text', 'السعر اليومي': 'number' }, showOnHomepage: true, cardsCount: 6 },
  { id: 2, name: 'عقارات', icon: '🏠', status: 'active', order: 2, customFields: { 'نوع العقار': 'select', 'المساحة': 'number', 'السعر': 'number' }, showOnHomepage: true, cardsCount: 8 },
  { id: 3, name: 'السيارات', icon: '🚙', status: 'active', order: 3, customFields: { 'الماركة': 'text', 'الموديل': 'text', 'سنة الصنع': 'number' }, showOnHomepage: true, cardsCount: 10 },
  { id: 4, name: 'قطع غيار السيارات', icon: '🔧', status: 'active', order: 4, customFields: { 'نوع القطعة': 'text', 'متوافق مع': 'text' }, showOnHomepage: false },
  { id: 5, name: 'المدرسين', icon: '👨‍🏫', status: 'active', order: 5, customFields: { 'التخصص': 'select', 'المؤهل العلمي': 'select', 'سنوات الخبرة': 'number' }, showOnHomepage: true, cardsCount: 4 },
  { id: 6, name: 'أطباء', icon: '👨‍⚕️', status: 'active', order: 6, customFields: { 'التخصص': 'select', 'الدرجة العلمية': 'select', 'العيادة': 'text' }, showOnHomepage: true, cardsCount: 6 },
  { id: 7, name: 'الوظائف', icon: '💼', status: 'active', order: 7, customFields: { 'نوع العقد': 'select', 'الراتب': 'number', 'المؤهل المطلوب': 'select' }, showOnHomepage: true, cardsCount: 12 },
  { id: 8, name: 'منتجات غذائية', icon: '🍎', status: 'active', order: 8, customFields: { 'نوع المنتج': 'text', 'تاريخ الانتهاء': 'date' }, showOnHomepage: false },
  { id: 9, name: 'المطاعم', icon: '🍕', status: 'active', order: 9, customFields: { 'نوع المطبخ': 'select', 'التقييم': 'number' }, showOnHomepage: true, cardsCount: 8 },
  { id: 10, name: 'المتاجر والمولات', icon: '🏬', status: 'active', order: 10, customFields: { 'نوع المتجر': 'text', 'المنطقة': 'text' }, showOnHomepage: false },
  { id: 11, name: 'محلات غذائية', icon: '🍎', status: 'active', order: 11, customFields: { 'نوع المحل': 'text', 'ساعات العمل': 'text' }, showOnHomepage: true, cardsCount: 6 },
  { id: 12, name: 'خدمات وصيانة المنازل', icon: '🔨', status: 'active', order: 12, customFields: { 'نوع الخدمة': 'select', 'المنطقة': 'text' }, showOnHomepage: true, cardsCount: 8 },
  { id: 13, name: 'الأثاث', icon: '🚛', status: 'active', order: 13, customFields: { 'نوع الأثاث': 'text', 'الحالة': 'select' }, showOnHomepage: true, cardsCount: 6 },
  { id: 14, name: 'أدوات منزلية', icon: '🏠', status: 'active', order: 14, customFields: { 'نوع الأداة': 'text', 'الحالة': 'select' }, showOnHomepage: false },
  { id: 15, name: 'الأجهزة المنزلية', icon: '📺', status: 'active', order: 15, customFields: { 'نوع الجهاز': 'text', 'الماركة': 'text' }, showOnHomepage: true, cardsCount: 8 },
  { id: 16, name: 'إلكترونيات', icon: '💻', status: 'active', order: 16, customFields: { 'نوع الجهاز': 'text', 'الماركة': 'text' }, showOnHomepage: true, cardsCount: 10 },
  { id: 17, name: 'الصحة', icon: '⚕️', status: 'active', order: 17, customFields: { 'نوع الخدمة': 'select', 'التخصص': 'text' }, showOnHomepage: true, cardsCount: 6 },
  { id: 18, name: 'التعليم', icon: '📚', status: 'active', order: 18, customFields: { 'المرحلة التعليمية': 'select', 'المادة': 'text' }, showOnHomepage: true, cardsCount: 8 },
  { id: 19, name: 'الشحن والتوصيل', icon: '🚚', status: 'active', order: 19, customFields: { 'نوع الشحن': 'select', 'المنطقة': 'text' }, showOnHomepage: false },
  { id: 20, name: 'الملابس الرجالية والأحذية', icon: '👔', status: 'active', order: 20, customFields: { 'نوع المنتج': 'text', 'المقاس': 'text' }, showOnHomepage: true, cardsCount: 6 },
  { id: 21, name: 'نقل ومعدات ثقيلة', icon: '🚛', status: 'active', order: 21, customFields: { 'نوع المعدة': 'text', 'الحمولة': 'number' }, showOnHomepage: false },
  { id: 22, name: 'مستلزمات ولعب أطفال', icon: '🎈', status: 'active', order: 22, customFields: { 'العمر المناسب': 'text', 'نوع المنتج': 'text' }, showOnHomepage: true, cardsCount: 8 },
  { id: 23, name: 'المهن الحرة والخدمات', icon: '💼', status: 'active', order: 23, customFields: { 'نوع المهنة': 'text', 'سنوات الخبرة': 'number' }, showOnHomepage: true, cardsCount: 6 },
  { id: 24, name: 'الساعات والمجوهرات', icon: '⌚', status: 'active', order: 24, customFields: { 'نوع المنتج': 'text', 'الماركة': 'text' }, showOnHomepage: false },
  { id: 25, name: 'خدمات وصيانة السيارات', icon: '🔧', status: 'active', order: 25, customFields: { 'نوع الخدمة': 'select', 'نوع السيارة': 'text' }, showOnHomepage: true, cardsCount: 6 },
  { id: 26, name: 'الصيانة العامة', icon: '⚙️', status: 'active', order: 26, customFields: { 'نوع الصيانة': 'text', 'المنطقة': 'text' }, showOnHomepage: false },
  { id: 27, name: 'أدوات البناء', icon: '⚒️', status: 'active', order: 27, customFields: { 'نوع الأداة': 'text', 'الحالة': 'select' }, showOnHomepage: false },
  { id: 28, name: 'جيمات', icon: '💪', status: 'active', order: 28, customFields: { 'نوع العضوية': 'select', 'المنطقة': 'text' }, showOnHomepage: true, cardsCount: 4 },
  { id: 29, name: 'دراجات ومركبات خفيفة', icon: '🚲', status: 'active', order: 29, customFields: { 'نوع المركبة': 'text', 'الحالة': 'select' }, showOnHomepage: false },
  { id: 30, name: 'مواد وخطوط إنتاج', icon: '🏭', status: 'active', order: 30, customFields: { 'نوع المادة': 'text', 'الكمية': 'number' }, showOnHomepage: false },
  { id: 31, name: 'منتجات مزارع ومصانع', icon: '🌾', status: 'active', order: 31, customFields: { 'نوع المنتج': 'text', 'مصدر الإنتاج': 'text' }, showOnHomepage: true, cardsCount: 6 },
  { id: 32, name: 'الإضاءة والديكور', icon: '💡', status: 'active', order: 32, customFields: { 'نوع المنتج': 'text', 'الطراز': 'text' }, showOnHomepage: true, cardsCount: 8 },
  { id: 33, name: 'مفقودين', icon: '🔍', status: 'active', order: 33, customFields: { 'نوع المفقود': 'select', 'تاريخ الفقدان': 'date' }, showOnHomepage: false },
  { id: 34, name: 'عدد ومستلزمات', icon: '🔨', status: 'active', order: 34, customFields: { 'نوع العدة': 'text', 'الاستخدام': 'text' }, showOnHomepage: false },
  { id: 35, name: 'بيع الجملة', icon: '📦', status: 'active', order: 35, customFields: { 'نوع المنتج': 'text', 'الحد الأدنى للطلب': 'number' }, showOnHomepage: true, cardsCount: 10 },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [activeTab, setActiveTab] = useState<'management' | 'homepage'>('management');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || cat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusToggle = (id: number) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, status: cat.status === 'active' ? 'disabled' : 'active' } : cat
    ));
  };

  const handleHomepageToggle = (id: number) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, showOnHomepage: !cat.showOnHomepage } : cat
    ));
  };

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      setCategories(prev => prev.filter(cat => cat.id !== id));
    }
  };

  return (
    <div className="categories-page">
      {/* Header */}
      <div className="categories-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">الأقسام والتصنيفات</h1>
            <p className="page-description">إدارة أقسام الموقع والتحكم في الظهور على الواجهة الرئيسية</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn-add-category"
              onClick={() => setShowAddModal(true)}
            >
              <span className="btn-icon">➕</span>
              إضافة قسم جديد
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-navigation">
        <button 
          className={`tab-btn ${activeTab === 'management' ? 'active' : ''}`}
          onClick={() => setActiveTab('management')}
        >
          <span className="tab-icon">⚙️</span>
          إدارة الأقسام
        </button>
        <button 
          className={`tab-btn ${activeTab === 'homepage' ? 'active' : ''}`}
          onClick={() => setActiveTab('homepage')}
        >
          <span className="tab-icon">🏠</span>
          الظهور على الواجهة
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <div className="search-container">
          <input
            type="text"
            placeholder="البحث في الأقسام..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            style={{ paddingRight: '50px' }}
          />
          <div className="search-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="url(#searchGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="searchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1bb28f"/>
                  <stop offset="100%" stopColor="#3b82f6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <div className="filter-actions">
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="disabled">معطل</option>
          </select>
          <button 
            className="filter-reset"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
            }}
            title="إعادة تعيين الفلاتر"
          >
            🔄 إعادة تعيين
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'management' && (
        <div className="management-content">
          <div className="results-info">
            <p className="results-count">
              عرض {filteredCategories.length} من أصل {categories.length} قسم
              {(searchTerm || statusFilter) && (
                <span className="filter-indicator"> (مفلتر)</span>
              )}
            </p>
          </div>
          <div className="categories-grid">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <div key={category.id} className="category-card">
                  <div className="category-content">
                    <div className="category-header">
                      <div className="category-info">
                        <span className="category-icon">{category.icon}</span>
                        <div className="category-details">
                          <h3 className="category-name">{category.name}</h3>
                          <span className="category-order">ترتيب: {category.order}</span>
                        </div>
                      </div>
                      <div className="category-status">
                        <span className={`status-badge ${category.status}`}>
                          {category.status === 'active' ? 'نشط' : 'معطل'}
                        </span>
                      </div>
                    </div>

                    <div className="category-fields">
                      <h4>الحقول المخصصة:</h4>
                      <div className="fields-list">
                        {Object.entries(category.customFields).map(([field, type]) => (
                          <span key={field} className="field-tag">
                            {field} ({type})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="category-actions">
                    <button 
                      className="btn-edit"
                      onClick={() => setEditingCategory(category)}
                    >
                       تعديل
                    </button>
                    <button 
                      className={`btn-toggle ${category.status}`}
                      onClick={() => handleStatusToggle(category.id)}
                    >
                      {category.status === 'active' ? ' تعطيل' : '▶️ تفعيل'}
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(category.id)}
                    >
                       حذف
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>لا توجد أقسام تطابق البحث</h3>
                <p>جرب تغيير معايير البحث أو الفلتر</p>
                <button 
                  className="btn-clear-filters"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                  }}
                >
                  مسح جميع الفلاتر
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'homepage' && (
        <div className="homepage-content">
          <div className="homepage-settings">
            <div className="settings-header">
              <h2>إعدادات الظهور على الواجهة الرئيسية</h2>
              <p>تحكم في الأقسام التي تظهر على الصفحة الرئيسية وترتيبها</p>
            </div>

            <div className="homepage-categories">
              {categories
                .filter(cat => cat.showOnHomepage)
                .sort((a, b) => a.order - b.order)
                .map((category) => (
                  <div key={category.id} className="homepage-category-card">
                    <div className="category-preview">
                      <div className="preview-image">
                        {category.homepageImage ? (
                          <Image 
                            src={category.homepageImage} 
                            alt={category.name}
                            width={80}
                            height={80}
                            className="category-image"
                          />
                        ) : (
                          <div className="placeholder-image">
                            <span className="placeholder-icon">{category.icon}</span>
                          </div>
                        )}
                      </div>
                      <div className="category-info">
                        <h3>{category.name}</h3>
                        <p>عدد الكروت: {category.cardsCount || 6}</p>
                        <p>الترتيب: {category.order}</p>
                      </div>
                    </div>

                    <div className="homepage-controls">
                      <div className="control-group">
                        <label>عدد الكروت المعروضة:</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="20" 
                          value={category.cardsCount || 6}
                          className="cards-count-input"
                        />
                      </div>
                      
                      <div className="control-group">
                        <label>ترتيب الظهور:</label>
                        <input 
                          type="number" 
                          min="1" 
                          value={category.order}
                          className="order-input"
                        />
                      </div>

                      <div className="control-group">
                        <label>صورة القسم:</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="image-upload"
                        />
                      </div>

                      <div className="action-buttons">
                        <button 
                          className="btn-homepage-toggle"
                          onClick={() => handleHomepageToggle(category.id)}
                        >
                          🚫 إخفاء من الواجهة
                        </button>
                        <button className="btn-save-settings">
                          💾 حفظ الإعدادات
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="hidden-categories">
              <h3>الأقسام المخفية من الواجهة</h3>
              <div className="hidden-list">
                {categories
                  .filter(cat => !cat.showOnHomepage)
                  .map((category) => (
                    <div key={category.id} className="hidden-category-item">
                      <span className="category-icon">{category.icon}</span>
                      <span className="category-name">{category.name}</span>
                      <button 
                        className="btn-show-homepage"
                        onClick={() => handleHomepageToggle(category.id)}
                      >
                         إظهار في الواجهة
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingCategory) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingCategory ? 'تعديل القسم' : 'إضافة قسم جديد'}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCategory(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <form className="category-form">
                <div className="form-group">
                  <label>اسم القسم</label>
                  <input 
                    type="text" 
                    placeholder="أدخل اسم القسم"
                    defaultValue={editingCategory?.name || ''}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>أيقونة القسم</label>
                  <div className="icon-selector">
                    <input 
                      type="text" 
                      placeholder="اختر أيقونة (emoji)"
                      defaultValue={editingCategory?.icon || ''}
                      className="form-input icon-input"
                    />
                    <div className="icon-suggestions">
                      {['🚗', '🏠', '👨‍⚕️', '💼', '🍽️', '📚', '🔧', '🎯'].map(icon => (
                        <button key={icon} type="button" className="icon-option">
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>ترتيب الظهور</label>
                  <input 
                    type="number" 
                    min="1"
                    defaultValue={editingCategory?.order || categories.length + 1}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>الحقول المخصصة</label>
                  <div className="custom-fields">
                    <div className="field-item">
                      <input type="text" placeholder="اسم الحقل" className="field-name" />
                      <select className="field-type">
                        <option value="text">نص</option>
                        <option value="number">رقم</option>
                        <option value="select">قائمة اختيار</option>
                        <option value="date">تاريخ</option>
                      </select>
                      <button type="button" className="btn-remove-field">حذف</button>
                    </div>
                    <button type="button" className="btn-add-field">➕ إضافة حقل</button>
                  </div>
                </div>

                <div className="form-group">
                  <label>صور القسم</label>
                  <div className="image-uploads">
                    <div className="upload-item">
                      <label>أيقونة القسم:</label>
                      <input type="file" accept="image/*" className="image-input" />
                    </div>
                    <div className="upload-item">
                      <label>بنر القسم:</label>
                      <input type="file" accept="image/*" className="image-input" />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-save">
                    💾 {editingCategory ? 'حفظ التعديلات' : 'إضافة القسم'}
                  </button>
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingCategory(null);
                    }}
                  >
                    ❌ إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}