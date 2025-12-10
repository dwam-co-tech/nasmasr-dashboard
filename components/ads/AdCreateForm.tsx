'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ManagedSelect from '@/components/ManagedSelect';
import DateInput from '@/components/DateInput';
import { ALL_CATEGORIES_OPTIONS, CATEGORY_LABELS_AR } from '@/constants/categories';
import { fetchCategoryFields, fieldsToMap, fetchGovernorates, fetchCarMakes, fetchCategoryMainSubs } from '@/services/makes';
import { createListingForm } from '@/services/listings';
import { useRouter } from 'next/navigation';

type Toast = { id: string; message: string; type: 'success' | 'error' | 'info' | 'warning'; duration?: number };

type FieldValue = string;
type AttributesState = Record<string, FieldValue>;

const ATTRIBUTE_LABELS_AR: Record<string, string> = {
  category: 'رئيسي',
  sub: 'فرعي',
  driver: 'السائق',
  specialization: 'التخصص',
  job_category: 'فئة الوظيفة',
  salary: 'الراتب',
  contact_via: 'طريقة الاتصال',
  required_qualification: 'المؤهل المطلوب',
  year: 'سنة الصنع',
  kilometers: 'عدد الكيلومترات',
  fuel_type: 'نوع الوقود',
  transmission: 'ناقل الحركة',
  exterior_color: 'اللون الخارجي',
  color: 'اللون',
  type: 'النوع',
  property_type: 'نوع العقار',
  contract_type: 'نوع التعاقد',
  area: 'المساحة',
  rooms: 'عدد الغرف',
  bathrooms: 'عدد الحمامات',
  floor: 'الدور',
  furnished: 'مفروش',
  make: 'الماركة',
  model: 'الموديل',
  make_id: 'رقم الماركة',
  model_id: 'رقم الموديل',
  engine: 'المحرك',
  engine_capacity: 'سعة المحرك',
  body_type: 'نوع الهيكل',
  drive_type: 'نظام الدفع',
  seller_type: 'نوع البائع',
  warranty: 'الضمان',
  size: 'المقاس',
  brand: 'الماركة',
  material: 'الخامة',
  length: 'الطول',
  width: 'العرض',
  height: 'الارتفاع',
  condition: 'الحالة',
  address: 'العنوان',
};

const translateAttributeKey = (key: string): string => {
  const k = String(key || '').trim();
  const direct = ATTRIBUTE_LABELS_AR[k];
  if (direct) return direct;
  const simple = k.replace(/_/g, ' ');
  return simple;
};

export default function AdCreateForm() {
  const router = useRouter();
  const [category, setCategory] = useState<string>('');
  const [fieldsMap, setFieldsMap] = useState<Record<string, string[]>>({});
  const [attributes, setAttributes] = useState<AttributesState>({});
  const [mainSubsMap, setMainSubsMap] = useState<Record<string, string[]>>({});
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('EGP');
  const [planType, setPlanType] = useState('standard');
  const [contactPhone, setContactPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [countryCode, setCountryCode] = useState('20');
  const [publishedAt, setPublishedAt] = useState('');
  const [expireAt, setExpireAt] = useState('');
  const [governorates, setGovernorates] = useState<{ name: string; id?: number; cities: string[] }[]>([]);
  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: Toast['type'] = 'info', duration: number = 4000) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    if (duration > 0) setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  };

  const categoryLabel = useMemo(() => {
    if (!category) return '';
    const entry = Object.entries(CATEGORY_LABELS_AR).find(([slug]) => slug === category);
    return entry ? entry[1] : category;
  }, [category]);

  useEffect(() => {
    const loadGovs = async () => {
      try {
        const govs = await fetchGovernorates();
        setGovernorates(govs);
      } catch {}
    };
    loadGovs();
  }, []);

  useEffect(() => {
    const loadFields = async () => {
      if (!category) { setFieldsMap({}); setAttributes({}); return; }
      try {
        const fields = await fetchCategoryFields(category);
        const map = fieldsToMap(fields);
        if (category === 'cars') {
          try {
            const carMakes = await fetchCarMakes();
            const makesOpts = carMakes.makes.map((m) => m.name);
            const modelsOpts = Array.from(new Set(carMakes.makes.flatMap((m) => m.models)));
            if (!map['make'] && makesOpts.length) map['make'] = makesOpts;
            if (!map['model'] && modelsOpts.length) map['model'] = modelsOpts;
          } catch {}
        }
        if (category === 'spare-parts') {
          try {
            const carMakes = await fetchCarMakes();
            const brandsOpts = carMakes.makes.map((m) => m.name);
            const modelsOpts = Array.from(new Set(carMakes.makes.flatMap((m) => m.models)));
            if (!map['brand'] && brandsOpts.length) map['brand'] = brandsOpts;
            if (!map['model'] && modelsOpts.length) map['model'] = modelsOpts;
          } catch {}
        }
        try {
          const m = await fetchCategoryMainSubs(category);
          setMainSubsMap(m);
          const mains = Object.keys(m);
          if (mains.length) {
            map['category'] = mains;
            const selectedMain = '';
            map['sub'] = selectedMain && m[selectedMain] ? m[selectedMain] : [];
          }
        } catch {}
        setFieldsMap(map);
        setAttributes({});
      } catch (e) {
        showToast((e as Error).message || 'تعذر جلب حقول القسم', 'error');
        setFieldsMap({});
        setAttributes({});
      }
    };
    loadFields();
  }, [category]);

  

  const handleAttrChange = (key: string, value: string) => {
    setAttributes((prev) => ({ ...prev, [key]: value }));
  };

  const selectedGov = governorates.find((g) => g.name === governorate);
  const citiesForGov = selectedGov?.cities ?? [];

  const handleAddImage = () => {
    const url = (newImageUrl || '').trim();
    if (!url) { showToast('أدخل رابط الصورة', 'warning'); return; }
    setImages((prev) => [...prev, url]);
    setNewImageUrl('');
    showToast('تم إضافة الصورة', 'success');
  };
  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleAddImageFiles: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setImageFiles((prev) => [...prev, ...files]);
    e.currentTarget.value = '';
  };
  const handleRemoveImageFile = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // countryCode يتم تعديله عبر الحقل المخصص أدناه

  const saveDraft = () => {
    const draft = {
      category,
      description,
      price,
      currency,
      planType,
      contactPhone,
      whatsappPhone,
      countryCode,
      governorate,
      city,
      publishedAt,
      expireAt,
      attributes,
      images,
    };
    try {
      localStorage.setItem('admin:createAdDraft', JSON.stringify(draft));
      showToast('تم حفظ المسودة محلياً', 'success');
    } catch {
      showToast('تعذر حفظ المسودة', 'error');
    }
  };

  const filePreviews = useMemo(() => imageFiles.map((f) => URL.createObjectURL(f)), [imageFiles]);
  useEffect(() => {
    return () => {
      filePreviews.forEach((u) => {
        try { URL.revokeObjectURL(u); } catch {}
      });
    };
  }, [filePreviews]);

  const submit = async () => {
    if (!category) { showToast('اختر القسم أولاً', 'warning'); return; }
    try {
      const fd = new FormData();
      if (description) fd.append('description', description);
      if (price) fd.append('price', price);
      if (currency) fd.append('currency', currency);
      if (planType) fd.append('plan_type', planType);
      if (contactPhone) fd.append('contact_phone', contactPhone);
      if (whatsappPhone) fd.append('whatsapp_phone', whatsappPhone);
      if (countryCode) fd.append('country_code', countryCode);
      if (governorate) fd.append('governorate', governorate);
      if (city) fd.append('city', city);
      if (publishedAt) fd.append('published_at', publishedAt);
      if (expireAt) fd.append('expire_at', expireAt);
      fd.append('category', category);
      if (attributes && Object.keys(attributes).length) {
        for (const [k, v] of Object.entries(attributes)) {
          const val = String(v ?? '').trim();
          if (!val) continue;
          fd.append(`attributes[${k}]`, val);
        }
      }
      if (attributes['make']) fd.append('make', attributes['make']);
      if (attributes['model']) fd.append('model', attributes['model']);
      if (imageFiles.length > 0) {
        fd.append('main_image', imageFiles[0]);
        for (const img of imageFiles.slice(1)) fd.append('images[]', img);
      } else if (images.length > 0) {
        fd.append('main_image_url', images[0]);
        for (const img of images.slice(1)) fd.append('images_urls[]', img);
      }
      const resp = await createListingForm(category, fd);
      showToast('تم إنشاء الإعلان بنجاح', 'success');
      try {
        const obj = resp as Record<string, unknown>;
        const id = obj && typeof obj['id'] !== 'undefined' ? String(obj['id']) : '';
        if (id) router.push(`/ads/${id}`);
        else router.push('/ads');
      } catch {
        router.push('/ads');
      }
    } catch (e) {
      const m = e as unknown as { message?: string };
      showToast(m?.message || 'تعذر إنشاء الإعلان', 'error');
    }
  };

  return (
    <div>
      <div className="filter-bar" style={{ gap: 12 }}>
        <div className="filter-item">
          <label className="filter-label">📂 اختر القسم</label>
          <ManagedSelect
            options={ALL_CATEGORIES_OPTIONS}
            value={category}
            onChange={setCategory}
            placeholder="اختر القسم"
            className="category-select-wide"
          />
        </div>

        <div className="filter-item">
          <label className="filter-label">🎯 نوع الظهور</label>
          <ManagedSelect
            options={[
              { value: 'free', label: 'مجاني' },
              { value: 'standard', label: 'ستاندر' },
              { value: 'featured', label: 'مميز' },
            ]}
            value={planType}
            onChange={setPlanType}
            placeholder="اختر نوع الظهور"
            className="filter-select-wide"
          />
        </div>

        {/* <div className="filter-item">
          <label className="filter-label">📅 تاريخ النشر</label>
          <DateInput value={publishedAt} onChange={setPublishedAt} className="form-input" />
        </div> */}

        {/* <div className="filter-item">
          <label className="filter-label">⏰ تاريخ الانتهاء</label>
          <DateInput value={expireAt} onChange={setExpireAt} className="form-input" />
        </div> */}
      </div>

      <div className="settings-section" style={{ marginTop: 16 }}>
        <h3 className="section-title">تفاصيل عامة</h3>
        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
          <div className="form-group">
            <label>السعر</label>
            <input className="form-input" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
          </div>
          <div className="form-group">
            <label>العملة</label>
            <ManagedSelect
              options={[{ value: 'EGP', label: 'جنيه' }, { value: 'USD', label: 'دولار' }]}
              value={currency}
              onChange={setCurrency}
              placeholder="العملة"
            />
          </div>
          <div className="form-group">
            <label>وصف الإعلان</label>
            <textarea className="form-textarea" rows={1} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف مختصر..." />
          </div>
          <div className="form-group">
            <label>رقم التواصل</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="1XX XXX XXXX" style={{ paddingLeft: 72 }} />
              <span onClick={() => document.querySelector<HTMLInputElement>('input[placeholder="مثال: 20"]')?.focus()} title="تعديل كود الدولة" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontWeight: 600, opacity: 0.7, cursor: 'pointer' }}>{countryCode}+</span>
            </div>
          </div>
          <div className="form-group">
            <label>واتساب</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" value={whatsappPhone} onChange={(e) => setWhatsappPhone(e.target.value)} placeholder="1XX XXX XXXX" style={{ paddingLeft: 72 }} />
              <span title="كود الدولة" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontWeight: 600, opacity: 0.7 }}>{countryCode}+</span>
            </div>
          </div>
          <div className="form-group">
            <label>كود الدولة</label>
            <input className="form-input" value={countryCode} onChange={(e) => setCountryCode(e.target.value.replace(/\D+/g, ''))} placeholder="مثال: 20" />
          </div>
          <div className="form-group">
            <label className="location-label">المحافظة</label>
            <ManagedSelect
              options={governorates.map((g) => ({ value: g.name, label: g.name }))}
              value={governorate}
              onChange={(v) => { setGovernorate(v); setCity(''); }}
              placeholder="اختر المحافظة"
            />
          </div>
          <div className="form-group">
            <label className="location-label">المدينة</label>
            <ManagedSelect
              options={citiesForGov.map((c) => ({ value: c, label: c }))}
              value={city}
              onChange={setCity}
              placeholder="اختر المدينة"
            />
          </div>
        </div>
      </div>

      {category && (
        <div className="category-fields">
          <h4>تفاصيل القسم: {categoryLabel}</h4>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {Object.keys(fieldsMap).length === 0 && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <p className="form-help">لا توجد حقول محددة لهذا القسم حالياً</p>
              </div>
            )}
            {Object.entries(fieldsMap).map(([key, options]) => (
              <div key={key} className="form-group">
                <label>{translateAttributeKey(key)}</label>
                {(() => {
                  const mappedOptions = key === 'sub' && Object.keys(mainSubsMap).length
                    ? ((attributes['category'] && mainSubsMap[attributes['category']]) ? mainSubsMap[attributes['category']] : [])
                    : options;
                  return mappedOptions && mappedOptions.length > 0 ? (
                  <ManagedSelect
                    options={mappedOptions.map((o) => ({ value: o, label: o }))}
                    value={attributes[key] || ''}
                    onChange={(v) => handleAttrChange(key, v)}
                    placeholder={`اختر ${translateAttributeKey(key)}`}
                    className="edit-select-wide"
                  />
                  ) : (
                  <input className="form-input" value={attributes[key] || ''} onChange={(e) => handleAttrChange(key, e.target.value)} placeholder={`أدخل ${translateAttributeKey(key)}`} />
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="settings-section" style={{ marginTop: 16 }}>
        <h3 className="section-title">الصور</h3>
        <div className="inline-actions">
          {/* <button className="btn-add" onClick={handleAddImage}>إضافة صورة</button> */}
          <button className="btn-add" onClick={() => fileInputRef.current?.click()}>رفع صور من الجهاز</button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleAddImageFiles} style={{ display: 'none' }} />
        </div>
        <div className="inline-actions" style={{ gap: 8, marginTop: 8 }}>
          <input className="form-input" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="رابط الصورة http(s)://" style={{ maxWidth: 320 }} />
          <button className="btn-add" onClick={handleAddImage}>إضافة</button>
        </div>
        <div className="images-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
          {images.map((img, idx) => (
            <div key={`img-${idx}`} className="image-card" style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#fff' }}>
              <div className="image-preview" style={{ height: 120, borderRadius: 8, background: '#f8fafc', marginBottom: 8, overflow: 'hidden' }}>
                <img src={img} alt={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <p className="image-title" style={{ fontWeight: 700 }}>{img}</p>
              <div className="inline-actions">
                <button className="btn-delete" onClick={() => handleRemoveImage(idx)}>حذف</button>
              </div>
            </div>
          ))}
          {filePreviews.map((url, idx) => (
            <div key={`file-${idx}`} className="image-card" style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#fff' }}>
              <div className="image-preview" style={{ height: 120, borderRadius: 8, background: '#f8fafc', marginBottom: 8, overflow: 'hidden' }}>
                <img src={url} alt={imageFiles[idx]?.name || `image-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <p className="image-title" style={{ fontWeight: 700 }}>{imageFiles[idx]?.name || `image-${idx}`}</p>
              <div className="inline-actions">
                <button className="btn-delete" onClick={() => handleRemoveImageFile(idx)}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="inline-actions" style={{ marginTop: 16 }}>
        <button className="btn-add" onClick={saveDraft}>حفظ مسودة</button>
        <button className="btn-add" onClick={submit}>إنشاء الإعلان</button>
      </div>

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-header">
              <span className="toast-message">{toast.message}</span>
              <button onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.5 }}>×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
