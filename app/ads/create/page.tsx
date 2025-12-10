"use client";

import AdCreateForm from '@/components/ads/AdCreateForm';

export default function CreateAdPage() {
  return (
    <div className="page-container">
      <div className="homepage-header">
        <div>
          <h1 className="welcome-title">إنشاء إعلان جديد</h1>
          <p className="welcome-subtitle">كأدمن يمكنك إنشاء إعلان لأي قسم من أقسام النظام</p>
        </div>
      </div>

      <AdCreateForm />
    </div>
  );
}

