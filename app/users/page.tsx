'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ManagedSelect from '@/components/ManagedSelect';
import { CATEGORY_LABELS_AR } from '@/constants/categories';
import { fetchUsersSummary, fetchUsersSummaryPage, updateUser, toggleUserBlock, deleteUser, createUser, changeUserPassword, createUserOtp, fetchUserListings, fetchCategories, assignUserPackage, setUserFeaturedCategories, disableUserFeatured } from '@/services/users';
import { CATEGORY_SLUGS, CategorySlug } from '@/models/makes';
import { UsersMeta, AssignUserPackagePayload } from '@/models/users';

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
  featuredAds: number;
  featuredDays: number;
  startFeaturedNow: boolean;
  featuredStartDate?: string | null;
  featuredExpiryDate?: string | null;
  standardAds: number;
  standardDays: number;
  startStandardNow: boolean;
  standardStartDate?: string | null;
  standardExpiryDate?: string | null;
}

interface AdItem {
  id: string;
  title: string;
  status: string;
  publishDate: string;
  category: string;
  image: string;
  categorySlug?: string;
  price?: string | null;
  contactPhone?: string | null;
  whatsappPhone?: string | null;
  planType?: string;
  views?: number;
  rank?: number;
  governorate?: string | null;
  city?: string | null;
  lat?: string;
  lng?: string;
  attributes?: Record<string, string | undefined | null>;
}

const toImageUrl = (src: string | null | undefined): string => {
  if (!src || src === 'NULL') return '/file.svg';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  const trimmed = src.startsWith('/') ? src.slice(1) : src;
  return `https://api.nasmasr.app/${trimmed}`;
};

const normalizeCategorySlug = (slug: string): CategorySlug | null => {
  const s = String(slug || '').trim();
  if (!s) return null;
  const variants = [s, s.replace(/-/g, '_'), s.replace(/_/g, '-')];
  for (const v of variants) {
    const i = CATEGORY_SLUGS.indexOf(v as CategorySlug);
    if (i >= 0) return CATEGORY_SLUGS[i];
  }
  return null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'users' | 'advertisers' | 'delegates'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('data');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersMeta, setUsersMeta] = useState<UsersMeta | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const usersPerPage = 10;
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<User | null>(null);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['all']);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [adInModal, setAdInModal] = useState<AdItem | null>(null);
  type UserSubscriptionForm = { title: string; annualFee: number; paidAmount: number };
  const SUB_LS_PREFIX = 'userSubscription:';
  const [subscriptionForm, setSubscriptionForm] = useState<UserSubscriptionForm>({ title: '', annualFee: 0, paidAmount: 0 });
  type TransactionItem = { title: string; annualFee: number; paidAmount: number; date: string };
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetchUsersSummaryPage(currentPage);
        const mapped = resp.users.map(u => ({
          id: String(u.id),
          name: u.name ?? '',
          phone: u.phone,
          userCode: String(u.id),
          status: u.status === 'active' ? 'active' : 'banned',
          registrationDate: u.registered_at,
          adsCount: typeof u.listings_count === 'number' ? u.listings_count : 0,
          role: u.role,
          lastLogin: u.registered_at,
          phoneVerified: false,
        } as User));
        setUsers(mapped);
        setUsersMeta(resp.meta);
        if (resp.meta?.page && resp.meta.page !== currentPage) setCurrentPage(resp.meta.page);
      } catch (e) {
        showToast('تعذر تحميل المستخدمين', 'error');
      }
    };
    load();
  }, [currentPage]);

  useEffect(() => {
    if (!selectedUser) return;
    try {
      const raw = localStorage.getItem(SUB_LS_PREFIX + selectedUser.id);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserSubscriptionForm>;
        setSubscriptionForm({
          title: typeof parsed.title === 'string' ? parsed.title : String(parsed.title ?? ''),
          annualFee: typeof parsed.annualFee === 'number' ? parsed.annualFee : Number(parsed.annualFee) || 0,
          paidAmount: typeof parsed.paidAmount === 'number' ? parsed.paidAmount : Number(parsed.paidAmount) || 0,
        });
      } else {
        setSubscriptionForm({ title: '', annualFee: 0, paidAmount: 0 });
      }
    } catch {
      setSubscriptionForm({ title: '', annualFee: 0, paidAmount: 0 });
    }
  }, [selectedUser]);

  const handleSubscriptionChange = (field: keyof UserSubscriptionForm, value: number | string) => {
    setSubscriptionForm(prev => ({ ...prev, [field]: value }));
  };

  const saveSubscriptionForUser = () => {
    if (!selectedUser) return;
    try {
      const payload = { ...subscriptionForm, updatedAt: new Date().toISOString() };
      localStorage.setItem(SUB_LS_PREFIX + selectedUser.id, JSON.stringify(payload));
      const txKey = SUB_LS_PREFIX + selectedUser.id + ':tx';
      const now = new Date().toISOString().split('T')[0];
      const newTx: TransactionItem = {
        title: String(subscriptionForm.title || ''),
        annualFee: Number(subscriptionForm.annualFee) || 0,
        paidAmount: Number(subscriptionForm.paidAmount) || 0,
        date: now,
      };
      const raw = localStorage.getItem(txKey);
      const arr = raw ? JSON.parse(raw) as TransactionItem[] : [];
      const next = Array.isArray(arr) ? [...arr, newTx] : [newTx];
      localStorage.setItem(txKey, JSON.stringify(next));
      setTransactions(next);
      showToast('تم حفظ بيانات الاشتراك السنوي لهذا المستخدم', 'success');
    } catch {
      showToast('تعذر حفظ بيانات الاشتراك السنوي', 'error');
    }
  };

  useEffect(() => {
    const loadCats = async () => {
      try {
        const resp = await fetchCategories();
        const slugs = Array.isArray(resp?.data) ? resp.data.map((c: { slug: string }) => c.slug).filter(Boolean) : [];
        setCategories(['all', ...slugs]);
      } catch (e) {
        setCategories(['all']);
      }
    };
    loadCats();
  }, []);



  // Packages modal state
  const [isPackagesModalOpen, setIsPackagesModalOpen] = useState(false);
  const [selectedUserForPackages, setSelectedUserForPackages] = useState<User | null>(null);
  const [packagesForm, setPackagesForm] = useState<UserPackage>({
    featuredAds: 0,
    featuredDays: 0,
    startFeaturedNow: false,
    featuredStartDate: null,
    featuredExpiryDate: null,
    standardAds: 0,
    standardDays: 0,
    startStandardNow: false,
    standardStartDate: null,
    standardExpiryDate: null,
  });

  // Verify modal state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [userForVerify, setUserForVerify] = useState<User | null>(null);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const FAV_LS_PREFIX = 'userFavorites:';
  const FAV_RECORD_PREFIX = 'userFeaturedRecordId:';
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [selectedUserForFavorites, setSelectedUserForFavorites] = useState<User | null>(null);
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);

  const openAdDetailsModal = (ad: AdItem) => {
    setAdInModal(ad);
    setIsAdModalOpen(true);
  };
  const closeAdDetailsModal = () => {
    setIsAdModalOpen(false);
    setAdInModal(null);
  };

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

  const openFavoritesModal = (user: User) => {
    setSelectedUserForFavorites(user);
    try {
      const raw = localStorage.getItem(FAV_LS_PREFIX + user.id);
      const arr = raw ? JSON.parse(raw) as string[] : [];
      setFavoriteSlugs(Array.isArray(arr) ? arr.filter(Boolean) : []);
    } catch {
      setFavoriteSlugs([]);
    }
    setIsFavoritesModalOpen(true);
  };
  const closeFavoritesModal = () => {
    setIsFavoritesModalOpen(false);
    setSelectedUserForFavorites(null);
    setFavoriteSlugs([]);
  };
  const toggleFavoriteSlug = (slug: string, v: boolean) => {
    setFavoriteSlugs(prev => {
      const set = new Set(prev);
      if (v) set.add(slug); else set.delete(slug);
      return Array.from(set);
    });
  };
  const saveFavoritesForUser = async () => {
    if (!selectedUserForFavorites) return;
    const uid = Number(selectedUserForFavorites.id);
    const ids = Array.from(new Set(favoriteSlugs))
      .map((slug) => normalizeCategorySlug(slug))
      .map((s) => (s ? CATEGORY_SLUGS.indexOf(s) + 1 : 0))
      .filter((id) => id > 0);
    if (ids.length === 0) {
      showToast('يجب اختيار قسم واحد على الأقل قبل الحفظ', 'warning');
      return;
    }
    try {
      const resp = await setUserFeaturedCategories({ user_id: uid, category_ids: ids });
      const rid = typeof resp.record_id === 'number' ? resp.record_id : (typeof resp?.data?.id === 'number' ? resp.data.id : undefined);
      if (typeof rid === 'number') {
        localStorage.setItem(FAV_RECORD_PREFIX + selectedUserForFavorites.id, String(rid));
      }
      localStorage.setItem(FAV_LS_PREFIX + selectedUserForFavorites.id, JSON.stringify(Array.from(new Set(favoriteSlugs))));
      showToast('تم حفظ المفضلة للمعلن', 'success');
      closeFavoritesModal();
    } catch (e) {
      const m = e as unknown;
      const msg = m && typeof m === 'object' && 'message' in m ? String((m as { message?: string }).message || '') : '';
      showToast(msg || 'تعذر حفظ المفضلة', 'error');
    }
  };
  const clearFavoritesForUser = async () => {
    if (!selectedUserForFavorites) return;
    const uid = String(selectedUserForFavorites.id);
    const ridRaw = localStorage.getItem(FAV_RECORD_PREFIX + uid);
    const rid = ridRaw && ridRaw.trim() ? ridRaw.trim() : '';
    try {
      if (rid) {
        await disableUserFeatured(rid);
        localStorage.removeItem(FAV_RECORD_PREFIX + uid);
      }
      localStorage.setItem(FAV_LS_PREFIX + selectedUserForFavorites.id, JSON.stringify([]));
      setFavoriteSlugs([]);
      showToast(rid ? 'تم إلغاء التفضيل في جميع الأقسام' : 'لا توجد تفضيلات محفوظة، تم الإلغاء محليًا', 'success');
    } catch (e) {
      const m = e as unknown;
      const msg = m && typeof m === 'object' && 'message' in m ? String((m as { message?: string }).message || '') : '';
      showToast(msg || 'تعذر الإلغاء', 'error');
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
        userCode: String(u.id),
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
        const mapped = resp.listings.map(l => {
          const title = l.attributes?.property_type && l.attributes?.contract_type
            ? `${l.attributes.property_type} | ${l.attributes.contract_type}`
            : (l.attributes?.main_category && l.attributes?.sub_category
              ? `${l.attributes.main_category} | ${l.attributes.sub_category}`
              : (l.category_name || l.category || `#${l.id}`));
          return {
            id: String(l.id),
            title,
            status: 'منشور',
            publishDate: l.created_at,
            category: l.category_name || l.category,
            image: toImageUrl(l.main_image_url),
            categorySlug: l.category,
            price: l.price,
            contactPhone: l.contact_phone,
            whatsappPhone: l.whatsapp_phone,
            planType: l.plan_type,
            views: l.views,
            rank: l.rank,
            governorate: l.governorate,
            city: l.city,
            lat: l.lat,
            lng: l.lng,
            attributes: l.attributes as Record<string, string | undefined | null>,
          } as AdItem;
        });
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
          ad.categorySlug === selectedCategory ||
          ad.category === (CATEGORY_LABELS_AR[selectedCategory] ?? selectedCategory)
      );
  const filteredUsers = users
    .filter((user) => {
      if (roleFilter === 'users') return user.role === 'user';
      if (roleFilter === 'advertisers') return user.role === 'advertiser';
      if (roleFilter === 'delegates') return user.role === 'delegate' || user.role === 'representative';
      return true;
    })
    .filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      user.userCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Pagination calculations
  const totalPages = usersMeta ? Math.max(1, usersMeta.last_page) : Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = usersMeta ? filteredUsers : filteredUsers.slice(startIndex, endIndex);
  const serverPage = usersMeta ? usersMeta.page : currentPage;
  const serverPerPage = usersMeta ? usersMeta.per_page : usersPerPage;
  const serverTotal = usersMeta ? usersMeta.total : filteredUsers.length;
  const displayStart = serverTotal > 0 ? ((serverPage - 1) * serverPerPage + 1) : 0;
  const displayEnd = serverTotal > 0 ? Math.min(serverPage * serverPerPage, serverTotal) : 0;

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
  }, [searchTerm, roleFilter]);

  // Reset edit mode when switching selected user
  useEffect(() => {
    setIsEditing(false);
    setEditForm(null);
  }, [selectedUser]);
  useEffect(() => {
    if (!selectedUser) return;
    try {
      const raw = localStorage.getItem(SUB_LS_PREFIX + selectedUser.id);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserSubscriptionForm> & { updatedAt?: string };
        setSubscriptionForm({
          title: typeof parsed.title === 'string' ? parsed.title : String(parsed.title ?? ''),
          annualFee: typeof parsed.annualFee === 'number' ? parsed.annualFee : Number(parsed.annualFee) || 0,
          paidAmount: typeof parsed.paidAmount === 'number' ? parsed.paidAmount : Number(parsed.paidAmount) || 0,
        });
      } else {
        setSubscriptionForm({ title: '', annualFee: 0, paidAmount: 0 });
      }
      const txRaw = localStorage.getItem(SUB_LS_PREFIX + selectedUser.id + ':tx');
      const txArr = txRaw ? JSON.parse(txRaw) as TransactionItem[] : [];
      setTransactions(Array.isArray(txArr) ? txArr : []);
    } catch {
      setSubscriptionForm({ title: '', annualFee: 0, paidAmount: 0 });
      setTransactions([]);
    }
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
    try {
      const raw = localStorage.getItem('userPackageData:' + user.id);
      if (raw) {
        const data = JSON.parse(raw);
        setPackagesForm({
          featuredAds: Number(data.featured_ads) || 0,
          featuredDays: Number(data.featured_days) || 0,
          startFeaturedNow: Boolean(data.featured_active),
          featuredStartDate: data.featured_start_date ? String(data.featured_start_date).split('T')[0] : null,
          featuredExpiryDate: data.featured_expire_date ? String(data.featured_expire_date).split('T')[0] : null,
          standardAds: Number(data.standard_ads) || 0,
          standardDays: Number(data.standard_days) || 0,
          startStandardNow: Boolean(data.standard_active),
          standardStartDate: data.standard_start_date ? String(data.standard_start_date).split('T')[0] : null,
          standardExpiryDate: data.standard_expire_date ? String(data.standard_expire_date).split('T')[0] : null,
        });
      } else {
        setPackagesForm(
          user.package ?? {
            featuredAds: 0,
            featuredDays: 0,
            startFeaturedNow: false,
            featuredStartDate: null,
            featuredExpiryDate: null,
            standardAds: 0,
            standardDays: 0,
            startStandardNow: false,
            standardStartDate: null,
            standardExpiryDate: null,
          }
        );
      }
    } catch {
      setPackagesForm(
        user.package ?? {
          featuredAds: 0,
          featuredDays: 0,
          startFeaturedNow: false,
          featuredStartDate: null,
          featuredExpiryDate: null,
          standardAds: 0,
          standardDays: 0,
          startStandardNow: false,
          standardStartDate: null,
          standardExpiryDate: null,
        }
      );
    }
    setIsPackagesModalOpen(true);
  };

  const persistPackagesLocal = (uid?: number | string) => {
    try {
      const id = uid ?? selectedUserForPackages?.id;
      if (!id) return;
      const payload = {
        featured_ads: Number(packagesForm.featuredAds) || 0,
        featured_days: Number(packagesForm.featuredDays) || 0,
        featured_start_date: packagesForm.featuredStartDate ? new Date(packagesForm.featuredStartDate).toISOString() : null,
        featured_expire_date: packagesForm.featuredExpiryDate ? new Date(packagesForm.featuredExpiryDate).toISOString() : null,
        standard_ads: Number(packagesForm.standardAds) || 0,
        standard_days: Number(packagesForm.standardDays) || 0,
        standard_start_date: packagesForm.standardStartDate ? new Date(packagesForm.standardStartDate).toISOString() : null,
        standard_expire_date: packagesForm.standardExpiryDate ? new Date(packagesForm.standardExpiryDate).toISOString() : null,
        featured_active: Boolean(packagesForm.startFeaturedNow),
        standard_active: Boolean(packagesForm.startStandardNow),
      };
      localStorage.setItem('userPackageData:' + id, JSON.stringify(payload));
    } catch {}
  };

  const closePackagesModal = () => {
    setIsPackagesModalOpen(false);
    setSelectedUserForPackages(null);
  };

  const handlePackagesChange = (field: keyof UserPackage, value: string | number | boolean) => {
    setPackagesForm(prev => ({ ...prev, [field]: value } as UserPackage));
  };

  const savePackages = async () => {
    if (!selectedUserForPackages) return;
    try {
      const payload: AssignUserPackagePayload = {
        user_id: Number(selectedUserForPackages.id),
        featured_ads: Number(packagesForm.featuredAds) || 0,
        featured_days: Number(packagesForm.featuredDays) || 0,
        standard_ads: Number(packagesForm.standardAds) || 0,
        standard_days: Number(packagesForm.standardDays) || 0,
      };
      if (packagesForm.startFeaturedNow) payload.start_featured_now = true;
      if (packagesForm.startStandardNow) payload.start_standard_now = true;

      if (packagesForm.featuredStartDate) payload.featured_start_date = new Date(packagesForm.featuredStartDate).toISOString();
      if (packagesForm.featuredExpiryDate) payload.featured_expire_date = new Date(packagesForm.featuredExpiryDate).toISOString();
      if (packagesForm.standardStartDate) payload.standard_start_date = new Date(packagesForm.standardStartDate).toISOString();
      if (packagesForm.standardExpiryDate) payload.standard_expire_date = new Date(packagesForm.standardExpiryDate).toISOString();
      const resp = await assignUserPackage(payload);
      const d = resp.data;
      try { localStorage.setItem('userPackageData:' + selectedUserForPackages.id, JSON.stringify(d)); } catch {}
      const updatedUser = {
        ...selectedUserForPackages,
        package: {
          featuredAds: d.featured_ads,
          featuredDays: d.featured_days,
          startFeaturedNow: Boolean(d.featured_active),
          featuredStartDate: d.featured_start_date ? String(d.featured_start_date).split('T')[0] : null,
          featuredExpiryDate: d.featured_expire_date ? String(d.featured_expire_date).split('T')[0] : null,
          standardAds: d.standard_ads,
          standardDays: d.standard_days,
          startStandardNow: Boolean(d.standard_active),
          standardStartDate: d.standard_start_date ? String(d.standard_start_date).split('T')[0] : null,
          standardExpiryDate: d.standard_expire_date ? String(d.standard_expire_date).split('T')[0] : null,
        },
      } as User;
      setUsers(prev => prev.map(u => (u.id === selectedUserForPackages.id ? updatedUser : u)));
      if (selectedUser?.id === selectedUserForPackages.id) {
        setSelectedUser(updatedUser);
      }
      setIsPackagesModalOpen(false);
      setSelectedUserForPackages(null);
      const idText = typeof d.id === 'number' ? String(d.id) : '';
      const daysText = typeof d.standard_days === 'number' ? String(d.standard_days) : '';
      const adsText = typeof d.standard_ads === 'number' ? String(d.standard_ads) : '';
      const info = idText || daysText || adsText ? ` | ID: ${idText} | الأيام: ${daysText} | الإعلانات: ${adsText}` : '';
      showToast((resp.message || 'تم تحديث الباقة بنجاح') + info, 'success');
    } catch (e) {
      showToast('تعذر حفظ الباقة للمستخدم', 'error');
    }
  };

  useEffect(() => {
    if (!isPackagesModalOpen || !selectedUserForPackages) return;
    persistPackagesLocal(selectedUserForPackages.id);
  }, [packagesForm.featuredAds, packagesForm.featuredDays, packagesForm.featuredStartDate, packagesForm.featuredExpiryDate, packagesForm.startFeaturedNow, packagesForm.standardAds, packagesForm.standardDays, packagesForm.standardStartDate, packagesForm.standardExpiryDate, packagesForm.startStandardNow, isPackagesModalOpen, selectedUserForPackages]);

  const getRemainingByDates = (startDate?: string | null, expireDate?: string | null): number => {
    if (!expireDate) return 0;
    const dayMs = 24 * 60 * 60 * 1000;
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(expireDate);
    const now = new Date();
    const base = Math.max(start.getTime(), now.getTime());
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / dayMs);
    const elapsedDays = Math.floor((now.getTime() - start.getTime()) / dayMs);
    const remaining = totalDays - elapsedDays;
    return remaining > 0 ? remaining : 0;
  };

  const getProgressPercent = (startDate?: string | null, expireDate?: string | null): number => {
    if (!startDate || !expireDate) return 0;
    const dayMs = 24 * 60 * 60 * 1000;
    const start = new Date(startDate);
    const end = new Date(expireDate);
    const now = new Date();
    if (end.getTime() <= start.getTime()) return 100;
    const total = end.getTime() - start.getTime();
    const elapsed = Math.max(0, Math.min(total, now.getTime() - start.getTime()));
    const pct = Math.round((elapsed / total) * 100);
    return pct < 0 ? 0 : pct > 100 ? 100 : pct;
  };

  // moved below countdownTick declaration

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

  useEffect(() => {
    const remF = getRemainingByDates(packagesForm.featuredStartDate, packagesForm.featuredExpiryDate);
    if (packagesForm.startFeaturedNow && packagesForm.featuredExpiryDate && remF <= 0) {
      showToast('انتهت الباقة المتميزة', 'warning');
    }
    const remS = getRemainingByDates(packagesForm.standardStartDate, packagesForm.standardExpiryDate);
    if (packagesForm.startStandardNow && packagesForm.standardExpiryDate && remS <= 0) {
      showToast('انتهت الباقة الستاندر', 'warning');
    }
  }, [countdownTick, packagesForm.startFeaturedNow, packagesForm.featuredExpiryDate, packagesForm.featuredStartDate, packagesForm.startStandardNow, packagesForm.standardExpiryDate, packagesForm.standardStartDate]);

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
        userCode: String(u.id),
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
            {/* <button 
              className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              المعاملات
            </button> */}
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
                    <ManagedSelect
                      value={selectedCategory === 'all' ? '' : selectedCategory}
                      onChange={(v) => setSelectedCategory(v || 'all')}
                      options={Object.entries(CATEGORY_LABELS_AR).map(([slug, label]) => ({ value: slug, label }))}
                      placeholder="all"
                    />
                  </div>
                </div>
                
                <div className="ads-list">
                  {filteredAds.length > 0 ? (
                    filteredAds.map((ad) => (
                      <div key={ad.id} className="ad-item" onClick={() => openAdDetailsModal(ad)}>
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

            {isAdModalOpen && adInModal && (
              <div className="modal-overlay" onClick={closeAdDetailsModal}>
                <div className="ad-details-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>تفاصيل الإعلان</h3>
                    <button className="modal-close" onClick={closeAdDetailsModal}>✕</button>
                  </div>
                  <div className="modal-content">
                    <div className="ad-details-grid">
                      <div className="ad-details-image">
                        <Image src={adInModal.image} alt={adInModal.title} width={480} height={360} style={{ objectFit: 'cover' }} />
                      </div>
                      <div className="ad-details-info">
                        <h4 className="ad-details-title">{adInModal.title}</h4>
                        <div className="ad-details-meta">
                          <span className="category-badge">{adInModal.category}</span>
                          <span className={`status-badge ${adInModal.status === 'منشور' ? 'published' : 'pending'}`}>{adInModal.status}</span>
                          <span className="publish-date">{adInModal.publishDate}</span>
                        </div>
                        <div className="ad-details-rows">
                          <div className="detail-row"><span className="detail-label">القسم</span><span className="detail-value">{adInModal.category}</span></div>
                          <div className="detail-row"><span className="detail-label">القسم (slug)</span><span className="detail-value">{adInModal.categorySlug}</span></div>
                          <div className="detail-row"><span className="detail-label">الحالة</span><span className="detail-value">{adInModal.status}</span></div>
                          <div className="detail-row"><span className="detail-label">تاريخ النشر</span><span className="detail-value">{adInModal.publishDate}</span></div>
                          <div className="detail-row"><span className="detail-label">نوع العقار</span><span className="detail-value">{adInModal.attributes?.property_type ?? '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">نوع العقد</span><span className="detail-value">{adInModal.attributes?.contract_type ?? '-'}</span></div>
                          {/* <div className="detail-row"><span className="detail-label">القسم الرئيسي</span><span className="detail-value">{adInModal.attributes?.main_category ?? '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">القسم الفرعي</span><span className="detail-value">{adInModal.attributes?.sub_category ?? '-'}</span></div> */}
                          <div className="detail-row"><span className="detail-label">السعر</span><span className="detail-value">{adInModal.price ?? '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">الهاتف</span><span className="detail-value">{adInModal.contactPhone ?? '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">واتساب</span><span className="detail-value">{adInModal.whatsappPhone ?? '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">الخطة</span><span className="detail-value">{adInModal.planType ?? '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">المشاهدات</span><span className="detail-value">{typeof adInModal.views === 'number' ? adInModal.views : '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">الترتيب</span><span className="detail-value">{typeof adInModal.rank === 'number' ? adInModal.rank : '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">المحافظة</span><span className="detail-value">{adInModal.governorate ?? '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">المدينة</span><span className="detail-value">{adInModal.city ?? '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">إحداثيات</span><span className="detail-value">{adInModal.lat ?? '-'}, {adInModal.lng ?? '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">رقم الإعلان</span><span className="detail-value">{adInModal.id}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn-primary" onClick={closeAdDetailsModal}>إغلاق</button>
                  </div>
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
                      <label>العنوان</label>
                      <input
                        type="text"
                        className="form-input"
                        value={subscriptionForm.title}
                        onChange={(e) => handleSubscriptionChange('title', e.target.value)}
                      />
                    </div>
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
                  {transactions.map((t, i) => (
                    <div className="transaction-item" key={i}>
                      <span>{t.title || '—'}</span>
                      <span>{`قيمة الاشتراك: ${t.annualFee} | المدفوع: ${t.paidAmount} جنيه`}</span>
                      <span>{t.date}</span>
                    </div>
                  ))}
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
              <div className="plan-cards">
                <div className="plan-card">
                  <div className="plan-title">الباقة المتميزة <span className={`status-pill ${packagesForm.startFeaturedNow ? (getRemainingByDates(packagesForm.featuredStartDate, packagesForm.featuredExpiryDate) > 0 ? 'success' : 'danger') : 'neutral'}`}>{packagesForm.startFeaturedNow ? (getRemainingByDates(packagesForm.featuredStartDate, packagesForm.featuredExpiryDate) > 0 ? 'نشطة' : 'منتهية') : 'غير نشطة'}</span></div>
                  <div className="plan-meta">
                    <div className="meta-item"><span className="meta-label">تاريخ البدء</span><span className="meta-value">{packagesForm.featuredStartDate || '—'}</span></div>
                    <div className="meta-item"><span className="meta-label">تاريخ الانتهاء</span><span className="meta-value">{packagesForm.featuredExpiryDate || '—'}</span></div>
                    <div className="meta-item remaining"><span className="meta-label">المتبقي</span><span className="meta-value">{getRemainingByDates(packagesForm.featuredStartDate, packagesForm.featuredExpiryDate)} يوم</span></div>
                  </div>
                  <div className="plan-progress"><div className="progress-track"><div className="progress-bar" style={{ width: `${getProgressPercent(packagesForm.featuredStartDate, packagesForm.featuredExpiryDate)}%` }}></div></div><div className="progress-label">{getProgressPercent(packagesForm.featuredStartDate, packagesForm.featuredExpiryDate)}%</div></div>
                  <div className="plan-grid">
                    <div className="field">
                      <label>عدد الإعلانات المتميزة</label>
                      <input
                        type="number"
                        className="form-input"
                        min={0}
                        value={packagesForm.featuredAds}
                        onChange={(e) => handlePackagesChange('featuredAds', Number(e.target.value))}
                      />
                    </div>
                    {/* <div className="field">
                      <label>عدد الأيام للمتميزة</label>
                      <input
                        type="number"
                        className="form-input"
                        min={0}
                        value={packagesForm.featuredDays}
                        onChange={(e) => handlePackagesChange('featuredDays', Number(e.target.value))}
                      />
                    </div> */}
                    <div className="field expiry">
                      <label>تاريخ انتهاء المتميزة</label>
                      <div className="input-with-days">
                        <input
                          type="date"
                          className="form-input has-days"
                          value={packagesForm.featuredExpiryDate || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            handlePackagesChange('featuredExpiryDate', val);
                            if (packagesForm.startFeaturedNow) {
                              const dayMs = 24 * 60 * 60 * 1000;
                              const now = new Date(); now.setHours(0,0,0,0);
                              const exp = new Date(val); exp.setHours(0,0,0,0);
                              const days = Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / dayMs));
                              handlePackagesChange('featuredDays', days);
                            }
                          }}
                        />
                        <div className="days-inside">متبقي: {getRemainingByDates(packagesForm.featuredStartDate, packagesForm.featuredExpiryDate)} يوم</div>
                      </div>
                    </div>
                  </div>
                  <label className="toggle-label compact">
                    <span className="toggle-text">بدء الآن</span>
                    <div className="toggle-switch-container">
                      <input
                        type="checkbox"
                        className="toggle-input"
                        checked={packagesForm.startFeaturedNow}
                        onChange={(e) => {
                          const v = e.target.checked;
                          handlePackagesChange('startFeaturedNow', v);
                          if (v) {
                            handlePackagesChange('featuredStartDate', new Date().toISOString().split('T')[0]);
                            handlePackagesChange('startStandardNow', false);
                          }
                        }}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-status">{packagesForm.startFeaturedNow ? 'مفعل' : 'مغلق'}</span>
                    </div>
                  </label>
                </div>
                <div className="plan-card">
                  <div className="plan-title">الباقة الستاندر <span className={`status-pill ${packagesForm.startStandardNow ? (getRemainingByDates(packagesForm.standardStartDate, packagesForm.standardExpiryDate) > 0 ? 'success' : 'danger') : 'neutral'}`}>{packagesForm.startStandardNow ? (getRemainingByDates(packagesForm.standardStartDate, packagesForm.standardExpiryDate) > 0 ? 'نشطة' : 'منتهية') : 'غير نشطة'}</span></div>
                  <div className="plan-meta">
                    <div className="meta-item"><span className="meta-label">تاريخ البدء</span><span className="meta-value">{packagesForm.standardStartDate || '—'}</span></div>
                    <div className="meta-item"><span className="meta-label">تاريخ الانتهاء</span><span className="meta-value">{packagesForm.standardExpiryDate || '—'}</span></div>
                    <div className="meta-item remaining"><span className="meta-label">المتبقي</span><span className="meta-value">{getRemainingByDates(packagesForm.standardStartDate, packagesForm.standardExpiryDate)} يوم</span></div>
                  </div>
                  <div className="plan-progress"><div className="progress-track"><div className="progress-bar" style={{ width: `${getProgressPercent(packagesForm.standardStartDate, packagesForm.standardExpiryDate)}%` }}></div></div><div className="progress-label">{getProgressPercent(packagesForm.standardStartDate, packagesForm.standardExpiryDate)}%</div></div>
                  <div className="plan-grid">
                    <div className="field">
                      <label>عدد الإعلانات الستاندر</label>
                      <input
                        type="number"
                        className="form-input"
                        min={0}
                        value={packagesForm.standardAds}
                        onChange={(e) => handlePackagesChange('standardAds', Number(e.target.value))}
                      />
                    </div>
                    {/* <div className="field">
                      <label>عدد الأيام للستاندر</label>
                      <input
                        type="number"
                        className="form-input"
                        min={0}
                        value={packagesForm.standardDays}
                        onChange={(e) => handlePackagesChange('standardDays', Number(e.target.value))}
                      />
                    </div> */}
                    <div className="field expiry">
                      <label>تاريخ انتهاء الستاندر</label>
                      <div className="input-with-days">
                        <input
                          type="date"
                          className="form-input has-days"
                          value={packagesForm.standardExpiryDate || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            handlePackagesChange('standardExpiryDate', val);
                            if (packagesForm.startStandardNow) {
                              const dayMs = 24 * 60 * 60 * 1000;
                              const now = new Date(); now.setHours(0,0,0,0);
                              const exp = new Date(val); exp.setHours(0,0,0,0);
                              const days = Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / dayMs));
                              handlePackagesChange('standardDays', days);
                            }
                          }}
                        />
                        <div className="days-inside">متبقي: {getRemainingByDates(packagesForm.standardStartDate, packagesForm.standardExpiryDate)} يوم</div>
                      </div>
                    </div>
                  </div>
                  <label className="toggle-label compact">
                    <span className="toggle-text">بدء الآن</span>
                    <div className="toggle-switch-container">
                      <input
                        type="checkbox"
                        className="toggle-input"
                        checked={packagesForm.startStandardNow}
                        onChange={(e) => {
                          const v = e.target.checked;
                          handlePackagesChange('startStandardNow', v);
                          if (v) {
                            handlePackagesChange('standardStartDate', new Date().toISOString().split('T')[0]);
                            handlePackagesChange('startFeaturedNow', false);
                          }
                        }}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-status">{packagesForm.startStandardNow ? 'مفعل' : 'مغلق'}</span>
                    </div>
                  </label>
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
      {isFavoritesModalOpen && selectedUserForFavorites && (
        <div className="modal-overlay" onClick={closeFavoritesModal}>
          <div className="favorites-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>تفضيل المعلن في الأقسام</h3>
              <button className="modal-close" onClick={closeFavoritesModal}>✕</button>
            </div>
            <div className="modal-content">
              <div className="favorites-grid">
                {categories.filter(c => c !== 'all').map((slug) => {
                  const label = CATEGORY_LABELS_AR[slug] ?? slug;
                  const checked = favoriteSlugs.includes(slug);
                  return (
                    <div key={slug} className="favorite-item">
                      <div className="favorite-label">{label}</div>
                      <label className="toggle-label compact">
                        <div className="toggle-switch-container">
                          <input
                            type="checkbox"
                            className="toggle-input"
                            checked={checked}
                            onChange={(e) => toggleFavoriteSlug(slug, e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                          <span className="toggle-status">{checked ? 'مفضل' : 'غير مفضل'}</span>
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={clearFavoritesForUser}>إلغاء التفضيل للجميع</button>
              <button className="btn-save" onClick={saveFavoritesForUser}>حفظ</button>
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
          <h1>المستخدمون والمعلِنون والمناديب</h1>
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

        <div className="users-tabs">
          <button
            className={`tab-btn ${roleFilter === 'all' ? 'active' : ''}`}
            onClick={() => setRoleFilter('all')}
          >
            الكل
          </button>
          <button
            className={`tab-btn ${roleFilter === 'users' ? 'active' : ''}`}
            onClick={() => setRoleFilter('users')}
          >
            المستخدمون
          </button>
          <button
            className={`tab-btn ${roleFilter === 'advertisers' ? 'active' : ''}`}
            onClick={() => setRoleFilter('advertisers')}
          >
            المعلنون
          </button>
          <button
            className={`tab-btn ${roleFilter === 'delegates' ? 'active' : ''}`}
            onClick={() => setRoleFilter('delegates')}
          >
            المناديب
          </button>
        </div>

        {/* Results Info */}
        <div className="results-info">
          <div className="results-count">
            عرض {displayStart} - {displayEnd} من {serverTotal} مستخدم
          </div>
          <div className="page-info">
            الصفحة {serverPage} من {totalPages}
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
                      <span className="phone-number">{user.phone}</span>

                      <button
                        className="whatsapp-icon"
                        onClick={() => openWhatsAppContact(user)}
                        title="فتح واتساب"
                      >
                        <Image src="/whatsapp_3670133.png" alt="واتساب" width={24} height={24} />
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
                      {(String(user.role || '').toLowerCase().includes('advertiser') || String(user.role || '').includes('معلن')) && (
                        <button
                          className="btn-favorites"
                          onClick={() => openFavoritesModal(user)}
                          title="المفضلة"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="white"/>
                          </svg>
                        </button>
                      )}
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

        {/* Mobile Actions */}
        <div className="table-actions mobile-actions">
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
                {(String(user.role || '').toLowerCase().includes('advertiser') || String(user.role || '').includes('معلن')) && (
                  <button
                    className="btn-favorites"
                    onClick={() => openFavoritesModal(user)}
                    title="المفضلة"
                  >
                    المفضلة
                  </button>
                )}
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
              عرض {serverTotal} مستخدم في {totalPages} صفحة
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
