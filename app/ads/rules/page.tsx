"use client";

import { useState } from "react";

// Mock data for display rules
const initialRules = {
  sideAdsPerUser: 3,
  maxFreeAdValue: 1000,
  maxFreeAdsCount: 5,
  homepageAdvertisersCount: 10,
  homepageAdsPerAdvertiser: 2,
  autoApprovalThreshold: 500,
  featuredAdDuration: 30,
  regularAdDuration: 15
};

export default function DisplayRules() {
  const [rules, setRules] = useState(initialRules);
  const [isEditing, setIsEditing] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const handleSave = () => {
    // Here you would typically save to backend
    console.log("Saving rules:", rules);
    setIsEditing(false);
    setSavedMessage("تم حفظ القواعد بنجاح ✅");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  const handleReset = () => {
    setRules(initialRules);
    setIsEditing(false);
  };

  return (
    <div className="rules-container">
      {/* New Enhanced Header */}
      <div className="display-rules-banner">
        <div className="banner-wrapper">
          <div className="banner-info-section">
            <div className="banner-icon-container">
              <div className="banner-gear-icon">⚙️</div>
            </div>
            <div className="banner-text-content">
              <h1>قواعد الظهور والعرض</h1>
              <p>إدارة وتخصيص قواعد عرض الإعلانات في النظام</p>
            </div>
          </div>
          
          <div className="banner-controls-section">
            {savedMessage && (
              <div className="success-notification">{savedMessage}</div>
            )}
            <div className="banner-button-group">
              {isEditing ? (
                <>
                  <button onClick={handleSave} className="rules-action-btn btn-save-changes">
                    <span>💾</span>
                    حفظ التغييرات
                  </button>
                  <button onClick={handleReset} className="rules-action-btn btn-cancel-changes">
                    <span>❌</span>
                    إلغاء
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="rules-action-btn btn-edit-rules">
                  تعديل القواعد
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="rules-grid">
        {/* Side Ads Rules */}
        <div className="rule-card">
          <div className="card-header">
            <div className="card-icon">📱</div>
            <div>
              <h3 className="card-title">الإعلانات الجانبية</h3>
              <p className="card-description">إعدادات عرض الإعلانات الجانبية للمستخدمين</p>
            </div>
          </div>
          <div className="card-content">
            <div className="input-group">
              <label className="input-label">
                <span className="label-icon">👥</span>
                عدد الإعلانات الجانبية لكل مستخدم:
              </label>
              <div className="input-wrapper">
                <input
                  type="number"
                  value={rules.sideAdsPerUser}
                  onChange={(e) => setRules({...rules, sideAdsPerUser: parseInt(e.target.value)})}
                  disabled={!isEditing}
                  className={`form-input ${isEditing ? 'editable' : 'readonly'}`}
                />
                <div className="input-suffix">إعلان</div>
              </div>
            </div>
          </div>
        </div>

        {/* Free Ads Rules */}
        <div className="rule-card">
          <div className="card-header">
            <div className="card-icon">🆓</div>
            <div>
              <h3 className="card-title">الإعلانات المجانية</h3>
              <p className="card-description">قواعد وحدود الإعلانات المجانية للمستخدمين</p>
            </div>
          </div>
          <div className="card-content">
            <div className="input-row">
              <div className="input-group">
                <label className="input-label">
                  <span className="label-icon">💰</span>
                  الحد الأقصى لقيمة الإعلان المجاني:
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={rules.maxFreeAdValue}
                    onChange={(e) => setRules({...rules, maxFreeAdValue: parseInt(e.target.value)})}
                    disabled={!isEditing}
                    className={`form-input ${isEditing ? 'editable' : 'readonly'}`}
                  />
                  <div className="input-suffix">ج.م</div>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">
                  <span className="label-icon">🔢</span>
                  الحد الأقصى لعدد الإعلانات المجانية:
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={rules.maxFreeAdsCount}
                    onChange={(e) => setRules({...rules, maxFreeAdsCount: parseInt(e.target.value)})}
                    disabled={!isEditing}
                    className={`form-input ${isEditing ? 'editable' : 'readonly'}`}
                  />
                  <div className="input-suffix">إعلان</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Homepage Display Rules */}
        <div className="rule-card">
          <div className="card-header">
            <div className="card-icon">🏠</div>
            <div>
              <h3 className="card-title">عرض الصفحة الرئيسية</h3>
              <p className="card-description">إعدادات عرض المعلنين والإعلانات في الصفحة الرئيسية</p>
            </div>
          </div>
          <div className="card-content">
            <div className="input-row">
              <div className="input-group">
                <label className="input-label">
                  <span className="label-icon">👨‍💼</span>
                  عدد المعلنين المعروضين:
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={rules.homepageAdvertisersCount}
                    onChange={(e) => setRules({...rules, homepageAdvertisersCount: parseInt(e.target.value)})}
                    disabled={!isEditing}
                    className={`form-input ${isEditing ? 'editable' : 'readonly'}`}
                  />
                  <div className="input-suffix">معلن</div>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">
                  <span className="label-icon">📢</span>
                  عدد الإعلانات لكل معلن:
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={rules.homepageAdsPerAdvertiser}
                    onChange={(e) => setRules({...rules, homepageAdsPerAdvertiser: parseInt(e.target.value)})}
                    disabled={!isEditing}
                    className={`form-input ${isEditing ? 'editable' : 'readonly'}`}
                  />
                  <div className="input-suffix">إعلان</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auto Approval Rules */}
        <div className="rule-card">
          <div className="card-header">
            <div className="card-icon">✅</div>
            <div>
              <h3 className="card-title">قواعد الموافقة التلقائية</h3>
              <p className="card-description">إعدادات الموافقة التلقائية على الإعلانات حسب القيمة</p>
            </div>
          </div>
          <div className="card-content">
            <div className="input-group">
              <label className="input-label">
                <span className="label-icon">⚡</span>
                حد الموافقة التلقائية:
              </label>
              <div className="input-wrapper">
                <input
                  type="number"
                  value={rules.autoApprovalThreshold}
                  onChange={(e) => setRules({...rules, autoApprovalThreshold: parseInt(e.target.value)})}
                  disabled={!isEditing}
                  className={`form-input ${isEditing ? 'editable' : 'readonly'}`}
                />
                <div className="input-suffix">ج.م</div>
              </div>
              <div className="input-hint">
                <span className="hint-icon">💡</span>
                الإعلانات أقل من هذه القيمة تتم الموافقة عليها تلقائياً
              </div>
            </div>
          </div>
        </div>

        {/* Duration Rules */}
        <div className="rule-card">
          <div className="card-header">
            <div className="card-icon">⏰</div>
            <div>
              <h3 className="card-title">مدة الإعلانات</h3>
              <p className="card-description">إعدادات مدة عرض الإعلانات المختلفة بالأيام</p>
            </div>
          </div>
          <div className="card-content">
            <div className="input-row">
              <div className="input-group">
                <label className="input-label">
                  <span className="label-icon">⭐</span>
                  مدة الإعلانات المميزة:
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={rules.featuredAdDuration}
                    onChange={(e) => setRules({...rules, featuredAdDuration: parseInt(e.target.value)})}
                    disabled={!isEditing}
                    className={`form-input ${isEditing ? 'editable' : 'readonly'}`}
                  />
                  <div className="input-suffix">يوم</div>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">
                  <span className="label-icon">📝</span>
                  مدة الإعلانات العادية:
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={rules.regularAdDuration}
                    onChange={(e) => setRules({...rules, regularAdDuration: parseInt(e.target.value)})}
                    disabled={!isEditing}
                    className={`form-input ${isEditing ? 'editable' : 'readonly'}`}
                  />
                  <div className="input-suffix">يوم</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}