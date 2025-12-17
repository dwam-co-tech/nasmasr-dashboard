'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ManagedSelect from '@/components/ManagedSelect';
import DateInput from '@/components/DateInput';
import { ALL_CATEGORIES_OPTIONS, CATEGORY_LABELS_AR } from '@/constants/categories';
import { fetchCategoryFields, fieldsToMap, fetchGovernorates, fetchCarMakes, fetchCategoryMainSubs } from '@/services/makes';
import { createListingWithPayload } from '@/services/create-listing';
import type { CreateListingPayload } from '@/models/create-listing';
import { useRouter } from 'next/navigation';

type Toast = { id: string; message: string; type: 'success' | 'error' | 'info' | 'warning'; duration?: number };

type FieldValue = string;
type AttributesState = Record<string, FieldValue>;

const ATTRIBUTE_LABELS_AR: Record<string, string> = {
  category: 'رئيسي',
  sub: 'فرعي',
  driver: 'السائق',
  driver_option: 'السائق',
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
  const [category, setCategory] = useState<string>('real_estate');
  const [fieldsMap, setFieldsMap] = useState<Record<string, string[]>>({});
  const [attributes, setAttributes] = useState<AttributesState>({});
  const [mainSubsMap, setMainSubsMap] = useState<Record<string, string[]>>({});
  const [carModelsByMake, setCarModelsByMake] = useState<Record<string, string[]>>({});
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
  const [locationLink, setLocationLink] = useState('');
  const [locationLat, setLocationLat] = useState('');
  const [locationLng, setLocationLng] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [tempLat, setTempLat] = useState('');
  const [tempLng, setTempLng] = useState('');
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearchResults, setMapSearchResults] = useState<{ label: string; lat: number; lng: number }[]>([]);
  const [isSearchingMap, setIsSearchingMap] = useState(false);

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
            setCarModelsByMake(Object.fromEntries(carMakes.makes.map((m) => [m.name, m.models])));
          } catch {}
        }
        if (category === 'spare-parts') {
          try {
            const carMakes = await fetchCarMakes();
            const brandsOpts = carMakes.makes.map((m) => m.name);
            const modelsOpts = Array.from(new Set(carMakes.makes.flatMap((m) => m.models)));
            if (!map['brand'] && brandsOpts.length) map['brand'] = brandsOpts;
            if (!map['model'] && modelsOpts.length) map['model'] = modelsOpts;
            setCarModelsByMake(Object.fromEntries(carMakes.makes.map((m) => [m.name, m.models])));
          } catch {}
        }
        try {
          const m = await fetchCategoryMainSubs(category);
          setMainSubsMap(m);
          const mains = Object.keys(m);
          if (mains.length && !['real_estate', 'cars', 'cars_rent'].includes(category)) {
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
    setAttributes((prev) => {
      const next: AttributesState = { ...prev, [key]: value };
      if (key === 'make' && category === 'cars') next['model'] = '';
      if (key === 'brand' && category === 'spare-parts') next['model'] = '';
      return next;
    });
  };

  const getFieldLabel = (key: string): string => {
    if (category === 'jobs') {
      if (key === 'category') return 'التصنيف';
      if (key === 'sub') return 'التخصص';
    }
    return translateAttributeKey(key);
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
      locationLink,
      locationLat,
      locationLng,
      locationAddress,
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

  useEffect(() => {
    const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('failed'));
      document.head.appendChild(s);
    });
    const ensureLeaflet = async () => {
      if (!(window as any).L) {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(l);
        await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
      }
      return (window as any).L;
    };
    const initGoogle = async () => {
      if (!(window as any).google || !(window as any).google.maps) {
        const key = String((process as any).env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
        if (!key) throw new Error('no_key');
        await loadScript(`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`);
      }
      return (window as any).google;
    };
    const initMap = async () => {
      if (!isMapOpen || !mapContainerRef.current) return;
      setIsLoadingMap(true);
      const defLat = Number(String(locationLat || '').trim() || '26.8206');
      const defLng = Number(String(locationLng || '').trim() || '30.8025');
      try {
        const google = await initGoogle();
        const center = { lat: defLat, lng: defLng };
        const map = new google.maps.Map(mapContainerRef.current, { center, zoom: 6 });
        const marker = new google.maps.Marker({ position: center, map, draggable: true });
        map.addListener('click', (e: any) => {
          marker.setPosition(e.latLng);
          setTempLat(String(e.latLng.lat()));
          setTempLng(String(e.latLng.lng()));
        });
        marker.addListener('dragend', (e: any) => {
          setTempLat(String(e.latLng.lat()));
          setTempLng(String(e.latLng.lng()));
        });
        mapInstanceRef.current = map;
        markerInstanceRef.current = marker;
      } catch {
        const L = await ensureLeaflet();
        const center = [defLat, defLng];
        const map = L.map(mapContainerRef.current).setView(center, 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
        const marker = L.marker(center, { draggable: true }).addTo(map);
        map.on('click', (e: any) => {
          marker.setLatLng(e.latlng);
          setTempLat(String(e.latlng.lat));
          setTempLng(String(e.latlng.lng));
        });
        marker.on('dragend', () => {
          const ll = marker.getLatLng();
          setTempLat(String(ll.lat));
          setTempLng(String(ll.lng));
        });
        mapInstanceRef.current = map;
        markerInstanceRef.current = marker;
      } finally {
        setIsLoadingMap(false);
      }
    };
    initMap();
    return () => {
      mapInstanceRef.current = null;
      markerInstanceRef.current = null;
    };
  }, [isMapOpen, locationLat, locationLng]);

  useEffect(() => {
    const run = async () => {
      const q = String(mapSearchQuery || '').trim();
      if (!isMapOpen || q.length < 3) { setMapSearchResults([]); return; }
      setIsSearchingMap(true);
      try {
        const google = (window as any).google;
        if (google && google.maps) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ address: q, region: 'EG' }, (results: any, status: any) => {
            if (status === 'OK' && Array.isArray(results)) {
              const items = results.slice(0, 6).map((r: any) => ({
                label: String(r.formatted_address || ''),
                lat: Number(r.geometry.location.lat()),
                lng: Number(r.geometry.location.lng()),
              }));
              setMapSearchResults(items);
            } else {
              setMapSearchResults([]);
            }
            setIsSearchingMap(false);
          });
        } else {
          const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&accept-language=ar&limit=6&countrycodes=eg`);
          const data = await resp.json().catch(() => []);
          const items = Array.isArray(data) ? data.map((d: any) => ({
            label: String(d.display_name || ''),
            lat: Number(d.lat),
            lng: Number(d.lon),
          })) : [];
          setMapSearchResults(items.slice(0, 6));
          setIsSearchingMap(false);
        }
      } catch {
        setMapSearchResults([]);
        setIsSearchingMap(false);
      }
    };
    const t = setTimeout(run, 450);
    return () => { try { clearTimeout(t); } catch {} };
  }, [mapSearchQuery, isMapOpen]);

  const selectSearchResult = (lat: number, lng: number, label: string) => {
    setTempLat(String(lat));
    setTempLng(String(lng));
    setMapSearchResults([]);
    try {
      const google = (window as any).google;
      if (google && google.maps && mapInstanceRef.current) {
        const center = { lat, lng };
        mapInstanceRef.current.panTo(center);
        try {
          const currentZoom = typeof mapInstanceRef.current.getZoom === 'function' ? mapInstanceRef.current.getZoom() : 6;
          if (!currentZoom || currentZoom < 15) mapInstanceRef.current.setZoom(15);
        } catch {}
        if (markerInstanceRef.current) markerInstanceRef.current.setPosition(center);
      } else if (mapInstanceRef.current && markerInstanceRef.current) {
        markerInstanceRef.current.setLatLng([lat, lng]);
        try {
          const currentZoom = typeof mapInstanceRef.current.getZoom === 'function' ? mapInstanceRef.current.getZoom() : 6;
          mapInstanceRef.current.setView([lat, lng], currentZoom < 15 ? 15 : currentZoom);
        } catch {
          mapInstanceRef.current.setView([lat, lng], 15);
        }
      }
    } catch {}
  };

  const reverseGeocode = async (lat: string, lng: string) => {
    try {
      const google = (window as any).google;
      if (google && google.maps) {
        const geocoder = new google.maps.Geocoder();
        return new Promise<string>((resolve) => {
          geocoder.geocode({ location: { lat: Number(lat), lng: Number(lng) } }, (results: any, status: any) => {
            if (status === 'OK' && Array.isArray(results) && results[0]?.formatted_address) resolve(String(results[0].formatted_address));
            else resolve('');
          });
        });
      }
    } catch {}
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&accept-language=ar`);
      const data = await resp.json().catch(() => null);
      const addr = data && typeof data === 'object' ? (data.display_name || '') : '';
      return String(addr || '').trim();
    } catch {
      return '';
    }
  };

  const submit = async () => {
    if (!category) { showToast('اختر القسم أولاً', 'warning'); return; }
    try {
      const payload: CreateListingPayload = {
        category,
        description,
        price,
        currency,
        plan_type: planType,
        contact_phone: contactPhone,
        whatsapp_phone: whatsappPhone,
        country_code: countryCode,
        governorate,
        city,
        address: locationAddress || attributes['address'],
        lat: locationLat,
        lng: locationLng,
        map_link: locationLink,
        published_at: publishedAt,
        expire_at: expireAt,
        attributes,
        main_image_file: imageFiles[0],
        image_files: imageFiles.length > 1 ? imageFiles : undefined,
        main_image_url: imageFiles.length === 0 && images.length > 0 ? images[0] : undefined,
        images_urls: imageFiles.length === 0 && images.length > 1 ? images.slice(1) : undefined,
      };
      if (category === 'cars') {
        const year = Number(String(attributes['year'] || '').trim());
        const odometer = Number(String(attributes['kilometers'] || '').trim());
        Object.assign(payload, {
          make: attributes['make'] || undefined,
          model: attributes['model'] || undefined,
          year: Number.isFinite(year) ? year : undefined,
          transmission: attributes['transmission'] || undefined,
          fuel_type: attributes['fuel_type'] || undefined,
          odometer: Number.isFinite(odometer) ? odometer : undefined,
          condition: attributes['condition'] || undefined,
        });
      }
      if (category === 'real_estate') {
        const area = Number(String(attributes['area'] || '').trim());
        const rooms = Number(String(attributes['rooms'] || '').trim());
        const bathrooms = Number(String(attributes['bathrooms'] || '').trim());
        const floor_level = Number(String(attributes['floor'] || '').trim());
        Object.assign(payload, {
          area: Number.isFinite(area) ? area : undefined,
          rooms: Number.isFinite(rooms) ? rooms : undefined,
          bathrooms: Number.isFinite(bathrooms) ? bathrooms : undefined,
          floor_level: Number.isFinite(floor_level) ? floor_level : undefined,
          finishing_type: attributes['finishing_type'] || undefined,
        });
      }
      const resp = await createListingWithPayload(category, payload);
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
            searchable
            searchPlaceholder="ابحث في الأقسام"
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
        <div className="form-grid">
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
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="location-label">الموقع على الخريطة</label>
            <div className="location-selector">
              <button type="button" className="map-button" onClick={() => { setIsMapOpen(true); setTempLat(locationLat || ''); setTempLng(locationLng || ''); }}>فتح الخريطة</button>
              {/* <input className="form-input" value={locationLink} onChange={(e) => setLocationLink(e.target.value)} placeholder="ألصق رابط موقع جوجل هنا" style={{ maxWidth: 420 }} /> */}
              {/* <button
                type="button"
                className="map-button"
                onClick={async () => {
                  const url = String(locationLink || '').trim();
                  if (!url) { showToast('ألصق رابط من خرائط جوجل أولاً', 'warning'); return; }
                  const atMatch = url.match(/@(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/);
                  const qMatch = url.match(/[?&](?:q|ll)=(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/);
                  const found = atMatch || qMatch;
                  if (!found) { showToast('تعذر استخراج الإحداثيات من الرابط', 'error'); return; }
                  const lat = found[1];
                  const lng = found[2];
                  setLocationLat(lat);
                  setLocationLng(lng);
                  try {
                    const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&accept-language=ar`);
                    const data = await resp.json().catch(() => null);
                    const addr = data && typeof data === 'object' ? (data.display_name || '') : '';
                    const out = String(addr || '').trim();
                    if (out) {
                      setLocationAddress(out);
                      setAttributes((prev) => ({ ...prev, address: out }));
                      showToast('تم تحديد العنوان تلقائياً', 'success');
                    } else {
                      showToast('تم حفظ الإحداثيات بدون عنوان مفصل', 'info');
                    }
                  } catch {
                    showToast('تعذر جلب العنوان من الإحداثيات', 'error');
                  }
                }}
              >
                استخراج
              </button> */}
              <button type="button" className="btn-delete" onClick={() => { setLocationLink(''); setLocationLat(''); setLocationLng(''); setLocationAddress(''); }}>إعادة تعيين</button>
            </div>
            <div className="inline-actions" style={{ gap: 12, marginTop: 8 }}>
              <input className="form-input" value={locationAddress} onChange={(e) => setLocationAddress(e.target.value)} placeholder="العنوان الكامل (يمكن تعديله)" />
            </div>
            <div className="hidden-location-data">
              <input value={locationLat} readOnly />
              <input value={locationLng} readOnly />
              <input value={locationLink} readOnly />
            </div>
          </div>
        </div>
      </div>

      {isMapOpen && (
        <div className="modal-overlay">
          <div className="map-modal">
            <div className="map-search">
              <div className="search-container">
                <input
                  className="search-input"
                  value={mapSearchQuery}
                  onChange={(e) => { setMapSearchQuery(e.target.value); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const first = mapSearchResults[0];
                      if (first) {
                        selectSearchResult(first.lat, first.lng, first.label);
                      }
                    }
                  }}
                  placeholder="ابحث عن عنوان أو منطقة"
                />
                <span className="search-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
                </span>
                {(isSearchingMap || mapSearchResults.length > 0) && (
                  <div className="map-search-results">
                    {isSearchingMap && mapSearchResults.length === 0 ? (
                      <div className="map-search-item">
                        <span className="map-search-item-title">جاري البحث...</span>
                      </div>
                    ) : (
                      mapSearchResults.map((r, i) => (
                        <button key={i} className="map-search-item" onClick={() => selectSearchResult(r.lat, r.lng, r.label)}>
                          <span className="map-search-item-title">{r.label}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="map-canvas" ref={mapContainerRef} />
            <div className="inline-actions" style={{ gap: 12, marginTop: 8 }}>
              <input className="form-input" value={tempLat ? `${tempLat}, ${tempLng}` : `${locationLat || ''}, ${locationLng || ''}`} readOnly placeholder="الإحداثيات" />
            </div>
            <div className="map-actions">
              <button className="btn-delete" onClick={() => { setIsMapOpen(false); }}>إلغاء</button>
              <button
                className="map-button"
                disabled={isLoadingMap}
                onClick={async () => {
                  const lat = String(tempLat || locationLat || '').trim();
                  const lng = String(tempLng || locationLng || '').trim();
                  if (!lat || !lng) { showToast('اختر موقعاً على الخريطة أولاً', 'warning'); return; }
                  setLocationLat(lat);
                  setLocationLng(lng);
                  const addr = await reverseGeocode(lat, lng);
                  if (addr) {
                    setLocationAddress(addr);
                    setAttributes((prev) => ({ ...prev, address: addr }));
                  }
                  setLocationLink(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat)},${encodeURIComponent(lng)}`);
                  setIsMapOpen(false);
                  showToast('تم تحديد الموقع وكتابة العنوان', 'success');
                }}
              >
                تم
              </button>
            </div>
          </div>
        </div>
      )}

      {category && (
        <div className="category-fields">
          <h4>تفاصيل القسم: {categoryLabel}</h4>
          <div className="form-grid">
            {Object.keys(fieldsMap).length === 0 && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <p className="form-help">لا توجد حقول محددة لهذا القسم حالياً</p>
              </div>
            )}
            {Object.entries(fieldsMap).map(([key, options]) => (
              <div key={key} className="form-group">
                <label>{getFieldLabel(key)}</label>
                {(() => {
                  let mappedOptions = options;
                  if (key === 'sub' && Object.keys(mainSubsMap).length) {
                    mappedOptions = (attributes['category'] && mainSubsMap[attributes['category']]) ? mainSubsMap[attributes['category']] : [];
                  }
                  if (key === 'model') {
                    if (category === 'cars' && attributes['make']) {
                      mappedOptions = carModelsByMake[attributes['make']] ?? [];
                    } else if (category === 'spare-parts' && attributes['brand']) {
                      mappedOptions = carModelsByMake[attributes['brand']] ?? [];
                    }
                  }
                  return mappedOptions && mappedOptions.length > 0 ? (
                  <ManagedSelect
                    options={mappedOptions.map((o) => ({ value: o, label: o }))}
                    value={attributes[key] || ''}
                    onChange={(v) => handleAttrChange(key, v)}
                    placeholder={`اختر ${getFieldLabel(key)}`}
                    className="edit-select-wide"
                  />
                  ) : (
                  <input className="form-input" value={attributes[key] || ''} onChange={(e) => handleAttrChange(key, e.target.value)} placeholder={`أدخل ${getFieldLabel(key)}`} />
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
