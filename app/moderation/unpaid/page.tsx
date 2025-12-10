'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import ManagedSelect from '@/components/ManagedSelect';
import { ALL_CATEGORIES_OPTIONS } from '@/constants/categories';
import { updateSystemSettings, rejectListing, updateListingForm } from '@/services/listings';
import { approveListing } from '@/services/unpaidListings';
import { fetchAdminUnpaidListings } from '@/services/unpaidListings';
import { PendingListing, PendingListingsMeta } from '@/models/listings';

interface Ad {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  categorySlug?: string;
  price: string;
  location: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_modification';
  submitterName: string;
  submitterPhone: string;
  source?: PendingListing;
}

const rejectionReasons = [
  'صور غير واضحة',
  'معلومات ناقصة',
  'سعر غير مناسب',
  'محتوى مخالف',
  'تصنيف خاطئ',
  'معلومات اتصال غير صحيحة'
];

export default function UnpaidModerationPage() {
  const perPage = 50;
  const [ads, setAds] = useState<Ad[]>([]);
  const [meta, setMeta] = useState<PendingListingsMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentAdId, setCurrentAdId] = useState<string>('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonType, setReasonType] = useState<'reject' | 'modify'>('reject');
  const [reasonAdId, setReasonAdId] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [editForm, setEditForm] = useState<{ 
    title: string; 
    description: string; 
    category: string; 
    price: string; 
    currency: string;
    governorate: string;
    city: string;
    lat: string;
    lng: string;
    address: string;
    status: string;
    plan_type: string;
    country_code: string;
    contact_phone: string;
    whatsapp_phone: string;
    isPayment: boolean;
    admin_comment: string;
    make_id: string;
    make: string;
    model_id: string;
    model: string;
    views: string;
    rank: string;
    publish_via: string;
    main_image_url: string;
    main_image_file: File | null;
    attributes: Record<string, string>;
    images: (string | File)[] 
  }>({
    title: '',
    description: '',
    category: '',
    price: '',
    currency: '',
    governorate: '',
    city: '',
    lat: '',
    lng: '',
    address: '',
    status: '',
    plan_type: '',
    country_code: '',
    contact_phone: '',
    whatsapp_phone: '',
    isPayment: false,
    admin_comment: '',
    make_id: '',
    make: '',
    model_id: '',
    model: '',
    views: '',
    rank: '',
    publish_via: '',
    main_image_url: '',
    main_image_file: null,
    attributes: {},
    images: []
  });
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [autoApprove, setAutoApprove] = useState<boolean>(false);
  const uniqueCategories = Array.from(new Set(ads.map(ad => ad.category)));
  const visibleAds = useMemo(() => {
    const cf = (categoryFilter || '').trim();
    const base = ads.filter((ad) => ad.source?.isPayment === false);
    if (!cf) return base;
    return base.filter((ad) => (ad.categorySlug || '').trim() === cf);
  }, [ads, categoryFilter]);
  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const ad of ads) {
      const slug = (ad.categorySlug || ad.category || '').trim();
      const label = (ad.category || '').trim();
      if (slug) map.set(slug, label || slug);
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [ads]);
  const pendingAdsCount = visibleAds.filter(ad => ad.status === 'pending').length;
  const getCategoryCount = (slug: string) => {
    return ads.filter(ad => (ad.categorySlug || '') === slug).length;
  };
  const totalAdsCount = ads.length;
  useEffect(() => { setCurrentPage(1); }, [categoryFilter]);
  useEffect(() => { const raw = typeof window !== 'undefined' ? localStorage.getItem('moderation:autoApprove') : null; setAutoApprove(raw === 'true'); }, []);

  const normalizeStatus = (status: string | null | undefined): 'pending' | 'approved' | 'rejected' | 'needs_modification' => {
    const s = String(status || '').toLowerCase();
    if (s.includes('reject')) return 'rejected';
    if (s.includes('approve') || s.includes('publish') || s.includes('active')) return 'approved';
    return 'pending';
  };

  const formatPriceCurrency = (price: string | number | null, currency?: string | null): string => {
    const num = Number(price);
    if (!isFinite(num)) {
      return String(price ?? '');
    }
    const formatted = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(num);
    const cur = (currency || '').toUpperCase();
    const suffix = cur === 'EGP' || cur === 'ج.م' ? 'ج.م' : (cur || '');
    return `${formatted} ${suffix}`.trim();
  };

  const formatPublishVia = (publishVia?: string | null): string => {
    const v = String(publishVia || '').toLowerCase();
    if (!v) return 'تنبيه: هذا الإعلان غير مرتبط بأي باقة نشطة، أو تعاقد شامل، أو عملية دفع منفردة. يبدو أن المعلن لا يملك حالياً أي صلاحية مالية لنشر هذا الإعلان. يُرجى مراجعة حالة الحساب وقرار قبول أو رفض الإعلان وفق سياسة المنصّة';
    if (v === 'subscription') return 'إعلان صادر من باقة خاصة بهذا القسم';
    if (v === 'package') return 'إعلان ضمن تعاقد عام يشمل كل الأقسام';
    if (v === 'ad_payment') return 'إعلان مدفوع بشكل منفرد (بدون باقة)';
    return publishVia || '-';
  };

  const formatCountryCode = (code?: string | null): string => {
    const raw = String(code || '').trim();
    if (!raw) return '-';
    const digits = raw.replace(/^\+/, '');
    return `${digits}+`;
  };

  const formatPlanType = (plan?: string | null): string => {
    const v = String(plan || '').toLowerCase();
    if (!v) return '-';
    if (v === 'free') return 'مجاني';
    if (v === 'featured') return 'باقه مميزه';
    if (v === 'standard') return 'باقة ستاندر';
    return plan || '-';
  };

  const formatDateAr = (value?: string | null): string => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'قيد الانتظار';
    return d.toLocaleString('ar-EG');
  };

  const formatDateArShort = (value?: string | null): string => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  };

  const ATTRIBUTE_LABELS_AR: Record<string, string> = {
    year: 'سنة الصنع',
    kilometers: 'عدد الكيلومترات',
    fuel_type: 'نوع الوقود',
    transmission: 'ناقل الحركة',
    exterior_color: 'اللون الخارجي',
    type: 'النوع',
    property_type: 'نوع العقار',
    contract_type: 'نوع التعاقد',
    area: 'المساحة',
    rooms: 'عدد الغرف',
    bathrooms: 'عدد الحمامات',
    floor: 'الدور',
    furnished: 'مفروش',
  };
  const translateAttributeKey = (key: string): string => ATTRIBUTE_LABELS_AR[key] || key.replace(/_/g, ' ');

  const statusOptions = [
    { value: 'pending', label: 'قيد المراجعه' },
    { value: 'approved', label: 'موافق عليه' },
    { value: 'rejected', label: 'مرفوض' },
    { value: 'needs_modification', label: 'يحتاج تعديل' },
  ];
  const planTypeOptions = [
    { value: 'free', label: 'مجاني' },
    { value: 'standard', label: 'باقة ستاندر' },
    { value: 'featured', label: 'باقه مميزه' },
  ];
  const paymentOptions = [
    { value: '0', label: 'لم يتم الدفع لهذا الاعلان' },
    { value: '1', label: 'تم الدفع لهذا الاعلان' },
  ];

  const formatIsPaymentForApi = (v: boolean): string => (v ? '1' : '0');

  const formatStatusForApi = (s: string) => {
    const v = String(s || '').toLowerCase();
    if (v === 'pending') return 'Pending';
    if (v === 'approved') return 'Approved';
    if (v === 'rejected') return 'Rejected';
    if (v === 'needs_modification') return 'Needs Modification';
    return s;
  };

  const formatPhoneTrailingPlus = (phone?: string | null, countryCode?: string | null): string => {
    const p = String(phone || '').trim();
    const code = String(countryCode || '').trim();
    if (!p && !code) return 'غير متوفر';
    if (code) {
      const codeDigits = code.replace(/^\+/, '');
      const phoneDigits = p.replace(/^\+/, '');
      return `${phoneDigits} ${codeDigits}+`.trim();
    }
    if (p.startsWith('+')) {
      const phoneDigits = p.replace(/^\+/, '');
      return `${phoneDigits}+`;
    }
    return p || 'غير متوفر';
  };

  const mapListingToAd = (l: PendingListing): Ad => {
    const imgs: string[] = [];
    if (l.main_image_url) imgs.push(l.main_image_url);
    if (Array.isArray(l.images_urls)) imgs.push(...l.images_urls.filter((x) => typeof x === 'string' && x.length));
    const loc = [l.governorate, l.city].filter(Boolean).join(' - ');
    const title = l.title ?? (l.make && l.model ? `${l.make} ${l.model}` : l.category_name);
    return {
      id: String(l.id),
      title: title || '',
      description: l.description || '',
      images: imgs,
      category: l.category_name || l.category || '',
      categorySlug: l.category || undefined,
      price: formatPriceCurrency(l.price, l.currency),
      location: loc || (l.address || ''),
      submittedAt: l.created_at ? new Date(l.created_at).toLocaleString('ar-EG') : '',
      status: normalizeStatus(l.status),
      submitterName: 'غير متوفر',
      submitterPhone: l.contact_phone ?? l.whatsapp_phone ?? '',
      source: l,
    };
  };

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetchAdminUnpaidListings();
        setMeta(resp.meta ?? { page: 1, per_page: resp.listings.length, total: resp.listings.length, last_page: 1 });
        const mapped = resp.listings.map(mapListingToAd);
        setAds(mapped);
      } catch (e) {
        const m = e as unknown as { message?: string };
        showToast('error', 'تعذر جلب الإعلانات', m?.message || '');
      }
    };
    load();
  }, [currentPage]);

  const totalPages = Math.max(1, meta?.last_page ?? 1);
  const handlePageChange = (p: number) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };
  const renderPaginationButtons = () => {
    const buttons: ReactNode[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) { startPage = Math.max(1, endPage - maxVisiblePages + 1); }
    if (currentPage > 1) { buttons.push(<button key="prev" onClick={() => handlePageChange(currentPage - 1)} className="pagination-btn pagination-nav">←</button>); }
    if (startPage > 1) {
      buttons.push(<button key={1} onClick={() => handlePageChange(1)} className="pagination-btn">1</button>);
      if (startPage > 2) buttons.push(<span key="dots1" className="pagination-dots">...</span>);
    }
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(<button key={i} onClick={() => handlePageChange(i)} className={`pagination-btn ${currentPage === i ? 'active' : ''}`}>{i}</button>);
    }
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) buttons.push(<span key="dots2" className="pagination-dots">...</span>);
      buttons.push(<button key={totalPages} onClick={() => handlePageChange(totalPages)} className="pagination-btn">{totalPages}</button>);
    }
    if (currentPage < totalPages) { buttons.push(<button key="next" onClick={() => handlePageChange(currentPage + 1)} className="pagination-btn pagination-nav">→</button>); }
    return <div className="pagination-bar">{buttons}</div>;
  };

  const [actionType, setActionType] = useState<'approve' | 'reject' | 'modify'>('reject');
  const [reasonTargetAdId, setReasonTargetAdId] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [imageModalAdId, setImageModalAdId] = useState<string | null>(null);
  const [imageModalIndex, setImageModalIndex] = useState(0);
  const [editTargetAdId, setEditTargetAdId] = useState<string | null>(null);
  const [editingImageTarget, setEditingImageTarget] = useState<'main' | number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toasts, setToasts] = useState<{ id: number; type: 'success' | 'error' | 'info'; title: string; message?: string }[]>([]);
  const dismissToast = (id: number) => { setToasts((prev) => prev.filter((t) => t.id !== id)); };
  const showToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => dismissToast(id), 4000);
  };

  const handleAction = async (adId: string, action: 'approve' | 'reject' | 'modify', reason?: string) => {
    const target = ads.find(a => a.id === adId);
    if (!target) return;
    if (action === 'approve') {
      try { await approveListing(Number(target.source?.id || target.id)); showToast('success', 'تمت الموافقة على الإعلان', target.title); } catch (e: any) { showToast('error', 'فشل الموافقة على الإعلان', String(e?.message || e)); return; }
    } else if (action === 'reject') {
      try { await rejectListing(Number(target.source?.id || target.id), String(reason || '')); showToast('error', 'تم رفض الإعلان', reason || target.title); } catch (e: any) { showToast('error', 'فشل رفض الإعلان', String(e?.message || e)); return; }
    } else {
      setAds(prev => prev.map(ad => ad.id === adId ? { ...ad, status: 'needs_modification' } : ad));
      if (selectedAd?.id === adId) { setSelectedAd(prev => prev ? { ...prev, status: 'needs_modification' } : null); }
      setShowReasonModal(false);
      setCustomReason('');
      setReasonTargetAdId(null);
      showToast('info', 'تم وضع الإعلان بحالة يحتاج تعديل', reason || target.title);
      return;
    }
    setAds(prev => prev.filter(ad => ad.id !== adId));
    if (selectedAd?.id === adId) { setSelectedAd(null); }
    setShowReasonModal(false);
    setCustomReason('');
    setReasonTargetAdId(null);
  };

  const openImageModal = (adId: string, imageIndex: number) => { setImageModalAdId(adId); setImageModalIndex(imageIndex); setShowImageModal(true); };
  const closeImageModal = () => { setShowImageModal(false); setImageModalAdId(null); setImageModalIndex(0); };
  const openReasonModal = (type: 'reject' | 'modify', adId: string) => { setActionType(type); setReasonTargetAdId(adId); setShowReasonModal(true); };
  const closeReasonModal = () => { setShowReasonModal(false); setCustomReason(''); setReasonTargetAdId(null); };
  const openPackagesForUserId = (userId?: number | string | null) => {
    const id = userId ? String(userId) : '';
    if (!id) { showToast('info', 'لا يوجد مستخدم مرتبط بالإعلان'); return; }
    try { localStorage.setItem('openPackagesForUserId', id); } catch {}
    try { window.open('/users', '_blank'); } catch {}
  };
  const contactAdvertiser = (ad: Ad) => {
    const ccRaw = String(ad.source?.country_code || '').trim();
    const waRaw = String(ad.source?.whatsapp_phone || '').trim();
    const phoneRaw = String(ad.source?.contact_phone || ad.submitterPhone || '').trim();
    const cc = ccRaw.replace(/[^+\d]/g, '').replace('+', '');
    if (waRaw) {
      const pn = waRaw.replace(/[^+\d]/g, '').replace('+', '');
      const full = (cc ? cc : '') + pn;
      const url = `https://wa.me/${full}`;
      try { window.open(url, '_blank'); } catch {}
      return;
    }
    if (phoneRaw) {
      const tel = phoneRaw.replace(/\s+/g, '');
      try { window.open(`tel:${tel}`, '_self'); } catch {}
      return;
    }
    showToast('info', 'لا توجد وسيلة تواصل متاحة لهذا الإعلان');
  };
  const openEditModal = (ad: Ad) => {
    setEditTargetAdId(ad.id);
    setEditForm({
      title: ad.source?.title ?? ad.title ?? '',
      description: ad.source?.description ?? ad.description ?? '',
      category: ad.source?.category_name ?? ad.category ?? '',
      price: String(ad.source?.price ?? ad.price ?? ''),
      currency: String(ad.source?.currency ?? ''),
      governorate: String(ad.source?.governorate ?? ''),
      city: String(ad.source?.city ?? ''),
      lat: String(ad.source?.lat ?? ''),
      lng: String(ad.source?.lng ?? ''),
      address: String(ad.source?.address ?? ''),
      status: normalizeStatus(ad.source?.status ?? ad.status).toString(),
      plan_type: String(ad.source?.plan_type ?? ''),
      country_code: String(ad.source?.country_code ?? ''),
      contact_phone: String(ad.source?.contact_phone ?? ''),
      whatsapp_phone: String(ad.source?.whatsapp_phone ?? ''),
      isPayment: Boolean(ad.source?.isPayment ?? false),
      admin_comment: String(ad.source?.admin_comment ?? ''),
      make_id: String(ad.source?.make_id ?? ''),
      make: String(ad.source?.make ?? ''),
      model_id: String(ad.source?.model_id ?? ''),
      model: String(ad.source?.model ?? ''),
      views: String(ad.source?.views ?? ''),
      rank: String(ad.source?.rank ?? ''),
      publish_via: String(ad.source?.publish_via ?? ''),
      main_image_url: String(ad.source?.main_image_url ?? ad.images[0] ?? ''),
      main_image_file: null,
      attributes: ad.source?.attributes ? { ...ad.source.attributes } : {},
      images: ad.images.length > 0 ? ad.images.slice(1) : []
    });
    setShowEditModal(true);
  };
  const closeEditModal = () => { setShowEditModal(false); setEditTargetAdId(null); };
  const openMobileModal = (ad: Ad) => { setSelectedAd(ad); setShowMobileModal(true); };
  const closeMobileModal = () => { setShowMobileModal(false); setSelectedAd(null); };
  const nextImage = () => { if (!imageModalAdId) return; const imgs = ads.find(a => a.id === imageModalAdId)?.images || []; if (imgs.length > 0) setImageModalIndex((prev) => (prev + 1) % imgs.length); };
  const prevImage = () => { if (!imageModalAdId) return; const imgs = ads.find(a => a.id === imageModalAdId)?.images || []; if (imgs.length > 0) setImageModalIndex((prev) => (prev - 1 + imgs.length) % imgs.length); };
  const deleteAdImage = (adId: string, index: number) => {
    setAds(prev => prev.map(a => a.id === adId ? { ...a, images: a.images.filter((_, i) => i !== index) } : a));
    if (selectedAd?.id === adId) { setSelectedAd(prev => prev ? { ...prev, images: prev.images.filter((_, i) => i !== index) } : null); }
    if (imageModalAdId === adId) {
      const imgs = ads.find(a => a.id === adId)?.images || [];
      const newLength = imgs.length - 1;
      if (newLength <= 0) { closeImageModal(); } else { setImageModalIndex((prev) => Math.min(prev, newLength - 1)); }
    }
  };

  const handleEditChange = (field: keyof typeof editForm, value: any) => { setEditForm(prev => ({ ...prev, [field]: value })); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const target = editingImageTarget; if (target === 'main') { setEditForm(prev => ({ ...prev, main_image_file: file })); } else if (typeof target === 'number') { setEditForm(prev => ({ ...prev, images: prev.images.map((img, i) => i === target ? file : img) })); } };
  const handleImageEditClick = (target: 'main' | number) => { setEditingImageTarget(target); fileInputRef.current?.click(); };
  const addImageToEditForm = () => { if (newImageFile) { setEditForm(prev => ({ ...prev, images: [...prev.images, newImageFile] })); setNewImageFile(null); } else if (newImageUrl.trim()) { setEditForm(prev => ({ ...prev, images: [...prev.images, newImageUrl.trim()] })); setNewImageUrl(''); } };
  const addAttributeToEditForm = () => { const k = newAttrKey.trim(); const v = newAttrValue.trim(); if (!k) return; setEditForm(prev => ({ ...prev, attributes: { ...(prev.attributes || {}), [k]: v } })); setNewAttrKey(''); setNewAttrValue(''); };
  const removeAttributeFromEditForm = (key: string) => { setEditForm(prev => { const next = { ...(prev.attributes || {}) }; delete next[key]; return { ...prev, attributes: next }; }); };
  const saveEditChanges = async () => {
    try {
      const targetAd = ads.find(a => a.id === editTargetAdId);
      if (!targetAd) return;
      const fd = new FormData();
      if (editForm.title) fd.append('title', editForm.title);
      if (editForm.description) fd.append('description', editForm.description);
      if (editForm.price) fd.append('price', editForm.price);
      if (editForm.currency) fd.append('currency', editForm.currency);
      if (editForm.governorate) fd.append('governorate', editForm.governorate);
      if (editForm.city) fd.append('city', editForm.city);
      if (editForm.lat) fd.append('lat', editForm.lat);
      if (editForm.lng) fd.append('lng', editForm.lng);
      if (editForm.address) fd.append('address', editForm.address);
      if (editForm.status) fd.append('status', formatStatusForApi(editForm.status));
      if (editForm.plan_type) fd.append('plan_type', editForm.plan_type);
      if (editForm.country_code) fd.append('country_code', editForm.country_code);
      if (editForm.contact_phone) fd.append('contact_phone', editForm.contact_phone);
      if (editForm.whatsapp_phone) fd.append('whatsapp_phone', editForm.whatsapp_phone);
      fd.append('isPayment', formatIsPaymentForApi(editForm.isPayment));
      if (editForm.admin_comment) fd.append('admin_comment', editForm.admin_comment);
      if (editForm.make_id) fd.append('make_id', editForm.make_id);
      if (editForm.make) fd.append('make', editForm.make);
      if (editForm.model_id) fd.append('model_id', editForm.model_id);
      if (editForm.model) fd.append('model', editForm.model);
      if (editForm.views) fd.append('views', editForm.views);
      if (editForm.rank) fd.append('rank', editForm.rank);
      if (editForm.publish_via) fd.append('publish_via', editForm.publish_via);
      if (editForm.main_image_file) { fd.append('main_image', editForm.main_image_file); } else if (editForm.main_image_url) { fd.append('main_image_url', editForm.main_image_url); }
      if (editForm.attributes && Object.keys(editForm.attributes).length) { for (const [k, v] of Object.entries(editForm.attributes)) { fd.append(`attributes[${k}]`, String(v ?? '')); } }
      if (targetAd?.source?.category_id) { fd.append('category_id', String(targetAd.source.category_id)); }
      if (targetAd?.source?.category) { fd.append('category', String(targetAd.source.category)); }
      for (const img of editForm.images) { if (typeof img === 'string') { if (img && img !== editForm.main_image_url) fd.append('images_urls[]', img); } else if (img instanceof File) { fd.append('images[]', img); } }
      const slug = String(targetAd?.source?.category || targetAd?.categorySlug || 'real_estate').trim();
      const id = Number(targetAd?.source?.id || editTargetAdId);
      await updateListingForm(slug, id, fd);
      showToast('info', 'تم حفظ تعديلات الإعلان', editForm.title);
    } catch (e: any) { showToast('error', 'فشل حفظ تعديلات الإعلان', String(e?.message || e)); }
    closeEditModal();
  };

  const getStatusColor = (status: string) => { switch (status) { case 'pending': return '#f59e0b'; case 'approved': return '#0f9c85'; case 'rejected': return '#ef4444'; case 'needs_modification': return '#8b5cf6'; default: return '#6b7280'; } };
  const getStatusText = (status: string) => { switch (status) { case 'pending': return 'قيد المراجعه'; case 'approved': return 'موافق عليه'; case 'rejected': return 'مرفوض'; case 'needs_modification': return 'يحتاج تعديل'; default: return 'غير محدد'; } };

  return (
    <div className="moderation-container">
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <div className="toast-icon">{t.type === 'success' ? '✓' : t.type === 'error' ? '✗' : '✎'}</div>
            <div className="toast-content">
              <div className="toast-title">{t.title}</div>
              {t.message && <div className="toast-message">{t.message}</div>}
            </div>
            <button className="toast-close" onClick={() => dismissToast(t.id)}>✕</button>
          </div>
        ))}
      </div>

      <div className="moderation-layout">
        <div className="queue-section">
          {(totalAdsCount > 0 && visibleAds.length > 0) && (
            <div className="queue-header">
              <h2>مراجعة الإعلانات غير المدفوعة</h2>
              <div className="filters-row">
                <ManagedSelect
                  options={categoryOptions.length ? categoryOptions : ALL_CATEGORIES_OPTIONS}
                  value={categoryFilter}
                  onChange={(v) => setCategoryFilter(v)}
                  placeholder={`كل الأقسام (${totalAdsCount})`}
                  getCount={getCategoryCount}
                  className="category-select-wide"
                />
              </div>
            </div>
          )}

          {(totalAdsCount === 0 || visibleAds.length === 0) ? (
            <div className="empty-state">
              <div className="empty-card">
                <div className="empty-icon">📭</div>
                <h3 className="empty-title">لا يوجد إعلانات</h3>
                <p className="empty-subtitle">لا توجد بيانات لعرضها الآن</p>
              </div>
            </div>
          ) : (
          <>
          <div className="ads-queue">
            {visibleAds.map((ad) => (
              <div 
                key={ad.id} 
                className={`ad-card ${selectedAd?.id === ad.id ? 'selected' : ''}`}
                onClick={() => { if (window.innerWidth <= 968) { openMobileModal(ad); } else { setSelectedAd(ad); } }}
              >
                <div className="ad-card-header">
                  <div className="ad-status">{getStatusText(ad.status)}</div>
                  <div className="ad-id">#{ad.id}</div>
                </div>

                <div className="ad-card-content">
                  <div className="ad-image-preview">
                    {ad.images.length > 0 && (
                      <Image 
                        src={ad.images[0]} 
                        alt={ad.title}
                        width={80}
                        height={60}
                        className="preview-image"
                        onClick={(e) => { e.stopPropagation(); openImageModal(ad.id, 0); }}
                      />
                    )}
                    {ad.images.length > 1 && (
                      <div className="image-count">+{ad.images.length - 1}</div>
                    )}
                  </div>

                  <div className="ad-info">
                    <h3 className="ad-title">{ad.source?.title || ad.title || ''}</h3>
                    <p className="ad-category">{ad.source?.category_name || ad.category}</p>
                    <p className="ad-price">{ad.source?.price ?? ''}</p>
                    <p className="ad-governorate">{ad.source?.governorate ?? ''}</p>
                    <p className="ad-city">{ad.source?.city ?? ''}</p>
                    <p className="ad-time">⏰ {formatDateArShort(ad.source?.created_at || ad.submittedAt)}</p>
                  </div>
                </div>

                <div className="ad-card-actions">
                  <button className="action-btn approve-btn" onClick={(e) => { e.stopPropagation(); handleAction(ad.id, 'approve'); }}>✓ موافقة</button>
                  <button className="action-btn reject-btn" onClick={(e) => { e.stopPropagation(); openReasonModal('reject', ad.id); }}>✗ رفض</button>
                  <button className="action-btn package-btn" onClick={(e) => { e.stopPropagation(); openPackagesForUserId(ad.source?.user?.id); }}> عمل باقة</button>
                  <button className="action-btn contact-btn" onClick={(e) => { e.stopPropagation(); contactAdvertiser(ad); }}> تواصل</button>
                </div>
              </div>
            ))}
          </div>
          {renderPaginationButtons()}
          </>
          )}
        </div>

        {(totalAdsCount > 0 && visibleAds.length > 0) && (
        <div className="details-pane">
          {selectedAd ? (
            <div className="ad-details">
              <div className="details-header">
                <h2>تفاصيل الإعلان</h2>
                <div className="ad-status-large">{getStatusText(selectedAd.status)}</div>
              </div>

              <div className="details-content">
                <div className="detail-section">
                  <h3>معلومات الإعلان</h3>
                  <div className="detail-grid">
                    <div className="detail-item"><label>المعرّف:</label><span>{selectedAd?.source?.id ?? '-'}</span></div>
                    <div className="detail-item"><label>معرّف التصنيف:</label><span>{selectedAd?.source?.category_id ?? '-'}</span></div>
                    <div className="detail-item"><label>المعرّف النصي:</label><span>{selectedAd?.source?.category || '-'}</span></div>
                    <div className="detail-item"><label>اسم التصنيف:</label><span>{selectedAd?.source?.category_name || '-'}</span></div>
                    <div className="detail-item"><label>السعر:</label><span>{selectedAd?.source?.price ?? '-'}</span></div>
                    <div className="detail-item"><label>العملة:</label><span>{selectedAd?.source?.currency ?? '-'}</span></div>
                    <div className="detail-item full-width"><label>الوصف:</label><span>{selectedAd?.source?.description || '-'}</span></div>
                    <div className="detail-item"><label>المحافظة:</label><span>{selectedAd?.source?.governorate || '-'}</span></div>
                    <div className="detail-item"><label>المدينة:</label><span>{selectedAd?.source?.city || '-'}</span></div>
                    <div className="detail-item"><label>خط العرض:</label><span>{selectedAd?.source?.lat || '-'}</span></div>
                    <div className="detail-item"><label>خط الطول:</label><span>{selectedAd?.source?.lng || '-'}</span></div>
                    <div className="detail-item"><label>العنوان:</label><span>{selectedAd?.source?.address || '-'}</span></div>
                    <div className="detail-item"><label>الحالة:</label><span>{getStatusText(normalizeStatus(selectedAd?.source?.status))}</span></div>
                    <div className="detail-item"><label>نوع الخطة:</label><span>{formatPlanType(selectedAd?.source?.plan_type)}</span></div>
                    <div className="detail-item"><label>عدد المشاهدات:</label><span>{selectedAd?.source?.views ?? 0}</span></div>
                    <div className="detail-item"><label>الترتيب:</label><span>{selectedAd?.source?.rank ?? 0}</span></div>
                    <div className="detail-item"><label>كود الدولة:</label><span>{formatCountryCode(selectedAd?.source?.country_code)}</span></div>
                    <div className="detail-item"><label>تاريخ الإنشاء:</label><span>{formatDateAr(selectedAd?.source?.created_at)}</span></div>
                    <div className="detail-item"><label>آخر تحديث:</label><span>{formatDateAr(selectedAd?.source?.updated_at)}</span></div>
                    <div className="detail-item"><label>ينتهي في:</label><span>{formatDateAr(selectedAd?.source?.expire_at)}</span></div>
                    <div className="detail-item"><label>مدفوع؟</label><span>{selectedAd?.source?.isPayment === true ? 'تم الدفع لهذا الاعلان' : selectedAd?.source?.isPayment === false ? 'لم يتم الدفع لهذا الاعلان' : '-'}</span></div>
                    <div className="detail-item full-width"><label>تعليق الإدمن:</label><span>{selectedAd?.source?.admin_comment || '-'}</span></div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>بيانات المعلن</h3>
                  <div className="detail-grid">
                    <div className="detail-item"><label>رقم المعلن:</label><span>{selectedAd?.source?.user?.id ?? '-'}</span></div>
                    <div className="detail-item"><label>الاسم:</label><span>{selectedAd?.source?.user?.name || 'غير متوفر'}</span></div>
                    <div className="detail-item"><label>رقم الهاتف:</label><span>{formatPhoneTrailingPlus(selectedAd?.source?.user?.phone, selectedAd?.source?.country_code)}</span></div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>معلومات التواصل</h3>
                  <div className="detail-grid">
                    <div className="detail-item"><label>الهاتف للتواصل:</label><span>{formatPhoneTrailingPlus(selectedAd?.source?.contact_phone, selectedAd?.source?.country_code)}</span></div>
                    <div className="detail-item"><label>واتساب:</label><span>{formatPhoneTrailingPlus(selectedAd?.source?.whatsapp_phone, selectedAd?.source?.country_code)}</span></div>
                    <div className="detail-item"><label>تاريخ الإنشاء:</label><span>{selectedAd.source?.created_at ? formatDateAr(selectedAd.source.created_at) : selectedAd.submittedAt}</span></div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>خصائص الإعلان</h3>
                  <div className="detail-grid">
                    {selectedAd.source?.attributes && Object.entries(selectedAd.source.attributes).map(([key, val]) => (
                      <div key={key} className="detail-item">
                        <label>{translateAttributeKey(key)}:</label>
                        <span>{String(val)}</span>
                      </div>
                    ))}
                    {selectedAd?.source?.make && (
                      <div className="detail-item"><label>الماركة:</label><span>{selectedAd?.source?.make}</span></div>
                    )}
                    {selectedAd?.source?.model && (
                      <div className="detail-item"><label>الموديل:</label><span>{selectedAd?.source?.model}</span></div>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h3>الصور ({selectedAd.images.length})</h3>
                  {(() => {
                    const imgs = selectedAd.images || [];
                    const main = selectedAd.source?.main_image_url || imgs[0] || '';
                    const mainIndex = Math.max(0, imgs.indexOf(main));
                    const secondary = imgs.filter((i) => i && i !== main);
                    return (
                      <div className="images-gallery">
                        <div className="image-container main">
                          {main && <div className="image-badge main">الغلاف</div>}
                          <Image 
                            src={main || '/nas-masr.png'} 
                            alt={'الغلاف'}
                            width={360}
                            height={270}
                            className="detail-image main"
                            onClick={() => openImageModal(selectedAd.id, mainIndex)}
                          />
                          <div className="image-actions">
                            <button className="image-action-btn zoom-btn" onClick={() => openImageModal(selectedAd.id, mainIndex)}>عرض</button>
                            <button className="image-action-btn delete-btn" onClick={() => deleteAdImage(selectedAd.id, mainIndex)}>حذف</button>
                          </div>
                        </div>
                        <div className="thumbs-grid">
                          {secondary.map((image) => {
                            const idx = imgs.indexOf(image);
                            return (
                              <div key={image} className="image-container thumb">
                                <div className="image-badge secondary">صورة فرعية</div>
                                <Image 
                                  src={image} 
                                  alt={'صورة فرعية'}
                                  width={140}
                                  height={105}
                                  className="detail-image"
                                  onClick={() => openImageModal(selectedAd.id, idx)}
                                />
                                <div className="image-actions">
                                  <button className="image-action-btn zoom-btn" onClick={() => openImageModal(selectedAd.id, idx)}>عرض</button>
                                  <button className="image-action-btn delete-btn" onClick={() => deleteAdImage(selectedAd.id, idx)}>حذف</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="detail-section">
                  <h3>الباقات والدفع</h3>
                  <div className="quick-tools">
                    <button className="tool-btn">💼 نوع الخطة: {formatPlanType(selectedAd.source?.plan_type)}</button>
                    <button className="tool-btn">💳 حالة الدفع: {selectedAd.source?.isPayment ? 'تم الدفع' : 'لم يتم الدفع لهذا الاعلان'}</button>
                    <button className="tool-btn">💼 طريقة النشر: {formatPublishVia(selectedAd.source?.publish_via)}</button>
                  </div>
                </div>

                <div className="detail-actions">
                  <button className="detail-action-btn approve-btn" onClick={() => handleAction(selectedAd.id, 'approve')}>موافقة  </button>
                  <button className="detail-action-btn reject-btn" onClick={() => openReasonModal('reject', selectedAd.id)}>رفض </button>
                  <button className="detail-action-btn package-btn" onClick={() => openPackagesForUserId(selectedAd.source?.user?.id)}> عمل باقة</button>
                  <button className="detail-action-btn contact-btn" onClick={() => contactAdvertiser(selectedAd)}> التواصل</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <div className="no-selection-icon">📋</div>
              <h3>اختر إعلاناً للمراجعة</h3>
              <p>انقر على أي إعلان من القائمة لعرض تفاصيله</p>
            </div>
          )}
        </div>
        )}
      </div>

      {showImageModal && imageModalAdId && (
        <div className="modal-overlay" onClick={closeImageModal}>
          <div className="image-modal gallery-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeImageModal}>✕</button>
            <div className="gallery-main">
              <button className="gallery-nav prev" onClick={prevImage}>‹</button>
              <Image 
                src={(ads.find(a => a.id === imageModalAdId)?.images[imageModalIndex]) || '/nas-masr.png'} 
                alt={`صورة ${imageModalIndex + 1}`}
                width={800}
                height={600}
                className="modal-image"
              />
              <button className="gallery-nav next" onClick={nextImage}>›</button>
            </div>
            <div className="gallery-thumbs">
              {(ads.find(a => a.id === imageModalAdId)?.images || []).map((img, idx) => (
                <button 
                  key={idx}
                  className={`thumb ${idx === imageModalIndex ? 'active' : ''}`}
                  onClick={() => setImageModalIndex(idx)}
                  aria-label={`صورة ${idx + 1}`}
                >
                  <Image src={img} alt={`صورة ${idx + 1}`} width={100} height={75}/>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showReasonModal && (
        <div className="modal-overlay" onClick={closeReasonModal}>
          <div className="reason-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{reasonType === 'reject' ? 'سبب الرفض' : 'سبب طلب التعديل'}</h3>
              <button className="modal-close" onClick={closeReasonModal}>✕</button>
            </div>
            <div className="modal-content">
              <div className="reason-templates">
                <h4>أسباب جاهزة:</h4>
                {rejectionReasons.map((reason, index) => (
                  <button key={index} className="reason-btn" onClick={() => setCustomReason(reason)}>{reason}</button>
                ))}
              </div>
              <div className="custom-reason">
                <label>سبب مخصص:</label>
                <textarea value={rejectionReason || customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="اكتب السبب هنا..." rows={4} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="confirm-btn" onClick={() => reasonTargetAdId && handleAction(reasonTargetAdId, reasonType, customReason)}>تأكيد</button>
              <button className="cancel-btn" onClick={closeReasonModal}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editTargetAdId && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>تعديل بيانات الإعلان</h3>
              <button className="modal-close" onClick={closeEditModal}>✕</button>
            </div>
            <div className="modal-content">
              <div className="edit-form">
                <div className="form-group">
                  <label>الوصف</label>
                  <textarea rows={4} value={editForm.description} onChange={(e) => handleEditChange('description', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>التصنيف</label>
                  <input type="text" value={editForm.category} onChange={(e) => handleEditChange('category', e.target.value)} />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>السعر</label>
                    <input type="text" value={editForm.price} onChange={(e) => handleEditChange('price', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>العملة</label>
                    <input type="text" value={editForm.currency} onChange={(e) => handleEditChange('currency', e.target.value)} />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group"><label>المحافظة</label><input type="text" value={editForm.governorate} onChange={(e) => handleEditChange('governorate', e.target.value)} /></div>
                  <div className="form-group"><label>المدينة</label><input type="text" value={editForm.city} onChange={(e) => handleEditChange('city', e.target.value)} /></div>
                </div>
                <div className="form-grid">
                  <div className="form-group"><label>العنوان</label><input type="text" value={editForm.address} onChange={(e) => handleEditChange('address', e.target.value)} /></div>
                  <div className="form-group"><label>كود الدولة</label><input type="text" value={editForm.country_code} onChange={(e) => handleEditChange('country_code', e.target.value)} /></div>
                </div>
                <div className="form-grid">
                  <div className="form-group"><label>خط العرض (LAT)</label><input type="text" value={editForm.lat} onChange={(e) => handleEditChange('lat', e.target.value)} /></div>
                  <div className="form-group"><label>خط الطول (LNG)</label><input type="text" value={editForm.lng} onChange={(e) => handleEditChange('lng', e.target.value)} /></div>
                </div>
                <div className="form-grid">
                  <div className="form-group"><label>الحالة</label><ManagedSelect options={statusOptions} value={editForm.status} onChange={(v) => handleEditChange('status', v)} placeholder="اختر الحالة" className="edit-select-wide" /></div>
                  <div className="form-group"><label>نوع الخطة</label><ManagedSelect options={planTypeOptions} value={editForm.plan_type} onChange={(v) => handleEditChange('plan_type', v)} placeholder="اختر نوع الخطة" className="edit-select-wide" /></div>
                </div>
                <div className="form-grid">
                  <div className="form-group"><label>طريقة النشر</label><input type="text" value={editForm.publish_via} onChange={(e) => handleEditChange('publish_via', e.target.value)} /></div>
                  <div className="form-group"><label>حالة الدفع</label><ManagedSelect options={paymentOptions} value={editForm.isPayment ? '1' : '0'} onChange={(v) => handleEditChange('isPayment', v === '1')} placeholder="اختر حالة الدفع" className="edit-select-wide" /></div>
                </div>
                <div className="form-grid">
                  <div className="form-group"><label>الهاتف للتواصل</label><input type="text" value={editForm.contact_phone} onChange={(e) => handleEditChange('contact_phone', e.target.value)} /></div>
                  <div className="form-group"><label>واتساب</label><input type="text" value={editForm.whatsapp_phone} onChange={(e) => handleEditChange('whatsapp_phone', e.target.value)} /></div>
                </div>
                <div className="form-grid">
                  <div className="form-group"><label>الماركة</label><input type="text" value={editForm.make} onChange={(e) => handleEditChange('make', e.target.value)} /></div>
                  <div className="form-group"><label>معرّف الماركة</label><input type="text" value={editForm.make_id} onChange={(e) => handleEditChange('make_id', e.target.value)} /></div>
                </div>
                <div className="form-grid">
                  <div className="form-group"><label>الموديل</label><input type="text" value={editForm.model} onChange={(e) => handleEditChange('model', e.target.value)} /></div>
                  <div className="form-group"><label>معرّف الموديل</label><input type="text" value={editForm.model_id} onChange={(e) => handleEditChange('model_id', e.target.value)} /></div>
                </div>
                <div className="form-grid">
                  <div className="form-group"><label>عدد المشاهدات</label><input type="number" value={editForm.views} onChange={(e) => handleEditChange('views', e.target.value)} /></div>
                  <div className="form-group"><label>الترتيب</label><input type="number" value={editForm.rank} onChange={(e) => handleEditChange('rank', e.target.value)} /></div>
                </div>
                <div className="form-group"><label>تعليق الإدمن</label><textarea rows={3} value={editForm.admin_comment} onChange={(e) => handleEditChange('admin_comment', e.target.value)} /></div>
                <div className="form-group">
                  <label>الغلاف</label>
                  <div className="edit-image-item main-cover-edit" style={{ marginBottom: '10px' }}>
                    <Image src={editForm.main_image_file ? URL.createObjectURL(editForm.main_image_file) : (editForm.main_image_url || '/nas-masr.png')} alt="الغلاف" width={120} height={90} className="cover-preview" style={{ objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                    <button className="image-action-btn edit-btn" style={{ marginRight: '10px' }} onClick={() => handleImageEditClick('main')}>تعديل</button>
                  </div>
                  <input type="text" placeholder="رابط الغلاف" value={editForm.main_image_url} onChange={(e) => handleEditChange('main_image_url', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>الصور</label>
                  <div className="edit-images">
                    {editForm.images.map((img, idx) => (
                      <div key={idx} className="edit-image-item">
                        <Image src={typeof img === 'string' ? img : URL.createObjectURL(img)} alt={`صورة ${idx+1}`} width={80} height={60} />
                        <button className="image-action-btn edit-btn" onClick={() => handleImageEditClick(idx)}>تعديل</button>
                      </div>
                    ))}
                  </div>
                  <div className="add-image-row">
                    <input type="text" placeholder="مسار الصورة (URL أو /public)" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} />
                    <input type="file" accept="image/*" onChange={(e) => setNewImageFile(e.target.files?.[0] || null)} />
                    <button className="tool-btn" onClick={addImageToEditForm}>إضافة صورة</button>
                  </div>
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
                </div>
                <div className="form-group">
                  <label>خصائص الإعلان</label>
                  <div className="attributes-editor">
                    {Object.entries(editForm.attributes || {}).map(([key, val]) => (
                      <div key={key} className="attribute-row">
                        <span className="attr-key">{translateAttributeKey(key)}</span>
                        <input type="text" value={val || ''} onChange={(e) => setEditForm(prev => ({ ...prev, attributes: { ...prev.attributes, [key]: e.target.value } }))} />
                        <button className="image-action-btn delete-btn" onClick={() => removeAttributeFromEditForm(key)}>حذف</button>
                      </div>
                    ))}
                    <div className="attribute-add-row">
                      <input type="text" placeholder="المفتاح" value={newAttrKey} onChange={(e) => setNewAttrKey(e.target.value)} />
                      <input type="text" placeholder="القيمة" value={newAttrValue} onChange={(e) => setNewAttrValue(e.target.value)} />
                      <button className="tool-btn" onClick={addAttributeToEditForm}>إضافة خاصية</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="confirm-btn" onClick={saveEditChanges}>حفظ التعديلات</button>
              <button className="cancel-btn" onClick={closeEditModal}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {showMobileModal && selectedAd && (
        <div className="modal-overlay" onClick={closeMobileModal}>
          <div className="mobile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>تفاصيل الإعلان</h3>
              <button className="modal-close" onClick={closeMobileModal}>✕</button>
            </div>
            <div className="modal-content">
              <div className="mobile-ad-status">{getStatusText(selectedAd.status)}</div>
              <div className="mobile-detail-section">
                <h4>معلومات الإعلان</h4>
                <div className="mobile-detail-grid">
                  <div className="mobile-detail-item"><label>العنوان:</label><span>{selectedAd.title}</span></div>
                  <div className="mobile-detail-item"><label>التصنيف:</label><span>{selectedAd.category}</span></div>
                  <div className="mobile-detail-item"><label>السعر:</label><span>{selectedAd.price}</span></div>
                  <div className="mobile-detail-item"><label>الموقع:</label><span>{selectedAd.location}</span></div>
                  <div className="mobile-detail-item full-width"><label>الوصف:</label><span>{selectedAd.description}</span></div>
                </div>
              </div>
              <div className="mobile-detail-section">
                <h4>معلومات المرسل</h4>
                <div className="mobile-detail-grid">
                  <div className="mobile-detail-item"><label>الاسم:</label><span>{selectedAd.submitterName}</span></div>
                  <div className="mobile-detail-item"><label>الهاتف:</label><span>{selectedAd.submitterPhone}</span></div>
                  <div className="mobile-detail-item"><label>تاريخ الإرسال:</label><span>{selectedAd.submittedAt}</span></div>
                </div>
              </div>
              <div className="mobile-detail-section">
                <h4>الصور ({selectedAd.images.length})</h4>
                <div className="mobile-images-grid">
                  {selectedAd.images.map((image, index) => (
                    <div key={index} className="mobile-image-container">
                      <Image src={image} alt={`صورة ${index + 1}`} width={100} height={75} className="mobile-detail-image" onClick={() => openImageModal(selectedAd.id, index)} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mobile-detail-actions">
                <button className="mobile-action-btn approve-btn" onClick={() => { handleAction(selectedAd.id, 'approve'); closeMobileModal(); }}>✓ موافقة</button>
                <button className="mobile-action-btn reject-btn" onClick={() => { openReasonModal('reject', selectedAd.id); closeMobileModal(); }}>✗ رفض</button>
                <button className="mobile-action-btn package-btn" onClick={() => { openPackagesForUserId(selectedAd.source?.user?.id); closeMobileModal(); }}>💼 باقة</button>
                <button className="mobile-action-btn contact-btn" onClick={() => { contactAdvertiser(selectedAd); closeMobileModal(); }}>📞 تواصل</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
