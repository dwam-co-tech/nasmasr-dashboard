'use client';
import React, { useState, useEffect } from 'react';
import { fetchSystemSettings, updateSystemSettings } from '@/services/systemSettings';
const LS_KEY = 'systemSettingsDraft';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  actions?: { label: string; variant?: 'primary' | 'secondary'; onClick?: () => void }[];
  duration?: number; // milliseconds; if 0 or actions provided, stays until closed
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (
    message: string,
    type: Toast['type'] = 'info',
    options?: { actions?: Toast['actions']; duration?: number }
  ) => {
    const id = Date.now().toString();
    const newToast: Toast = {
      id,
      message,
      type,
      actions: options?.actions,
      duration: options?.duration,
    };
    setToasts(prev => [...prev, newToast]);

    const autoDuration = options?.duration ?? 4000;
    if (!newToast.actions && autoDuration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, autoDuration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const [settings, setSettings] = useState({
    // General Settings
    privacyPolicy: '',
    termsOfService: '',
    contactLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      whatsapp: '',
      email: '',
      phone: ''
    },
    supportNumbers: {
      primary: '',
      secondary: '',
      emergency: ''
    },
    
    // Interface Settings
    showPhoneNumbers: false,
    advertisersCount: 0,
    adsPerSection: 8,
    sectionsOrder: ['featured', 'recent', 'popular'],
    sideBanners: true,
    
    // Security Settings
    passwordRequirements: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    pinSettings: {
      numericOnly: true,
      length: 6
    },
    twoFactorAuth: false,
    sessionDuration: 24, // hours
    
    // Communications Settings
    smsProvider: 'default',
    emailProvider: 'default',
    pushNotifications: true,
    
    // Integrations Settings
    apiKeys: {
      sms: '',
      email: '',
      push: '',
      analytics: ''
    },
    webhooks: {
      userRegistration: '',
      adApproval: '',
      paymentSuccess: ''
    }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft && typeof draft === 'object') setSettings(draft);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const resp = await fetchSystemSettings();
        const d = resp?.data;
        if (!d) return;
        setSettings((prev) => ({
          ...prev,
          privacyPolicy: prev.privacyPolicy || d.privacy_policy || '',
          termsOfService: prev.termsOfService || (d as { ['terms_conditions-main_']?: string })['terms_conditions-main_'] || '',
          contactLinks: {
            facebook: prev.contactLinks.facebook || d.facebook || '',
            twitter: prev.contactLinks.twitter || d.twitter || '',
            instagram: prev.contactLinks.instagram || d.instagram || '',
            whatsapp: prev.contactLinks.whatsapp || '',
            email: prev.contactLinks.email || d.email || '',
            phone: prev.contactLinks.phone || '',
          },
          supportNumbers: {
            primary: prev.supportNumbers.primary || d.support_number || '',
            secondary: prev.supportNumbers.secondary || d.sub_support_number || '',
            emergency: prev.supportNumbers.emergency || d.emergency_number || '',
          },
          showPhoneNumbers: typeof prev.showPhoneNumbers === 'boolean' ? prev.showPhoneNumbers : Boolean(d.show_phone),
          advertisersCount: typeof prev.advertisersCount === 'number' && prev.advertisersCount !== 0
            ? prev.advertisersCount
            : (typeof d.featured_users_count === 'number' ? d.featured_users_count : prev.advertisersCount),
          adsPerSection: prev.adsPerSection,
          sectionsOrder: prev.sectionsOrder,
          sideBanners: prev.sideBanners,
          passwordRequirements: prev.passwordRequirements,
          pinSettings: prev.pinSettings,
          twoFactorAuth: prev.twoFactorAuth,
          sessionDuration: prev.sessionDuration,
          smsProvider: prev.smsProvider,
          emailProvider: prev.emailProvider,
          pushNotifications: prev.pushNotifications,
          apiKeys: prev.apiKeys,
          webhooks: prev.webhooks,
        }));
      } catch {}
    };
    loadSettings();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const handleInputChange = (section: string, field: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] as Record<string, string | number | boolean>),
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    const payload = {
      support_number: settings.supportNumbers.primary,
      sub_support_number: settings.supportNumbers.secondary,
      emergency_number: settings.supportNumbers.emergency,
      privacy_policy: settings.privacyPolicy,
      'terms_conditions-main_': settings.termsOfService,
      facebook: settings.contactLinks.facebook,
      twitter: settings.contactLinks.twitter,
      instagram: settings.contactLinks.instagram,
      email: settings.contactLinks.email,
      show_phone: settings.showPhoneNumbers,
      featured_users_count: settings.advertisersCount,
    };
    try {
      const resp = await updateSystemSettings(payload);
      if (resp?.status === 'ok') {
        showToast('تم حفظ الإعدادات بنجاح!', 'success');
      } else {
        showToast('تعذر حفظ الإعدادات', 'error');
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'حدث خطأ أثناء الحفظ', 'error');
    }
  };

  const tabs = [
    { id: 'general', label: 'عام', icon: '⚙️' },
    { id: 'interface', label: 'واجهة', icon: '🎨' },
    // { id: 'security', label: 'أمان', icon: '🔒' },
    // { id: 'communications', label: 'اتصالات', icon: '📧' },
    // { id: 'integrations', label: 'تكاملات', icon: '🔗' }
  ];

  const renderGeneralSettings = () => (
    <div className="settings-section">
      <h3 className="section-title">الإعدادات العامة</h3>
      
      {/* <div className="settings-group">
        <h4 className="group-title">سياسات الخصوصية والشروط</h4> */}
        {/* <div className="form-group">
          <label htmlFor="privacyPolicy">سياسة الخصوصية</label>
          <textarea
            id="privacyPolicy"
            className="form-textarea"
            rows={6}
            value={settings.privacyPolicy}
            onChange={(e) => setSettings(prev => ({ ...prev, privacyPolicy: e.target.value }))}
            placeholder="أدخل نص سياسة الخصوصية..."
          />
        </div> */}
        {/* <div className="form-group">
          <label htmlFor="termsOfService">شروط الخدمة</label>
          <textarea
            id="termsOfService"
            className="form-textarea"
            rows={6}
            value={settings.termsOfService}
            onChange={(e) => setSettings(prev => ({ ...prev, termsOfService: e.target.value }))}
            placeholder="أدخل نص شروط الخدمة..."
          />
        </div> */}
      {/* </div> */}

      {/* <div className="settings-group">
        <h4 className="group-title">روابط التواصل الاجتماعي</h4>
        <div className="form-grid"> */}
          {/* <div className="form-group">
            <label htmlFor="facebook">فيسبوك</label>
            <input
              type="url"
              id="facebook"
              className="form-input"
              value={settings.contactLinks.facebook}
              onChange={(e) => handleInputChange('contactLinks', 'facebook', e.target.value)}
              placeholder="https://facebook.com/..."
            />
          </div> */}
          {/* <div className="form-group">
            <label htmlFor="twitter">تويتر</label>
            <input
              type="url"
              id="twitter"
              className="form-input"
              value={settings.contactLinks.twitter}
              onChange={(e) => handleInputChange('contactLinks', 'twitter', e.target.value)}
              placeholder="https://twitter.com/..."
            />
          </div> */}
          {/* <div className="form-group">
            <label htmlFor="instagram">إنستغرام</label>
            <input
              type="url"
              id="instagram"
              className="form-input"
              value={settings.contactLinks.instagram}
              onChange={(e) => handleInputChange('contactLinks', 'instagram', e.target.value)}
              placeholder="https://instagram.com/..."
            />
          </div> */}
          {/* <div className="form-group">
            <label htmlFor="whatsapp">واتساب</label>
            <input
              type="tel"
              id="whatsapp"
              className="form-input"
              value={settings.contactLinks.whatsapp}
              onChange={(e) => handleInputChange('contactLinks', 'whatsapp', e.target.value)}
              placeholder="+20 1XX XXX XXXX"
            />
          </div> */}
          {/* <div className="form-group">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={settings.contactLinks.email}
              onChange={(e) => handleInputChange('contactLinks', 'email', e.target.value)}
              placeholder="contact@example.com"
            />
          </div> */}
          {/* <div className="form-group">
            <label htmlFor="phone">الهاتف</label>
            <input
              type="tel"
              id="phone"
              className="form-input"
              value={settings.contactLinks.phone}
              onChange={(e) => handleInputChange('contactLinks', 'phone', e.target.value)}
              placeholder="+20 2 XXXX XXXX"
            />
          </div> */}
        {/* </div>
      </div> */}

      <div className="settings-group">
        <h4 className="group-title">أرقام الدعم</h4>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="primarySupport">الدعم الأساسي (واتساب) </label>
            <input
              type="tel"
              id="primarySupport"
              className="form-input"
              value={settings.supportNumbers.primary}
              onChange={(e) => handleInputChange('supportNumbers', 'primary', e.target.value)}
              placeholder="+20 1XX XXX XXXX"
            />
          </div>
          {/* <div className="form-group">
            <label htmlFor="secondarySupport">الدعم الثانوي</label>
            <input
              type="tel"
              id="secondarySupport"
              className="form-input"
              value={settings.supportNumbers.secondary}
              onChange={(e) => handleInputChange('supportNumbers', 'secondary', e.target.value)}
              placeholder="+20 1XX XXX XXXX"
            />
          </div>
          <div className="form-group">
            <label htmlFor="emergencySupport">الدعم الطارئ</label>
            <input
              type="tel"
              id="emergencySupport"
              className="form-input"
              value={settings.supportNumbers.emergency}
              onChange={(e) => handleInputChange('supportNumbers', 'emergency', e.target.value)}
              placeholder="+20 1XX XXX XXXX"
            />
          </div> */}
        </div>
      </div>
    </div>
  );

  const renderInterfaceSettings = () => (
    <div className="settings-section">
      <h3 className="section-title">إعدادات الواجهة</h3>
      
      {/* <div className="settings-group">
        <h4 className="group-title">عرض أرقام الهواتف</h4>
        <div className="form-group">
          <label className="toggle-label">
            <span className="toggle-text">
              {settings.showPhoneNumbers ? 'إظهار أرقام الهواتف علنًا' : 'إخفاء أرقام الهواتف (عرض كود المستخدم فقط)'}
            </span>
            <div className="toggle-switch-container">
              <input
                type="checkbox"
                className="toggle-input"
                checked={settings.showPhoneNumbers}
                onChange={(e) => setSettings(prev => ({ ...prev, showPhoneNumbers: e.target.checked }))}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-status">
                {settings.showPhoneNumbers ? 'مفعل' : 'غير مفعل'}
              </span>
            </div>
          </label>
          <p className="form-help">
            عند التعطيل، سيتم عرض كود المستخدم مع زر "ابدأ محادثة" بدلاً من رقم الهاتف
          </p>
        </div>
      </div> */}

      <div className="settings-group">
        <h4 className="group-title">إعدادات الصفحة الرئيسية</h4>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="advertisersCount">عدد المعلنين المفضلين</label>
            <input
              type="number"
              id="advertisersCount"
              className="form-input"
              min="1"
              max="50"
              value={settings.advertisersCount}
              onChange={(e) => setSettings(prev => ({ ...prev, advertisersCount: parseInt(e.target.value) }))}
            />
          </div>
          {/* <div className="form-group">
            <label htmlFor="adsPerSection">عدد الإعلانات لكل قسم</label>
            <input
              type="number"
              id="adsPerSection"
              className="form-input"
              min="1"
              max="20"
              value={settings.adsPerSection}
              onChange={(e) => setSettings(prev => ({ ...prev, adsPerSection: parseInt(e.target.value) }))}
            />
          </div> */}
        </div>
        
        {/* <div className="form-group">
          <label className="toggle-label">
            <span className="toggle-text">تشغيل البانرات الجانبية</span>
            <div className="toggle-switch-container">
              <input
                type="checkbox"
                className="toggle-input"
                checked={settings.sideBanners}
                onChange={(e) => setSettings(prev => ({ ...prev, sideBanners: e.target.checked }))}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-status">
                {settings.sideBanners ? 'مفعل' : 'غير مفعل'}
              </span>
            </div>
          </label>
        </div> */}
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="settings-section">
      <h3 className="section-title">إعدادات الأمان</h3>
      
      <div className="settings-group">
        <h4 className="group-title">متطلبات كلمة المرور</h4>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="minLength">الحد الأدنى لطول كلمة المرور</label>
            <input
              type="number"
              id="minLength"
              className="form-input"
              min="6"
              max="32"
              value={settings.passwordRequirements.minLength}
              onChange={(e) => handleInputChange('passwordRequirements', 'minLength', parseInt(e.target.value))}
            />
          </div>
        </div>
        
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.passwordRequirements.requireUppercase}
              onChange={(e) => handleInputChange('passwordRequirements', 'requireUppercase', e.target.checked)}
            />
            <span className="checkbox-text">يجب أن تحتوي على أحرف كبيرة</span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.passwordRequirements.requireLowercase}
              onChange={(e) => handleInputChange('passwordRequirements', 'requireLowercase', e.target.checked)}
            />
            <span className="checkbox-text">يجب أن تحتوي على أحرف صغيرة</span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.passwordRequirements.requireNumbers}
              onChange={(e) => handleInputChange('passwordRequirements', 'requireNumbers', e.target.checked)}
            />
            <span className="checkbox-text">يجب أن تحتوي على أرقام</span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.passwordRequirements.requireSpecialChars}
              onChange={(e) => handleInputChange('passwordRequirements', 'requireSpecialChars', e.target.checked)}
            />
            <span className="checkbox-text">يجب أن تحتوي على رموز خاصة</span>
          </label>
        </div>
      </div>

      <div className="settings-group">
        <h4 className="group-title">إعدادات PIN</h4>
        <div className="form-group">
          <label className="toggle-label">
            <span className="toggle-text">قبول PIN رقمي فقط</span>
            <div className="toggle-switch-container">
              <input
                type="checkbox"
                className="toggle-input"
                checked={settings.pinSettings.numericOnly}
                onChange={(e) => handleInputChange('pinSettings', 'numericOnly', e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-status">
                {settings.pinSettings.numericOnly ? 'مفعل' : 'غير مفعل'}
              </span>
            </div>
          </label>
        </div>
        <div className="form-group">
          <label htmlFor="pinLength">طول PIN</label>
          <select
            id="pinLength"
            className="form-select"
            value={settings.pinSettings.length}
            onChange={(e) => handleInputChange('pinSettings', 'length', parseInt(e.target.value))}
          >
            <option value={4}>4 أرقام</option>
            <option value={6}>6 أرقام</option>
            <option value={8}>8 أرقام</option>
          </select>
        </div>
      </div>

      <div className="settings-group">
        <h4 className="group-title">المصادقة الثنائية والجلسات</h4>
        <div className="form-group">
          <label className="toggle-label">
            <span className="toggle-text">تفعيل المصادقة الثنائية (2FA)</span>
            <div className="toggle-switch-container">
              <input
                type="checkbox"
                className="toggle-input"
                checked={settings.twoFactorAuth}
                onChange={(e) => setSettings(prev => ({ ...prev, twoFactorAuth: e.target.checked }))}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-status">
                {settings.twoFactorAuth ? 'مفعل' : 'غير مفعل'}
              </span>
            </div>
          </label>
        </div>
        <div className="form-group">
          <label htmlFor="sessionDuration">مدة الجلسة (بالساعات)</label>
          <input
            type="number"
            id="sessionDuration"
            className="form-input"
            min="1"
            max="168"
            value={settings.sessionDuration}
            onChange={(e) => setSettings(prev => ({ ...prev, sessionDuration: parseInt(e.target.value) }))}
          />
        </div>
      </div>
    </div>
  );

  const renderCommunicationsSettings = () => (
    <div className="settings-section">
      <h3 className="section-title">إعدادات الاتصالات</h3>
      
      <div className="settings-group">
        <h4 className="group-title">مزودات الخدمة</h4>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="smsProvider">مزود SMS</label>
            <select
              id="smsProvider"
              className="form-select"
              value={settings.smsProvider}
              onChange={(e) => setSettings(prev => ({ ...prev, smsProvider: e.target.value }))}
            >
              <option value="default">الافتراضي</option>
              <option value="twilio">Twilio</option>
              <option value="nexmo">Nexmo</option>
              <option value="local">محلي</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="emailProvider">مزود البريد الإلكتروني</label>
            <select
              id="emailProvider"
              className="form-select"
              value={settings.emailProvider}
              onChange={(e) => setSettings(prev => ({ ...prev, emailProvider: e.target.value }))}
            >
              <option value="default">الافتراضي</option>
              <option value="sendgrid">SendGrid</option>
              <option value="mailgun">Mailgun</option>
              <option value="smtp">SMTP مخصص</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label className="toggle-label">
            <span className="toggle-text">تفعيل الإشعارات الفورية</span>
            <div className="toggle-switch-container">
              <input
                type="checkbox"
                className="toggle-input"
                checked={settings.pushNotifications}
                onChange={(e) => setSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-status">
                {settings.pushNotifications ? 'مفعل' : 'غير مفعل'}
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderIntegrationsSettings = () => (
    <div className="settings-section">
      <h3 className="section-title">إعدادات التكاملات</h3>
      
      <div className="settings-group">
        <h4 className="group-title">مفاتيح API</h4>
        <div className="form-group">
          <label htmlFor="smsApiKey">مفتاح SMS API</label>
          <input
            type="password"
            id="smsApiKey"
            className="form-input"
            value={settings.apiKeys.sms}
            onChange={(e) => handleInputChange('apiKeys', 'sms', e.target.value)}
            placeholder="أدخل مفتاح SMS API..."
          />
        </div>
        <div className="form-group">
          <label htmlFor="emailApiKey">مفتاح Email API</label>
          <input
            type="password"
            id="emailApiKey"
            className="form-input"
            value={settings.apiKeys.email}
            onChange={(e) => handleInputChange('apiKeys', 'email', e.target.value)}
            placeholder="أدخل مفتاح Email API..."
          />
        </div>
        <div className="form-group">
          <label htmlFor="pushApiKey">مفتاح Push Notifications API</label>
          <input
            type="password"
            id="pushApiKey"
            className="form-input"
            value={settings.apiKeys.push}
            onChange={(e) => handleInputChange('apiKeys', 'push', e.target.value)}
            placeholder="أدخل مفتاح Push API..."
          />
        </div>
        <div className="form-group">
          <label htmlFor="analyticsApiKey">مفتاح Analytics API</label>
          <input
            type="password"
            id="analyticsApiKey"
            className="form-input"
            value={settings.apiKeys.analytics}
            onChange={(e) => handleInputChange('apiKeys', 'analytics', e.target.value)}
            placeholder="أدخل مفتاح Analytics API..."
          />
        </div>
      </div>

      <div className="settings-group">
        <h4 className="group-title">Webhooks</h4>
        <div className="form-group">
          <label htmlFor="userRegistrationWebhook">تسجيل المستخدمين</label>
          <input
            type="url"
            id="userRegistrationWebhook"
            className="form-input"
            value={settings.webhooks.userRegistration}
            onChange={(e) => handleInputChange('webhooks', 'userRegistration', e.target.value)}
            placeholder="https://example.com/webhook/user-registration"
          />
        </div>
        <div className="form-group">
          <label htmlFor="adApprovalWebhook">موافقة الإعلانات</label>
          <input
            type="url"
            id="adApprovalWebhook"
            className="form-input"
            value={settings.webhooks.adApproval}
            onChange={(e) => handleInputChange('webhooks', 'adApproval', e.target.value)}
            placeholder="https://example.com/webhook/ad-approval"
          />
        </div>
        <div className="form-group">
          <label htmlFor="paymentSuccessWebhook">نجاح الدفع</label>
          <input
            type="url"
            id="paymentSuccessWebhook"
            className="form-input"
            value={settings.webhooks.paymentSuccess}
            onChange={(e) => handleInputChange('webhooks', 'paymentSuccess', e.target.value)}
            placeholder="https://example.com/webhook/payment-success"
          />
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'interface':
        return renderInterfaceSettings();
      case 'security':
        return renderSecuritySettings();
      case 'communications':
        return renderCommunicationsSettings();
      case 'integrations':
        return renderIntegrationsSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">الضبط العام</h1>
            <p className="page-description">إدارة إعدادات النظام والتكوينات العامة</p>
          </div>
        </div>
      </div>

      <div className="settings-container">
        <div className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          {renderTabContent()}
          
          <div className="settings-actions">
            <button className="btn-save" onClick={handleSave}>
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              حفظ الإعدادات
            </button>
            {/* <button className="btn-reset" onClick={() => { try { localStorage.removeItem(LS_KEY); } catch {}; window.location.reload(); }}>
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              إعادة تعيين
            </button> */}
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-header">
              <span className="toast-icon">
                {toast.type === 'success' && '✓'}
                {toast.type === 'error' && '✕'}
                {toast.type === 'warning' && '⚠'}
                {toast.type === 'info' && 'ℹ'}
              </span>
              <span className="toast-message">{toast.message}</span>
              <button 
                onClick={() => removeToast(toast.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.5 }}
              >
                ×
              </button>
            </div>
            {toast.actions && (
              <div className="toast-actions">
                {toast.actions.map((action, idx) => (
                  <button
                    key={idx}
                    className={`toast-action-btn toast-action-${action.variant || 'primary'}`}
                    onClick={() => {
                      action.onClick?.();
                      removeToast(toast.id);
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}