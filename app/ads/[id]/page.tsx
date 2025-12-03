"use client";

import { useState } from "react";

// Mock data for ad detail
const mockAdDetail = {
  id: 1,
  title: "شقة للبيع في المعادي",
  description: "شقة 3 غرف وصالة في موقع متميز بالمعادي، الدور الثالث، مساحة 120 متر، تشطيب سوبر لوكس مع إطلالة رائعة على النيل. الشقة مجهزة بالكامل وجاهزة للسكن الفوري.",
  status: "منشور",
  category: "عقارات",
  createdDate: "2024-01-15",
  expiryDate: "2024-02-15",
  ownerCode: "USR001",
  displayType: "مميز",
  value: 1500,
  views: 2450,
  reports: 1,
  images: [
    "صورة الواجهة الرئيسية",
    "صورة غرفة المعيشة",
    "صورة المطبخ",
    "صورة الحمام"
  ],
  decisions: [
    {
      type: "موافقة",
      date: "2024-01-16",
      reason: "الإعلان يتوافق مع جميع الشروط والأحكام المطلوبة",
      reviewer: "أحمد محمد"
    },
    {
      type: "قيد المراجعة",
      date: "2024-01-15",
      reason: "تم استلام الإعلان وجاري مراجعة المحتوى والصور",
      reviewer: "النظام"
    }
  ]
};

// Status colors
const statusColors = {
  "منشور": "#1BB28F",
  "قيد المراجعة": "#FF5C23",
  "مرفوض": "#EF4444",
  "منتهي": "#6B7280"
};

export default function AdDetail({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("details");
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "المراجع", message: "تم استلام الإعلان وهو قيد المراجعة", time: "10:30 ص" },
    { id: 2, sender: "النظام", message: "تم رفع الإعلان للمراجعة النهائية", time: "11:15 ص" }
  ]);

  const [images, setImages] = useState<string[]>(mockAdDetail.images);
  const [selectedImageIndexes, setSelectedImageIndexes] = useState<number[]>([]);

  const handleSelectImage = (index: number, checked: boolean) => {
    if (checked) {
      setSelectedImageIndexes((prev) => [...prev, index]);
    } else {
      setSelectedImageIndexes((prev) => prev.filter((i) => i !== index));
    }
  };

  const handleDeleteSelectedImages = () => {
    if (selectedImageIndexes.length === 0) return;
    setImages((prev) => prev.filter((_, idx) => !selectedImageIndexes.includes(idx)));
    setSelectedImageIndexes([]);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "مسودة":
        return "status-draft";
      case "قيد المراجعة":
        return "status-pending";
      case "منشور":
        return "status-published";
      case "مرفوض":
        return "status-rejected";
      case "منتهي":
        return "status-expired";
      default:
        return "status-default";
    }
  };

  const getDecisionStatusClass = (type: string) => {
    switch (type) {
      case "موافقة":
        return "status-published";
      case "رفض":
        return "status-rejected";
      case "قيد المراجعة":
        return "status-pending";
      default:
        return "status-default";
    }
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      setChatMessages([...chatMessages, {
        id: chatMessages.length + 1,
        sender: "أنت",
        message: chatMessage,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      }]);
      setChatMessage("");
    }
  };

  return (
    <div className="page-container">
      {/* Enhanced Header with Back Button */}
      <div className="ad-detail-header">
        <button
          onClick={() => window.history.back()}
          className="back-button"
        >
          ← العودة
        </button>
        
        <div>
          <h1 className="details-title gradient-text">
            تفاصيل الإعلان #{params.id}
          </h1>
          <p className="details-subtitle">
            📅 تم الإنشاء في {mockAdDetail.createdDate} | 👤 المعلن: {mockAdDetail.ownerCode}
          </p>
        </div>
        
        <span className={`status-badge ${getStatusClass(mockAdDetail.status)}`}>
          📊 {mockAdDetail.status}
        </span>
      </div>

      {/* Enhanced Tabs Navigation */}
      <div className="ad-detail-tabs">
        {[
          { id: "details", label: " التفاصيل", icon: "" },
          { id: "images", label: " الصور", icon: "" },
          // { id: "decisions", label: "⚖️ القرارات", icon: "⚖️" },
          // { id: "chat", label: "💬 المحادثة", icon: "💬" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            style={{borderBottom: "2px solid #1BB28F"}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Enhanced Tab Content */}
      <div className="ad-detail-content">
        {activeTab === "details" && (
          <div>
            <h2 className="section-title">📋 تفاصيل الإعلان</h2>
            
            <div className="info-cards-grid">
              {/* Info Cards */}
              <div className="card-blue">
                <h3 className="image-title">
                  📂 معلومات أساسية
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div><strong>القسم:</strong> {mockAdDetail.category}</div>
                  <div><strong>نوع الظهور:</strong> {mockAdDetail.displayType}</div>
                  <div><strong>القيمة:</strong> <span className="value-strong">{mockAdDetail.value} ج.م</span></div>
                </div>
              </div>

              <div className="card-green">
                <h3 className="image-title">
                  📊 إحصائيات
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                   <div><strong>المشاهدات:</strong> <span className={`views-badge ${mockAdDetail.views > 1000 ? 'views-high' : 'views-low'}`}>{mockAdDetail.views.toLocaleString()}</span></div>
                   <div><strong>البلاغات:</strong> <span className={`reports-text ${mockAdDetail.reports > 0 ? 'reports-has' : 'reports-none'}`}>{mockAdDetail.reports}</span></div>
                   <div><strong>النقرات:</strong> <span className="value-strong">245</span></div>
                 </div>
              </div>

              <div className="card-amber">
                <h3 className="image-title">
                  ⏰ التواريخ
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div><strong>تاريخ الإنشاء:</strong> {mockAdDetail.createdDate}</div>
                  <div><strong>تاريخ الانتهاء:</strong> {mockAdDetail.expiryDate}</div>
                  <div><strong>المدة المتبقية:</strong> 15 يوم</div>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="card-purple">
              <h3>
                📝 وصف الإعلان
              </h3
              ><p>
                {mockAdDetail.description}
              </p>
            </div>
          </div>
        )}

        {activeTab === "images" && (
          <div>
            <div className="images-header">
              <h2 className="section-title">
                 صور الإعلان
              </h2>
              <button className="btn-reject" onClick={handleDeleteSelectedImages} disabled={selectedImageIndexes.length === 0}>
                حذف الصور المحددة
              </button>
{/* +             <button className="btn-reject" onClick={handleDeleteSelectedImages} disabled={selectedImageIndexes.length === 0}>
                 حذف الصور المحددة
              </button> */}
            </div>
            
            <div className="images-grid">
              {images.map((image, index) => (
                <div key={index} className="image-card">
                  <div className="image-preview">
                    
                  </div>
                  <div>
                    <p className="image-title">
                      {image}
                    </p
                    ><div style={{ display: "flex", gap: "8px" }}>
                      <input 
                        type="checkbox" 
                        className="image-select"
                       checked={selectedImageIndexes.includes(index)}
onChange={(e) => handleSelectImage(index, e.currentTarget.checked)}
                      />
                      <label>
                        تحديد للحذف
                      </label
                      >
                    </div
                    >
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "decisions" && (
          <div>
            <h2 className="section-title">
              ⚖️ سجل القرارات
            </h2>
            
            <div className="decisions-grid">
              {mockAdDetail.decisions.map((decision, index) => (
                <div key={index} className={`decision-card ${getDecisionStatusClass(decision.type)}`}>
                  <div className="decision-title">
                    {decision.type === "موافقة" ? "✅" : decision.type === "رفض" ? "❌" : "⏳"} {decision.type}
                  </div>
                  <div className="decision-meta">
                    🕒 {decision.date} | 👤 {decision.reviewer}
                  </div>
                  <p>
                    {decision.reason}
                  </p>
                </div
                >
              ))}
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div>
            <h2 className="section-title">
              💬 المحادثة الداخلية
            </h2>
            
            {/* Chat Messages */}
            <div className="chat-messages">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="chat-message">
                  <div className="message-meta">
                    <span>
                      👤 {msg.sender}
                    </span>
                    <span>
                      🕒 {msg.time}
                    </span>
                  </div>
                  <p>
                    {msg.message}
                  </p>
                </div
                >
              ))}
            </div>
            
            {/* Chat Input */}
            <div className="chat-input">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="اكتب رسالة..."
              />
              <button onClick={handleSendMessage}>
                📤 إرسال
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}