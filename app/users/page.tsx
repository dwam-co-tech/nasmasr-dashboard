'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { fetchUsersSummary, updateUser, toggleUserBlock, deleteUser, createUser, changeUserPassword, createUserOtp, fetchUserListings, fetchCategories } from '@/services/users';

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
  phoneVerified?: boolean;
  package?: UserPackage;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  actions?: { label: string; variant?: 'primary' | 'secondary'; onClick?: () => void }[];
  duration?: number; // milliseconds; if 0 or actions provided, stays until closed
}

interface UserPackage {
  plan: 'متميز' | 'ستاندر';
  adsCount: number;
  expiryDate: string; // YYYY-MM-DD
}

interface AdItem {
  id: string;
  title: string;
  status: string;
  publishDate: string;
  category: string;
  image: string;
}

const toImageUrl = (src: string | null | undefined): string => {
  if (!src || src === 'NULL') return '/file.svg';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  const trimmed = src.startsWith('/') ? src.slice(1) : src;
  return `https://api.nasmasr.app/${trimmed}`;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('data');
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const usersPerPage = 10;
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<User | null>(null);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['all']);
  type UserSubscriptionForm = { annualFee: number; paidAmount: number };
  const SUB_LS_PREFIX = 'userSubscription:';
  const [subscriptionForm, setSubscriptionForm] = useState<UserSubscriptionForm>({ annualFee: 0, paidAmount: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetchUsersSummary();
        const mapped = resp.users.map(u => ({
          id: String(u.id),
          name: u.name ?? '',
          phone: u.phone,
          userCode: u.user_code,
          status: u.status === 'active' ? 'active' : 'banned',
          registrationDate: u.registered_at,
          adsCount: typeof u.listings_count === 'number' ? u.listings_count : 0,
          role: u.role,
          lastLogin: u.registered_at,
          phoneVerified: false,
        } as User));
        setUsers(mapped);
      } catch (e) {
        showToast('تعذر تحميل المستخدمين', 'error');
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    try {
      const raw = localStorage.getItem(SUB_LS_PREFIX + selectedUser.id);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserSubscriptionForm>;
        setSubscriptionForm({
          annualFee: typeof parsed.annualFee === 'number' ? parsed.annualFee : Number(parsed.annualFee) || 0,
          paidAmount: typeof parsed.paidAmount === 'number' ? parsed.paidAmount : Number(parsed.paidAmount) || 0,
        });
      } else {
        setSubscriptionForm({ annualFee: 0, paidAmount: 0 });
      }
    } catch {
      setSubscriptionForm({ annualFee: 0, paidAmount: 0 });
    }
  }, [selectedUser]);

  const handleSubscriptionChange = (field: keyof UserSubscriptionForm, value: number) => {
    setSubscriptionForm(prev => ({ ...prev, [field]: value }));
  };

  const saveSubscriptionForUser = () => {
    if (!selectedUser) return;
    try {
      const payload = { ...subscriptionForm, updatedAt: new Date().toISOString() };
      localStorage.setItem(SUB_LS_PREFIX + selectedUser.id, JSON.stringify(payload));
      showToast('تم حفظ بيانات الاشتراك السنوي لهذا المستخدم', 'success');
    } catch {
      showToast('تعذر حفظ بيانات الاشتراك السنوي', 'error');
    }
  };

  useEffect(() => {
    const loadCats = async () => {
      try {
        const resp = await fetchCategories();
        const slugs = Array.isArray(resp?.data) ? resp.data.map(c => c.slug).filter(Boolean) : [];
        setCategories(['all', ...slugs]);
      } catch (e) {
        setCategories(['all']);
      }
    };
    loadCats();
  }, []);

  const CATEGORY_LABELS_AR: Record<string, string> = {
    real_estate: 'عقارات',
    cars: 'سيارات',
    cars_rent: 'تأجير سيارات',
    'spare-parts': 'قطع غيار',
    stores: 'محلات',
    restaurants: 'مطاعم',
    groceries: 'بقالة',
    'food-products': 'منتجات غذائية',
    electronics: 'إلكترونيات',
    'home-tools': 'أدوات منزلية',
    furniture: 'أثاث',
    doctors: 'أطباء',
    health: 'الصحة',
    teachers: 'معلمون',
    education: 'تعليم',
    jobs: 'وظائف',
    shipping: 'شحن',
    'mens-clothes': 'ملابس رجالي',
    'watches-jewelry': 'ساعات ومجوهرات',
    'free-professions': 'مهن حرة',
    'kids-toys': 'ألعاب أطفال',
    gym: 'رياضة',
    construction: 'مقاولات',
    maintenance: 'صيانة',
    'car-services': 'خدمات سيارات',
    'home-services': 'خدمات منزلية',
    'lighting-decor': 'إضاءة وديكور',
    animals: 'حيوانات',
    'farm-products': 'منتجات زراعية',
    wholesale: 'جملة',
    'production-lines': 'خطوط إنتاج',
    'light-vehicles': 'مركبات خفيفة',
    'heavy-transport': 'نقل ثقيل',
    tools: 'أدوات',
    'home-appliances': 'أجهزة منزلية',
    missing: 'مفقودات',
  };

  const SECTION_AR_TO_SLUG: Record<string, string> = Object.keys(CATEGORY_LABELS_AR).reduce((acc, slug) => {
    const label = CATEGORY_LABELS_AR[slug];
    acc[label] = slug;
    return acc;
  }, {} as Record<string, string>);

  // Packages modal state
  const [isPackagesModalOpen, setIsPackagesModalOpen] = useState(false);
  const [selectedUserForPackages, setSelectedUserForPackages] = useState<User | null>(null);
  const [packagesForm, setPackagesForm] = useState<UserPackage>({
    plan: 'ستاندر',
    adsCount: 0,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
  });

  // Verify modal state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [userForVerify, setUserForVerify] = useState<User | null>(null);
  const [verificationCode, setVerificationCode] = useState<string>('');

  const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();
  const openVerifyModal = async (user: User) => {
    setUserForVerify(user);
    try {
      const resp = await createUserOtp(Number(user.id));
      setVerificationCode(String(resp.otp));
      setIsVerifyModalOpen(true);
    } catch (e) {
      showToast('تعذر إنشاء كود التحقق', 'error');
    }
  };
  const closeVerifyModal = () => {
    setIsVerifyModalOpen(false);
    setUserForVerify(null);
    setVerificationCode('');
  };
  const copyVerificationCode = async () => {
    if (!verificationCode) return;
    try {
      await navigator.clipboard.writeText(verificationCode);
      showToast('تم نسخ كود التحقق بنجاح', 'success');
    } catch (e) {
      showToast('تعذر النسخ تلقائيًا، يرجى النسخ يدويًا', 'warning');
    }
  };
  const openWhatsAppWithCode = async (user: User) => {
    try {
      const resp = await createUserOtp(Number(user.id));
      const code = String(resp.otp);
      setVerificationCode(code);
      setUserForVerify(user);
      const phoneNormalized = user.phone.replace(/[^+\d]/g, '').replace('+', '');
      const message = encodeURIComponent(`كود التحقق: ${code}`);
      const waUrl = `https://wa.me/${phoneNormalized}?text=${message}`;
      try {
        window.open(waUrl, '_blank');
        showToast(`تم فتح واتساب وإدراج الكود: ${code}`, 'success');
      } catch (e) {
        showToast('تعذر فتح واتساب، تحقق من الإعدادات', 'error');
      }
    } catch (e) {
      showToast('تعذر إنشاء كود التحقق', 'error');
    }
  };

  const openWhatsAppContact = (user: User) => {
    const phoneNormalized = user.phone.replace(/[^+\d]/g, '').replace('+', '');
    const waUrl = `https://wa.me/${phoneNormalized}`;
    try {
      window.open(waUrl, '_blank');
      showToast('تم فتح واتساب', 'success');
    } catch (e) {
      showToast('تعذر فتح واتساب، تحقق من الإعدادات', 'error');
    }
  };

  // Add User modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    phone: '',
    role: 'مستخدم',
    status: 'active' as User['status'],
    adsCount: 0,
    registrationDate: new Date().toISOString().split('T')[0],
    lastLogin: new Date().toISOString().split('T')[0],
  });

  const openAddUserModal = () => setIsAddModalOpen(true);
  const closeAddUserModal = () => setIsAddModalOpen(false);
  const handleNewUserChange = (field: keyof typeof newUserForm, value: string | number) => {
    setNewUserForm(prev => ({ ...prev, [field]: value }));
  };
  const saveNewUser = async () => {
    if (!newUserForm.phone.trim()) {
      showToast('يرجى إدخال رقم الهاتف', 'warning');
      return;
    }
    try {
      const roleRaw = newUserForm.role?.trim();
      const roleMapped = roleRaw === 'معلن' ? 'advertiser' : roleRaw === 'مستخدم' ? 'user' : roleRaw || undefined;
      const payload = {
        name: newUserForm.name?.trim() || undefined,
        phone: newUserForm.phone.trim(),
        role: roleMapped,
        status: newUserForm.status === 'banned' ? 'blocked' : 'active',
      };
      const resp = await createUser(payload);
      const u = resp.user;
      const created: User = {
        id: String(u.id),
        name: u.name ?? '',
        phone: u.phone,
        userCode: u.user_code,
        status: u.status === 'active' ? 'active' : 'banned',
        registrationDate: u.registered_at,
        adsCount: typeof u.listings_count === 'number' ? u.listings_count : 0,
        role: u.role,
        lastLogin: u.registered_at,
        phoneVerified: false,
      };
      setUsers(prev => [created, ...prev]);
      setCurrentPage(1);
      setIsAddModalOpen(false);
      setNewUserForm({
        name: '',
        phone: '',
        role: 'مستخدم',
        status: 'active',
        adsCount: 0,
        registrationDate: new Date().toISOString().split('T')[0],
        lastLogin: new Date().toISOString().split('T')[0],
      });
      showToast(resp?.message || 'تم إضافة المستخدم بنجاح', 'success');
    } catch (e) {
      showToast('تعذر إضافة المستخدم', 'error');
    }
  };

  useEffect(() => {
    const loadUserAds = async () => {
      if (!selectedUser) {
        setAds([]);
        return;
      }
      try {
        const params = selectedCategory !== 'all'
          ? { per_page: 20, status: 'Valid', all: false, category_slugs: selectedCategory }
          : { per_page: 20, status: 'Valid', all: false };
        const resp = await fetchUserListings(Number(selectedUser.id), params);
        const mapped = resp.listings.map(l => ({
          id: String(l.id),
          title: l.title,
          status: l.status,
          publishDate: l.published_at,
          category: l.section,
          image: toImageUrl(l.image),
          categorySlug: SECTION_AR_TO_SLUG[l.section] ?? l.section,
        }));
        setAds(mapped);
      } catch (e) {
        setAds([]);
      }
    };
    loadUserAds();
  }, [selectedUser, selectedCategory]);

  const filteredAds = selectedCategory === 'all'
    ? ads
    : ads.filter(
        (ad) =>
          (ad as any).categorySlug === selectedCategory ||
          ad.category === (CATEGORY_LABELS_AR[selectedCategory] ?? selectedCategory)
      );
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

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Reset edit mode when switching selected user
  useEffect(() => {
    setIsEditing(false);
    setEditForm(null);
  }, [selectedUser]);

  const handleBanUser = async (userId: string) => {
    const u = users.find(x => x.id === userId);
    if (!u) return;
    try {
      const resp = await toggleUserBlock(Number(userId));
      const msg = (resp.message || '').toLowerCase();
      const newStatus: User['status'] = msg.includes('unblocked') ? 'active' : 'banned';
      setUsers(prev => prev.map(x => (x.id === userId ? { ...x, status: newStatus } as User : x)));
      showToast(newStatus === 'banned' ? `تم حظر المستخدم ${u.name} بنجاح` : `تم إلغاء حظر المستخدم ${u.name} بنجاح`, 'success');
    } catch (e) {
      showToast('تعذر تغيير حالة المستخدم', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    try {
      const resp = await deleteUser(Number(userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
      if (selectedUser?.id === userId) {
        setShowUserProfile(false);
        setSelectedUser(null);
      }
      showToast(resp?.message || 'تم حذف المستخدم بنجاح', 'success');
    } catch (e) {
      showToast('تعذر حذف المستخدم', 'error');
    }
  };

  const handleVerifyPhone = (userId: string) => {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, phoneVerified: true } : u)));
    const user = users.find(u => u.id === userId);
    showToast(`تم توثيق رقم هاتف المستخدم ${user?.name} بنجاح`, 'success');
  };

  const openPackagesModal = (user: User) => {
    setSelectedUserForPackages(user);
    setPackagesForm(
      user.package ?? {
        plan: 'ستاندر',
        adsCount: user.adsCount ?? 0,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      }
    );
    setIsPackagesModalOpen(true);
  };

  const closePackagesModal = () => {
    setIsPackagesModalOpen(false);
    setSelectedUserForPackages(null);
  };

  const handlePackagesChange = (field: keyof UserPackage, value: string | number) => {
    setPackagesForm(prev => ({ ...prev, [field]: value } as UserPackage));
  };

  const savePackages = () => {
    if (!selectedUserForPackages) return;
    const updatedUser = {
      ...selectedUserForPackages,
      package: {
        plan: packagesForm.plan,
        adsCount: typeof packagesForm.adsCount === 'number' ? packagesForm.adsCount : Number(packagesForm.adsCount) || 0,
        expiryDate: packagesForm.expiryDate,
      },
    } as User;
    setUsers(prev => prev.map(u => (u.id === selectedUserForPackages.id ? updatedUser : u)));
    if (selectedUser?.id === selectedUserForPackages.id) {
      setSelectedUser(updatedUser);
    }
    setIsPackagesModalOpen(false);
    setSelectedUserForPackages(null);
    showToast('تم تحديث الباقة بنجاح', 'success');
  };

  // Calculate package duration days based on acceptance, ad start, expiry
  const calculatePackageDays = (user: User | null, expiryDate: string): number => {
    if (!user || !expiryDate) return 0;
    const dayMs = 24 * 60 * 60 * 1000;
    const acceptance = new Date(user.registrationDate);
    // Use earliest publishDate from mockAds as a proxy for ad start
    const earliestAdStr = ads
      .map(a => a.publishDate)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
    const adStart = earliestAdStr ? new Date(earliestAdStr) : acceptance;
    const start = adStart.getTime() > acceptance.getTime() ? adStart : acceptance;
    const end = new Date(expiryDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / dayMs);
    return diff > 0 ? diff : 0;
  };

  // Remaining days (countdown) that decreases over time
  const getRemainingDays = (user: User | null, expiryDate: string): number => {
    if (!user || !expiryDate) return 0;
    const dayMs = 24 * 60 * 60 * 1000;
    const acceptance = new Date(user.registrationDate);
    const earliestAdStr = ads
      .map(a => a.publishDate)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
    const adStart = earliestAdStr ? new Date(earliestAdStr) : acceptance;
    const start = adStart.getTime() > acceptance.getTime() ? adStart : acceptance;
    const end = new Date(expiryDate);
    const now = new Date();
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / dayMs);
    const elapsedDays = Math.floor((now.getTime() - start.getTime()) / dayMs);
    const remaining = totalDays - elapsedDays;
    return remaining > 0 ? remaining : 0;
  };

  // Ticker to update countdown periodically
  const [countdownTick, setCountdownTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setCountdownTick(t => t + 1), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setShowUserProfile(true);
  };

  const enableEdit = () => {
    if (!selectedUser) return;
    setIsEditing(true);
    setEditForm({ ...selectedUser });
  };

  const saveEdit = async () => {
    if (!selectedUser || !editForm) return;
    try {
      const roleRaw = editForm.role?.trim();
      const roleMapped = roleRaw === 'معلن' ? 'advertiser' : roleRaw === 'مستخدم' ? 'user' : roleRaw || undefined;
      const payload = {
        name: editForm.name?.trim() || undefined,
        phone: editForm.phone?.trim() || undefined,
        role: roleMapped,
        status: editForm.status === 'banned' ? 'blocked' : 'active',
      };
      const resp = await updateUser(Number(selectedUser.id), payload);
      const u = resp.user;
      const updated: User = {
        id: String(u.id),
        name: u.name ?? '',
        phone: u.phone,
        userCode: u.user_code,
        status: u.status === 'active' ? 'active' : 'banned',
        registrationDate: u.registered_at,
        adsCount: typeof u.listings_count === 'number' ? u.listings_count : 0,
        role: u.role,
        lastLogin: u.registered_at,
        phoneVerified: selectedUser.phoneVerified,
      };
      setUsers(prev => prev.map(x => (x.id === selectedUser.id ? updated : x)));
      setSelectedUser(updated);
      setIsEditing(false);
      setEditForm(null);
      showToast('تم حفظ التعديلات بنجاح', 'success');
    } catch (e) {
      showToast('تعذر حفظ التعديلات', 'error');
    }
  };

  const handleResetPassword = (userId: string) => {
    const user = users.find(u => u.id === userId);
    showToast(`تم إرسال رابط إعادة تعيين كلمة السر للمستخدم ${user?.name}`, 'success');
  };

  const handleChangePassword = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      showToast('تعذر العثور على المستخدم', 'error');
      return;
    }

    const newPassword = '123456789';

    setUsers(users.map(u =>
      u.id === userId
        ? { ...u, lastLogin: new Date().toISOString().split('T')[0] }
        : u
    ));

    const phoneNormalized = user.phone.replace(/[^+\d]/g, '').replace('+', '');
    if (!phoneNormalized) {
      showToast('رقم هاتف المستخدم غير صالح لإرسال واتساب', 'warning');
      return;
    }

    const message = encodeURIComponent(
      `مرحبًا ${user.name}، تم تغيير كلمة السر الخاصة بحسابك إلى: ${newPassword}.\nيرجى تسجيل الدخول وتغييرها بعد أول دخول.\nفريق ناس مصر`
    );
    const waUrl = `https://wa.me/${phoneNormalized}?text=${message}`;

    try {
      window.open(waUrl, '_blank');
      showToast(`تم تغيير كلمة السر وإرسالها عبر واتساب للمستخدم ${user.name}`, 'success');
    } catch (e) {
      showToast('تم تغيير كلمة السر، لكن تعذر فتح واتساب', 'warning');
    }
  };

  const handleSetPIN = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      showToast('تعذر العثور على المستخدم', 'error');
      return;
    }
    try {
      const resp = await changeUserPassword(Number(userId));
      const msg = resp.message;
      try {
        await navigator.clipboard.writeText(msg);
        showToast('تم نسخ الرسالة بنجاح', 'success');
      } catch (e) {
        showToast('تعذر النسخ تلقائيًا، يرجى النسخ يدويًا', 'warning');
      }
    } catch (e) {
      showToast('تعذر تغيير كلمة السر', 'error');
    }
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
            {/*}
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
            </button>*/}
          </div>

          <div className="tab-content">
            {activeTab === 'data' && (
              <div className={`user-data-tab ${isEditing ? 'edit-mode' : ''}`}>
                <div className="tab-actions">
                  {!isEditing ? (
                    <button className="btn-edit" onClick={enableEdit}>
                      تفعيل التعديل
                    </button>
                  ) : (
                    <button className="btn-save" onClick={saveEdit}>
                      حفظ التعديلات
                    </button>
                  )}
                </div>
                <div className="data-grid">
              <div className="data-item">
                <label>الاسم الكامل:</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm?.name ?? ''}
                    onChange={(e) =>
                      setEditForm((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                    }
                    className="input"
                  />
                ) : (
                  <span>
                    {selectedUser.name}
                    {selectedUser.phoneVerified && (
                      <span className="verified-badge" title="موثّق" style={{ marginRight: 8 }}>
                        ✓
                      </span>
                    )}
                  </span>
                )}
              </div>
                  <div className="data-item">
                    <label>رقم الهاتف:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm?.phone ?? ''}
                        onChange={(e) =>
                          setEditForm((prev) => (prev ? { ...prev, phone: e.target.value } : prev))
                        }
                        className="input"
                      />
                    ) : (
                      <span>{selectedUser.phone}</span>
                    )}
                  </div>
                  <div className="data-item">
                    <label>كود المستخدم:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm?.userCode ?? ''}
                        onChange={(e) =>
                          setEditForm((prev) => (prev ? { ...prev, userCode: e.target.value } : prev))
                        }
                        className="input"
                      />
                    ) : (
                      <span>{selectedUser.userCode}</span>
                    )}
                  </div>
                  <div className="data-item">
                    <label>الحالة:</label>
                    {isEditing ? (
                      <select
                        value={editForm?.status ?? 'active'}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, status: e.target.value as User['status'] } : prev
                          )
                        }
                        className="input"
                      >
                        <option value="active">نشط</option>
                        <option value="banned">محظور</option>
                      </select>
                    ) : (
                      <span className={`status-badge ${selectedUser.status}`}>
                        {selectedUser.status === 'active' ? 'نشط' : 'محظور'}
                      </span>
                    )}
                  </div>
                  <div className="data-item">
                    <label>تاريخ التسجيل:</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm?.registrationDate ?? ''}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, registrationDate: e.target.value } : prev
                          )
                        }
                        className="input"
                      />
                    ) : (
                      <span>{selectedUser.registrationDate}</span>
                    )}
                  </div>
                  <div className="data-item">
                    <label>آخر تسجيل دخول:</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm?.lastLogin ?? ''}
                        onChange={(e) =>
                          setEditForm((prev) => (prev ? { ...prev, lastLogin: e.target.value } : prev))
                        }
                        className="input"
                      />
                    ) : (
                      <span>{selectedUser.lastLogin}</span>
                    )}
                  </div>
                  <div className="data-item">
                    <label>الدور:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm?.role ?? ''}
                        onChange={(e) =>
                          setEditForm((prev) => (prev ? { ...prev, role: e.target.value } : prev))
                        }
                        className="input"
                      />
                    ) : (
                      <span>{selectedUser.role}</span>
                    )}
                  </div>
                  <div className="data-item">
                    <label>عدد الإعلانات:</label>
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        value={editForm?.adsCount ?? 0}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, adsCount: Number(e.target.value) } : prev
                          )
                        }
                        className="input"
                      />
                    ) : (
                      <span>{selectedUser.adsCount}</span>
                    )}
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
                      <option value="all">all</option>
                      {categories.filter(cat => cat !== 'all').map((slug) => (
                        <option key={slug} value={slug}>{slug}</option>
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
                <div className="subscription-form">
                  <h4>اشتراك سنوي للمستخدم</h4>
                  <div className="subscription-grid">
                    <div className="form-group">
                      <label>قيمة الاشتراك السنوي</label>
                      <input
                        type="number"
                        min={0}
                        className="form-input"
                        value={subscriptionForm.annualFee}
                        onChange={(e) => handleSubscriptionChange('annualFee', Number(e.target.value))}
                      />
                    </div>
                    <div className="form-group">
                      <label>المبلغ المدفوع</label>
                      <input
                        type="number"
                        min={0}
                        className="form-input"
                        value={subscriptionForm.paidAmount}
                        onChange={(e) => handleSubscriptionChange('paidAmount', Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="subscription-actions">
                    <button className="btn-save" onClick={saveSubscriptionForUser}>حفظ الاشتراك</button>
                  </div>
                </div>
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
      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={closeAddUserModal}>
          <div className="add-user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>إضافة مستخدم جديد</h3>
              <button className="modal-close" onClick={closeAddUserModal}>✕</button>
            </div>
            <div className="modal-content">
              <div className="edit-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>الاسم الكامل</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newUserForm.name}
                      onChange={(e) => handleNewUserChange('name', e.target.value)}
                      placeholder="اسم المستخدم"
                    />
                  </div>
                  <div className="form-group">
                    <label>رقم الهاتف</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={newUserForm.phone}
                      onChange={(e) => handleNewUserChange('phone', e.target.value)}
                      placeholder="+20 1XX XXX XXXX"
                    />
                  </div>
                  <div className="form-group">
                    <label>الدور</label>
                    <select
                      className="form-select"
                      value={newUserForm.role}
                      onChange={(e) => handleNewUserChange('role', e.target.value)}
                    >
                      <option value="معلن">معلن</option>
                      <option value="مستخدم">مستخدم</option>
                      <option value="مشرف">مشرف</option>
                      <option value="مراجع">مراجع</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>الحالة</label>
                    <select
                      className="form-select"
                      value={newUserForm.status}
                      onChange={(e) => handleNewUserChange('status', e.target.value)}
                    >
                      <option value="active">نشط</option>
                      <option value="banned">محظور</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>تاريخ التسجيل</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newUserForm.registrationDate}
                      onChange={(e) => handleNewUserChange('registrationDate', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>آخر تسجيل دخول</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newUserForm.lastLogin}
                      onChange={(e) => handleNewUserChange('lastLogin', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>عدد الإعلانات</label>
                    <input
                      type="number"
                      min={0}
                      className="form-input"
                      value={newUserForm.adsCount}
                      onChange={(e) => handleNewUserChange('adsCount', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeAddUserModal}>إلغاء</button>
              <button className="btn-save-user" onClick={saveNewUser}>حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* Packages Modal */}
      {isPackagesModalOpen && selectedUserForPackages && (
        <div className="modal-overlay" onClick={closePackagesModal}>
          <div className="packages-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>إدارة باقات المستخدم</h3>
              <button className="modal-close" onClick={closePackagesModal}>✕</button>
            </div>
            <div className="modal-content">
              <div className="inline-fields">
                <div className="field">
                  <label>الباقة</label>
                  <select
                    className="form-select"
                    value={packagesForm.plan}
                    onChange={(e) => handlePackagesChange('plan', e.target.value as UserPackage['plan'])}
                  >
                    <option value="متميز">متميز</option>
                    <option value="ستاندر">ستاندر</option>
                  </select>
                </div>
                <div className="field">
                  <label>عدد الإعلانات</label>
                  <input
                    type="number"
                    className="form-input"
                    min={0}
                    value={packagesForm.adsCount}
                    onChange={(e) => handlePackagesChange('adsCount', Number(e.target.value))}
                  />
                </div>
                <div className="field expiry">
                  <label>تاريخ انتهاء الصلاحية</label>
                  <div className="input-with-days">
                    <input
                      type="date"
                      className="form-input has-days"
                      value={packagesForm.expiryDate}
                      onChange={(e) => handlePackagesChange('expiryDate', e.target.value)}
                    />
                    <div className="days-inside">متبقي: {getRemainingDays(selectedUserForPackages, packagesForm.expiryDate)} يوم</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closePackagesModal}>إلغاء</button>
              <button className="btn-save-package" onClick={savePackages}>حفظ الباقة</button>
            </div>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {isVerifyModalOpen && userForVerify && (
        <div className="modal-overlay" onClick={closeVerifyModal}>
          <div className="verify-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>كود التحقق</h3>
              <button className="modal-close" onClick={closeVerifyModal}>✕</button>
            </div>
            <div className="modal-content">
              <div className="code-row">
                <div className="code-display" title="اضغط للنسخ" onClick={copyVerificationCode}>{verificationCode}</div>
                <button className="copy-icon" onClick={copyVerificationCode} title="نسخ الكود">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="9" y="9" width="11" height="11" rx="2" ry="2" stroke="white" strokeWidth="2"/>
                    <rect x="4" y="4" width="11" height="11" rx="2" ry="2" stroke="white" strokeWidth="2"/>
                  </svg>
                </button>
                <button className="whatsapp-icon" onClick={() => openWhatsAppWithCode(userForVerify)} title="إرسال عبر واتساب">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.8 15.2c-.4.2-1 .4-1.5.2-.3-.1-.7-.2-1.1-.5-.6-.3-1.2-.8-1.7-1.4-.5-.5-.9-1.1-1.1-1.6-.2-.4-.3-.8-.2-1.1.1-.6.7-.9 1.1-1.1l.3-.2c.1-.1.2-.1.3 0 .1.1.7.9.8 1 .1.1.1.2 0 .3l-.3.4c-.1.1-.1.2 0 .4.2.3.5.7.8 1 .3.3.7.6 1 .8.1.1.3.1.4 0l.4-.3c.1-.1.2-.1.3 0 .1.1.9.7 1 .8.1.1.1.2 0 .3l-.1.2c-.2.4-.6.9-1.2 1.1z" fill="white"/>
                    <path d="M20 12a8 8 0 1 0-14.6 4.8L4 21l4.3-1.3A8 8 0 0 0 20 12z" stroke="white" strokeWidth="2" fill="none"/>
                  </svg>
                </button>
              </div>
              <p className="verify-helper">يمكنك نسخ الكود وإرساله للمستخدم عبر الواتساب.</p>
            </div>
            <div className="modal-footer">
              {/* <button className="btn-cancel" onClick={closeVerifyModal}>إغلاق</button> */}
          {/*    <button className="btn-verify-done" onClick={() => { if (userForVerify) handleVerifyPhone(userForVerify.id); closeVerifyModal(); }}>تم التحقق</button>*/}
            </div>
          </div>
        </div>
      )}
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <div className="toast-content">
              <span className="toast-message">{toast.message}</span>
              {toast.actions && toast.actions.length > 0 && (
                <div className="toast-actions">
                  {toast.actions.map((action, idx) => (
                    <button
                      key={idx}
                      className={`toast-action ${action.variant ?? 'primary'}`}
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
            <button
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="إغلاق"
            >
              ×
            </button>
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
              className="btn-add-user"
              onClick={openAddUserModal}
            >
              ➕ إضافة مستخدم
            </button>
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
                  <td className="user-name">
                    {user.name}
                    {user.phoneVerified && (
                      <span className="verified-badge" title="موثّق" style={{ marginRight: 6 }}>
                        ✓
                      </span>
                    )}
                  </td>
                  <td className="user-phone">
                    <div className="phone-with-whatsapp">
                      <span>{user.phone}</span>
                      <button
                        className="whatsapp-icon"
                        onClick={() => openWhatsAppContact(user)}
                        title="فتح واتساب"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16.8 15.2c-.4.2-1 .4-1.5.2-.3-.1-.7-.2-1.1-.5-.6-.3-1.2-.8-1.7-1.4-.5-.5-.9-1.1-1.1-1.6-.2-.4-.3-.8-.2-1.1.1-.6.7-.9 1.1-1.1l.3-.2c.1-.1.2-.1.3 0 .1.1.7.9.8 1 .1.1.1.2 0 .3l-.3.4c-.1.1-.1.2 0 .4.2.3.5.7.8 1 .3.3.7.6 1 .8.1.1.3.1.4 0l.4-.3c.1-.1.2-.1.3 0 .1.1.9.7 1 .8.1.1.1.2 0 .3l-.1.2c-.2.4-.6.9-1.2 1.1z" fill="white"/>
                          <path d="M20 12a8 8 0 1 0-14.6 4.8L4 21l4.3-1.3A8 8 0 0 0 20 12z" stroke="white" strokeWidth="2" fill="none"/>
                        </svg>
                      </button>
                    </div>
                  </td>
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
                      {/* <button
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
                      </button> */}
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
                      <button
                        className="btn-verify-phone"
                        onClick={() => openVerifyModal(user)}
                        title="عرض كود التحقق"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
                          <path d="M8 12l2.5 2.5L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        className="btn-packages"
                        onClick={() => openPackagesModal(user)}
                        title="الباقات"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 7l9-4 9 4-9 4-9-4z" stroke="white" strokeWidth="2"/>
                          <path d="M3 12l9 4 9-4" stroke="white" strokeWidth="2"/>
                          <path d="M3 12v5l9 4 9-4v-5" stroke="white" strokeWidth="2"/>
                        </svg>
                      </button>
                      <button
                        className="btn-delete-user"
                        onClick={() => handleDeleteUser(user.id)}
                        title="حذف المستخدم"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6h18" stroke="white" strokeWidth="2"/>
                          <path d="M8 6V4h8v2" stroke="white" strokeWidth="2"/>
                          <path d="M6 6l1 14h10l1-14" stroke="white" strokeWidth="2"/>
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
                  <h3 className="user-name">
                    {user.name}
                    {user.phoneVerified && (
                      <span className="verified-badge" title="موثّق" style={{ marginRight: 6 }}>
                        ✓
                      </span>
                    )}
                  </h3>
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
                    <span className="info-value phone-with-whatsapp">
                      {user.phone}
                      <button
                        className="whatsapp-icon"
                        onClick={() => openWhatsAppContact(user)}
                        title="فتح واتساب"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16.8 15.2c-.4.2-1 .4-1.5.2-.3-.1-.7-.2-1.1-.5-.6-.3-1.2-.8-1.7-1.4-.5-.5-.9-1.1-1.1-1.6-.2-.4-.3-.8-.2-1.1.1-.6.7-.9 1.1-1.1l.3-.2c.1-.1.2-.1.3 0 .1.1.7.9.8 1 .1.1.1.2 0 .3l-.3.4c-.1.1-.1.2 0 .4.2.3.5.7.8 1 .3.3.7.6 1 .8.1.1.3.1.4 0l.4-.3c.1-.1.2-.1.3 0 .1.1.9.7 1 .8.1.1.1.2 0 .3l-.1.2c-.2.4-.6.9-1.2 1.1z" fill="white"/>
                          <path d="M20 12a8 8 0 1 0-14.6 4.8L4 21l4.3-1.3A8 8 0 0 0 20 12z" stroke="white" strokeWidth="2" fill="none"/>
                        </svg>
                      </button>
                    </span>
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
                {/* <button
                  className="btn-reset-password"
                  onClick={() => handleResetPassword(user.id)}
                  title="إعادة تعيين كلمة السر"
                >
                  إعادة تعيين
                </button> */}
                <button
                  className="btn-change-password"
                  onClick={() => handleChangePassword(user.id)}
                  title="تغيير كلمة السر"
                >
                  تغيير كلمة السر
                </button>
                {/* <button
                  className="btn-set-pin"
                  onClick={() => handleSetPIN(user.id)}
                  title="تعيين PIN"
                >
                  تعيين PIN
                </button> */}
                <button
                  className="btn-verify-phone"
                  onClick={() => openVerifyModal(user)}
                  title="عرض كود التحقق"
                >
                  توثيق
                </button>
                <button
                  className="btn-packages"
                  onClick={() => openPackagesModal(user)}
                  title="الباقات"
                >
                  الباقات
                </button>
                <button
                  className="btn-delete-user"
                  onClick={() => handleDeleteUser(user.id)}
                  title="حذف المستخدم"
                >
                  حذف
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