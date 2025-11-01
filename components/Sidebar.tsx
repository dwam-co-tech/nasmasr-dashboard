'use client';
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/", label: "الرئيسية", icon: "/window.svg" },
  
  { 
    href: "/ads", 
    label: "إدارة الإعلانات", 
    icon: "/file.svg",
    subItems: [
      { href: "/ads/rules", label: "قواعد الظهور", icon: "/globe.svg" }
    ]
  },
  { href: "/categories", label: "الأقسام والتصنيفات", icon: "/categories.png" },
  { href: "/moderation", label: "الموافقات والمراجعة", icon: "/star.png" },
  { href: "/users", label: "المستخدمون والمعلِنون", icon: "/profile.png" },
  { href: "/reports", label: "التقارير والإحصائيات", icon: "/clipboard.png" },
  { href: "/notifications", label: "الإشعارات والرسائل", icon: "/chat2.png" },
  { href: "/settings", label: "الضبط العام", icon: "/cogwheel.png" }
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);

  const toggleDropdown = (href: string) => {
    setOpenDropdowns(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay active" onClick={onClose} />}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Close button for mobile */}
        <button 
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="إغلاق القائمة الجانبية"
        >
          <span className="close-icon">×</span>
        </button>
        
        <Image
          className="logo"
          src="/nas-masr.png"
          alt="شعار ناس مصر"
          width={140}
          height={140}
          priority
        />
        <div className="sidebar-title">لوحة التحكم</div>
        <nav aria-label="القائمة الرئيسية">
          <ul className="nav-list">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isDropdownOpen = openDropdowns.includes(item.href);
              
              return (
                <li key={item.href}>
                  {hasSubItems ? (
                    <button 
                      className={`nav-item dropdown-toggle${isActive ? " active" : ""}`}
                      onClick={() => { router.push(item.href); toggleDropdown(item.href); }}
                      type="button"
                    >
                      <span className="nav-indicator" aria-hidden="true" />
                      <Image src={item.icon} alt="" width={20} height={20} className="nav-icon" />
                      <span className="nav-text">{item.label}</span>
                      <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>
                        ▼
                      </span>
                    </button>
                  ) : (
                    <Link 
                      href={item.href} 
                      className={`nav-item${isActive ? " active" : ""}`}
                      onClick={onClose}
                    >
                      <span className="nav-indicator" aria-hidden="true" />
                      <Image src={item.icon} alt="" width={20} height={20} className="nav-icon" />
                      <span className="nav-text">{item.label}</span>
                    </Link>
                  )}
                  
                  {/* Sub-items */}
                  {hasSubItems && (
                    <ul className={`nav-sub-list ${isDropdownOpen ? 'open' : ''}`}>
                      {item.subItems!.map((subItem) => {
                        const isSubActive = pathname === subItem.href;
                        return (
                          <li key={subItem.href}>
                            <Link 
                              href={subItem.href} 
                              className={`nav-sub-item${isSubActive ? " active" : ""}`}
                              onClick={onClose}
                            >
                              <span className="nav-sub-indicator" aria-hidden="true" />
                              <Image src={subItem.icon} alt="" width={16} height={16} className="nav-sub-icon" />
                              <span className="nav-sub-text">{subItem.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Logout Button */}
        <div className="sidebar-footer">
          <button 
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem('isAuthenticated');
              localStorage.removeItem('userEmail');
              localStorage.removeItem('rememberMe');
              router.push('/auth/login');
            }}
            type="button"
          >
            <svg className="logout-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="logout-text">تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}