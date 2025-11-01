'use client';
import React from "react";
import Image from "next/image";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <button 
          className="hamburger-btn"
          onClick={onToggleSidebar}
          aria-label="فتح/إغلاق القائمة الجانبية"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        
        <div className="header-content">
          <h1 className="header-title">ناس مصر - لوحة التحكم</h1>
        </div>
      </div>

      <div className="user-profile">
        <div className="user-info">
          <span className="user-name">أحمد محمد</span>
          <span className="user-role">مدير النظام</span>
        </div>
        <div className="user-avatar">
          <Image
            src="/user.png"
            alt="صورة المستخدم"
            width={40}
            height={40}
            className="avatar-image"
          />
        </div>
      </div>
    </header>
  );
}