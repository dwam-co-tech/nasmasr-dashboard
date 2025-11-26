'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface Ad {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  price: string;
  location: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_modification';
  submitterName: string;
  submitterPhone: string;
}

const mockAds: Ad[] = [
  {
    id: '1',
    title: 'سيارة تويوتا كامري 2020',
    description: 'سيارة في حالة ممتازة، استعمال شخصي، صيانة دورية منتظمة',
    images: ['/car.webp', '/car2.webp', '/car3.png'],
    category: 'سيارات',
    price: '250,000 جنيه',
    location: 'القاهرة',
    submittedAt: '2024-01-15 10:30',
    status: 'pending',
    submitterName: 'أحمد محمد',
    submitterPhone: '01234567890'
  },
  {
    id: '2',
    title: 'شقة للبيع 120 متر',
    description: 'شقة 3 غرف وصالة، الدور الثالث، تشطيب سوبر لوكس',
    images: ['/flat.jpg'],
    category: 'عقارات',
    price: '1,200,000 جنيه',
    location: 'الجيزة',
    submittedAt: '2024-01-15 11:45',
    status: 'pending',
    submitterName: 'فاطمة أحمد',
    submitterPhone: '01098765432'
  },
  {
    id: '3',
    title: 'لابتوب ديل XPS 13',
    description: 'لابتوب مستعمل بحالة جيدة، معالج Intel i7، ذاكرة 16GB',
    images: ['/laptop.jpg'],
    category: 'إلكترونيات',
    price: '25,000 جنيه',
    location: 'الإسكندرية',
    submittedAt: '2024-01-15 14:20',
    status: 'pending',
    submitterName: 'محمد علي',
    submitterPhone: '01156789012'
  },
  {
    id: '4',
    title: 'هاتف آيفون 14 برو',
    description: 'هاتف جديد لم يستعمل، بالضمان والكرتونة الأصلية',
    images: ['/laptop.jpg'],
    category: 'إلكترونيات',
    price: '45,000 جنيه',
    location: 'القاهرة',
    submittedAt: '2024-01-16 09:15',
    status: 'approved',
    submitterName: 'سارة أحمد',
    submitterPhone: '01123456789'
  },
  {
    id: '5',
    title: 'فيلا للإيجار 300 متر',
    description: 'فيلا مفروشة بالكامل، حديقة وجراج، منطقة راقية',
    images: ['/flat.jpg'],
    category: 'عقارات',
    price: '15,000 جنيه شهرياً',
    location: 'الشيخ زايد',
    submittedAt: '2024-01-16 10:30',
    status: 'pending',
    submitterName: 'خالد محمود',
    submitterPhone: '01234567891'
  },
  {
    id: '6',
    title: 'دراجة نارية هوندا 150',
    description: 'دراجة نارية بحالة ممتازة، موديل 2022، قليلة الاستعمال',
    images: ['/car.webp'],
    category: 'مركبات',
    price: '35,000 جنيه',
    location: 'المنصورة',
    submittedAt: '2024-01-16 11:45',
    status: 'rejected',
    submitterName: 'عمر حسن',
    submitterPhone: '01098765433'
  },
  {
    id: '7',
    title: 'طقم صالون كلاسيكي',
    description: 'طقم صالون خشب زان، 7 قطع، حالة ممتازة',
    images: ['/flat.jpg'],
    category: 'أثاث',
    price: '18,000 جنيه',
    location: 'طنطا',
    submittedAt: '2024-01-16 12:20',
    status: 'pending',
    submitterName: 'نادية علي',
    submitterPhone: '01156789013'
  },
  {
    id: '8',
    title: 'كاميرا كانون EOS R5',
    description: 'كاميرا احترافية للتصوير، مع عدسات إضافية وحقيبة',
    images: ['/laptop.jpg'],
    category: 'إلكترونيات',
    price: '85,000 جنيه',
    location: 'الإسكندرية',
    submittedAt: '2024-01-16 13:10',
    status: 'approved',
    submitterName: 'أحمد فتحي',
    submitterPhone: '01234567892'
  },
  {
    id: '9',
    title: 'سيارة نيسان صني 2018',
    description: 'سيارة اقتصادية، استهلاك وقود قليل، صيانة حديثة',
    images: ['/car2.webp', '/car3.png'],
    category: 'سيارات',
    price: '180,000 جنيه',
    location: 'أسوان',
    submittedAt: '2024-01-16 14:30',
    status: 'needs_modification',
    submitterName: 'محمد سعد',
    submitterPhone: '01098765434'
  },
  {
    id: '10',
    title: 'محل تجاري للبيع',
    description: 'محل في شارع تجاري مميز، مساحة 50 متر، واجهة زجاجية',
    images: ['/flat.jpg'],
    category: 'عقارات',
    price: '800,000 جنيه',
    location: 'المحلة الكبرى',
    submittedAt: '2024-01-16 15:45',
    status: 'pending',
    submitterName: 'فاطمة حسن',
    submitterPhone: '01156789014'
  },
  {
    id: '11',
    title: 'جهاز PlayStation 5',
    description: 'جهاز ألعاب جديد، مع يدين تحكم وألعاب إضافية',
    images: ['/laptop.jpg'],
    category: 'إلكترونيات',
    price: '22,000 جنيه',
    location: 'القاهرة',
    submittedAt: '2024-01-17 08:20',
    status: 'approved',
    submitterName: 'يوسف أحمد',
    submitterPhone: '01234567893'
  },
  {
    id: '12',
    title: 'غرفة نوم كاملة',
    description: 'غرفة نوم خشب MDF، دولاب 6 أبواب، سرير ودرج',
    images: ['/flat.jpg'],
    category: 'أثاث',
    price: '25,000 جنيه',
    location: 'الجيزة',
    submittedAt: '2024-01-17 09:30',
    status: 'pending',
    submitterName: 'مريم محمد',
    submitterPhone: '01098765435'
  },
  {
    id: '13',
    title: 'دراجة هوائية رياضية',
    description: 'دراجة هوائية للرياضة والتنزه، 21 سرعة، إطارات جديدة',
    images: ['/car.webp'],
    category: 'رياضة',
    price: '3,500 جنيه',
    location: 'الإسكندرية',
    submittedAt: '2024-01-17 10:15',
    status: 'rejected',
    submitterName: 'علي حسام',
    submitterPhone: '01156789015'
  },
  {
    id: '14',
    title: 'تكييف شارب 2.25 حصان',
    description: 'تكييف بارد ساخن، حالة ممتازة، تم تنظيفه وصيانته',
    images: ['/laptop.jpg'],
    category: 'أجهزة منزلية',
    price: '8,500 جنيه',
    location: 'أسيوط',
    submittedAt: '2024-01-17 11:40',
    status: 'pending',
    submitterName: 'أحمد رضا',
    submitterPhone: '01234567894'
  },
  {
    id: '15',
    title: 'أرض زراعية 5 فدان',
    description: 'أرض زراعية خصبة، بها بئر مياه، طريق مرصوف',
    images: ['/flat.jpg'],
    category: 'عقارات',
    price: '2,500,000 جنيه',
    location: 'الفيوم',
    submittedAt: '2024-01-17 12:25',
    status: 'approved',
    submitterName: 'حسن عبدالله',
    submitterPhone: '01098765436'
  },
  {
    id: '16',
    title: 'ساعة رولكس أصلية',
    description: 'ساعة رولكس ذهبية، أصلية مع الضمان والأوراق',
    images: ['/star.png'],
    category: 'إكسسوارات',
    price: '150,000 جنيه',
    location: 'القاهرة',
    submittedAt: '2024-01-17 13:50',
    status: 'needs_modification',
    submitterName: 'سامي فؤاد',
    submitterPhone: '01156789016'
  },
  {
    id: '17',
    title: 'مكتب خشبي للدراسة',
    description: 'مكتب خشب طبيعي مع أدراج، مناسب للدراسة والعمل',
    images: ['/flat.jpg'],
    category: 'أثاث',
    price: '4,200 جنيه',
    location: 'بنها',
    submittedAt: '2024-01-17 14:35',
    status: 'pending',
    submitterName: 'نورا سعيد',
    submitterPhone: '01234567895'
  },
  {
    id: '18',
    title: 'سيارة كيا سيراتو 2019',
    description: 'سيارة عائلية مريحة، فحص كامل، بدون حوادث',
    images: ['/car.webp', '/car2.webp'],
    category: 'سيارات',
    price: '320,000 جنيه',
    location: 'الزقازيق',
    submittedAt: '2024-01-17 15:20',
    status: 'approved',
    submitterName: 'محمود أحمد',
    submitterPhone: '01098765437'
  },
  {
    id: '19',
    title: 'جهاز تكييف LG انفرتر',
    description: 'تكييف موفر للطاقة، 1.5 حصان، ضمان سنتين',
    images: ['/laptop.jpg'],
    category: 'أجهزة منزلية',
    price: '12,000 جنيه',
    location: 'دمياط',
    submittedAt: '2024-01-18 08:45',
    status: 'rejected',
    submitterName: 'إيمان محمد',
    submitterPhone: '01156789017'
  },
  {
    id: '20',
    title: 'شقة للإيجار 90 متر',
    description: 'شقة مفروشة جزئياً، غرفتين وصالة، الدور الثاني',
    images: ['/flat.jpg'],
    category: 'عقارات',
    price: '4,500 جنيه شهرياً',
    location: 'كفر الشيخ',
    submittedAt: '2024-01-18 09:30',
    status: 'pending',
    submitterName: 'أحمد سالم',
    submitterPhone: '01234567896'
  },
  {
    id: '21',
    title: 'تابلت سامسونج جالاكسي',
    description: 'تابلت للدراسة والعمل، شاشة 10 بوصة، ذاكرة 128GB',
    images: ['/laptop.jpg'],
    category: 'إلكترونيات',
    price: '15,000 جنيه',
    location: 'سوهاج',
    submittedAt: '2024-01-18 10:15',
    status: 'approved',
    submitterName: 'ليلى حسن',
    submitterPhone: '01098765438'
  },
  {
    id: '22',
    title: 'طقم أواني طبخ استانلس',
    description: 'طقم أواني طبخ 12 قطعة، استانلس ستيل، جودة عالية',
    images: ['/star.png'],
    category: 'أدوات منزلية',
    price: '2,800 جنيه',
    location: 'قنا',
    submittedAt: '2024-01-18 11:00',
    status: 'needs_modification',
    submitterName: 'رانيا عبدالعزيز',
    submitterPhone: '01156789018'
  },
  {
    id: '23',
    title: 'دراجة نارية ياماها 250',
    description: 'دراجة نارية قوية، موديل 2021، للرحلات الطويلة',
    images: ['/car.webp'],
    category: 'مركبات',
    price: '55,000 جنيه',
    location: 'الأقصر',
    submittedAt: '2024-01-18 12:30',
    status: 'pending',
    submitterName: 'كريم محمود',
    submitterPhone: '01234567897'
  },
  {
    id: '24',
    title: 'ثلاجة سامسونج 16 قدم',
    description: 'ثلاجة نوفروست، موفرة للطاقة، حالة ممتازة',
    images: ['/laptop.jpg'],
    category: 'أجهزة منزلية',
    price: '18,500 جنيه',
    location: 'المنيا',
    submittedAt: '2024-01-18 13:45',
    status: 'rejected',
    submitterName: 'هدى أحمد',
    submitterPhone: '01098765439'
  },
  {
    id: '25',
    title: 'كرسي مكتب جلد طبيعي',
    description: 'كرسي مكتب مريح، جلد طبيعي، قابل للتعديل',
    images: ['/flat.jpg'],
    category: 'أثاث',
    price: '3,200 جنيه',
    location: 'بني سويف',
    submittedAt: '2024-01-18 14:20',
    status: 'approved',
    submitterName: 'طارق فهمي',
    submitterPhone: '01156789019'
  },
  {
    id: '26',
    title: 'سيارة شيفروليه أفيو 2017',
    description: 'سيارة اقتصادية، مناسبة للعمل، حالة جيدة',
    images: ['/car2.webp', '/car3.png'],
    category: 'سيارات',
    price: '165,000 جنيه',
    location: 'الغردقة',
    submittedAt: '2024-01-18 15:10',
    status: 'pending',
    submitterName: 'عبدالرحمن سيد',
    submitterPhone: '01234567898'
  },
  {
    id: '27',
    title: 'جهاز كمبيوتر مكتبي',
    description: 'جهاز كمبيوتر للألعاب والتصميم، كارت شاشة قوي',
    images: ['/laptop.jpg'],
    category: 'إلكترونيات',
    price: '35,000 جنيه',
    location: 'شرم الشيخ',
    submittedAt: '2024-01-19 08:25',
    status: 'needs_modification',
    submitterName: 'أمير حسام',
    submitterPhone: '01098765440'
  },
  {
    id: '28',
    title: 'غسالة أتوماتيك 7 كيلو',
    description: 'غسالة أتوماتيك بحالة ممتازة، 15 برنامج غسيل',
    images: ['/laptop.jpg'],
    category: 'أجهزة منزلية',
    price: '9,500 جنيه',
    location: 'مرسى مطروح',
    submittedAt: '2024-01-19 09:40',
    status: 'approved',
    submitterName: 'سلمى عادل',
    submitterPhone: '01156789020'
  },
  {
    id: '29',
    title: 'شاليه للبيع على البحر',
    description: 'شاليه 80 متر، إطلالة بحرية مباشرة، مفروش بالكامل',
    images: ['/flat.jpg'],
    category: 'عقارات',
    price: '950,000 جنيه',
    location: 'العين السخنة',
    submittedAt: '2024-01-19 10:55',
    status: 'rejected',
    submitterName: 'ياسر محمد',
    submitterPhone: '01234567899'
  },
  {
    id: '30',
    title: 'آلة قهوة إسبريسو',
    description: 'آلة قهوة احترافية، تحضير قهوة إيطالية أصيلة',
    images: ['/star.png'],
    category: 'أدوات منزلية',
    price: '4,800 جنيه',
    location: 'دهب',
    submittedAt: '2024-01-19 11:30',
    status: 'pending',
    submitterName: 'نادين أشرف',
    submitterPhone: '01098765441'
  },
  {
    id: '31',
    title: 'سيارة هيونداي إلنترا 2020',
    description: 'سيارة حديثة، كاملة المواصفات، ضمان ساري',
    images: ['/car.webp', '/car2.webp', '/car3.png'],
    category: 'سيارات',
    price: '380,000 جنيه',
    location: 'نويبع',
    submittedAt: '2024-01-19 12:15',
    status: 'approved',
    submitterName: 'حازم عبدالله',
    submitterPhone: '01156789021'
  },
  {
    id: '32',
    title: 'طاولة طعام خشبية',
    description: 'طاولة طعام لـ 6 أشخاص، خشب زان طبيعي',
    images: ['/flat.jpg'],
    category: 'أثاث',
    price: '6,500 جنيه',
    location: 'طابا',
    submittedAt: '2024-01-19 13:20',
    status: 'needs_modification',
    submitterName: 'دينا صلاح',
    submitterPhone: '01234567900'
  },
  {
    id: '33',
    title: 'هاتف سامسونج جالاكسي S23',
    description: 'هاتف ذكي حديث، كاميرا عالية الدقة، ذاكرة 256GB',
    images: ['/laptop.jpg'],
    category: 'إلكترونيات',
    price: '28,000 جنيه',
    location: 'رأس غارب',
    submittedAt: '2024-01-19 14:45',
    status: 'pending',
    submitterName: 'مصطفى جمال',
    submitterPhone: '01098765442'
  },
  {
    id: '34',
    title: 'مكنسة كهربائية بوش',
    description: 'مكنسة كهربائية قوية، فلتر HEPA، هادئة',
    images: ['/star.png'],
    category: 'أجهزة منزلية',
    price: '2,200 جنيه',
    location: 'سفاجا',
    submittedAt: '2024-01-19 15:30',
    status: 'rejected',
    submitterName: 'ريهام فاروق',
    submitterPhone: '01156789022'
  },
  {
    id: '35',
    title: 'دراجة أطفال ملونة',
    description: 'دراجة للأطفال من سن 5-10 سنوات، آمنة ومتينة',
    images: ['/car.webp'],
    category: 'ألعاب أطفال',
    price: '1,800 جنيه',
    location: 'القصير',
    submittedAt: '2024-01-20 08:10',
    status: 'approved',
    submitterName: 'أماني حسن',
    submitterPhone: '01234567901'
  },
  {
    id: '36',
    title: 'مكتبة خشبية كبيرة',
    description: 'مكتبة 5 أرفف، خشب طبيعي، لتنظيم الكتب',
    images: ['/flat.jpg'],
    category: 'أثاث',
    price: '3,800 جنيه',
    location: 'مرسى علم',
    submittedAt: '2024-01-20 09:25',
    status: 'pending',
    submitterName: 'عمرو سامي',
    submitterPhone: '01098765443'
  },
  {
    id: '37',
    title: 'سيارة فولكس فاجن جيتا',
    description: 'سيارة ألمانية الصنع، موديل 2018، حالة ممتازة',
    images: ['/car2.webp'],
    category: 'سيارات',
    price: '290,000 جنيه',
    location: 'حلايب',
    submittedAt: '2024-01-20 10:40',
    status: 'needs_modification',
    submitterName: 'شريف عادل',
    submitterPhone: '01156789023'
  },
  {
    id: '38',
    title: 'جهاز ميكروويف شارب',
    description: 'ميكروويف 25 لتر، شواية وتسخين، حالة جيدة',
    images: ['/laptop.jpg'],
    category: 'أجهزة منزلية',
    price: '3,500 جنيه',
    location: 'شلاتين',
    submittedAt: '2024-01-20 11:15',
    status: 'approved',
    submitterName: 'منى عبدالحميد',
    submitterPhone: '01234567902'
  },
  {
    id: '39',
    title: 'طقم أكواب كريستال',
    description: 'طقم أكواب كريستال فاخر، 12 قطعة، للمناسبات',
    images: ['/star.png'],
    category: 'أدوات منزلية',
    price: '1,200 جنيه',
    location: 'أبو رماد',
    submittedAt: '2024-01-20 12:30',
    status: 'rejected',
    submitterName: 'هالة محمود',
    submitterPhone: '01098765444'
  },
  {
    id: '40',
    title: 'مروحة سقف بجهاز تحكم',
    description: 'مروحة سقف 5 شفرات، جهاز تحكم عن بعد، إضاءة LED',
    images: ['/laptop.jpg'],
    category: 'أجهزة منزلية',
    price: '1,800 جنيه',
    location: 'برنيس',
    submittedAt: '2024-01-20 13:45',
    status: 'pending',
    submitterName: 'وائل صبري',
    submitterPhone: '01156789024'
  },
  {
    id: '41',
    title: 'سيارة رينو لوجان 2019',
    description: 'سيارة عملية واقتصادية، صيانة منتظمة، بدون مشاكل',
    images: ['/car.webp', '/car3.png'],
    category: 'سيارات',
    price: '195,000 جنيه',
    location: 'أدفو',
    submittedAt: '2024-01-20 14:20',
    status: 'approved',
    submitterName: 'إسلام رشاد',
    submitterPhone: '01234567903'
  },
  {
    id: '42',
    title: 'جهاز تليفزيون سمارت 55 بوصة',
    description: 'تليفزيون ذكي 4K، تطبيقات نتفليكس ويوتيوب',
    images: ['/laptop.jpg'],
    category: 'إلكترونيات',
    price: '16,000 جنيه',
    location: 'كوم أمبو',
    submittedAt: '2024-01-20 15:35',
    status: 'needs_modification',
    submitterName: 'نهى عثمان',
    submitterPhone: '01098765445'
  },
  {
    id: '43',
    title: 'خزانة ملابس 4 أبواب',
    description: 'خزانة ملابس واسعة، مرايا وأدراج، تصميم عصري',
    images: ['/flat.jpg'],
    category: 'أثاث',
    price: '12,000 جنيه',
    location: 'إدفو',
    submittedAt: '2024-01-21 08:50',
    status: 'rejected',
    submitterName: 'سمير حبيب',
    submitterPhone: '01156789025'
  },
  {
    id: '44',
    title: 'آلة خياطة سنجر',
    description: 'آلة خياطة كهربائية، متعددة الاستخدامات، حالة ممتازة',
    images: ['/star.png'],
    category: 'أدوات منزلية',
    price: '5,500 جنيه',
    location: 'الكاب',
    submittedAt: '2024-01-21 09:15',
    status: 'pending',
    submitterName: 'فايزة أحمد',
    submitterPhone: '01234567904'
  },
  {
    id: '45',
    title: 'دراجة نارية بنيلي 200',
    description: 'دراجة نارية إيطالية، تصميم رياضي، موديل 2020',
    images: ['/car.webp'],
    category: 'مركبات',
    price: '42,000 جنيه',
    location: 'دراو',
    submittedAt: '2024-01-21 10:30',
    status: 'approved',
    submitterName: 'بسام نبيل',
    submitterPhone: '01098765446'
  },
  {
    id: '46',
    title: 'جهاز بلايستيشن 4 برو',
    description: 'جهاز ألعاب مع يدين تحكم و 10 ألعاب أصلية',
    images: ['/laptop.jpg'],
    category: 'إلكترونيات',
    price: '18,500 جنيه',
    location: 'قفط',
    submittedAt: '2024-01-21 11:45',
    status: 'needs_modification',
    submitterName: 'كريم هشام',
    submitterPhone: '01156789026'
  },
  {
    id: '47',
    title: 'طقم حلل جرانيت',
    description: 'طقم حلل جرانيت 8 قطع، مقاوم للخدش، توزيع حرارة متساوي',
    images: ['/star.png'],
    category: 'أدوات منزلية',
    price: '3,200 جنيه',
    location: 'نقادة',
    submittedAt: '2024-01-21 12:20',
    status: 'pending',
    submitterName: 'عبير سعد',
    submitterPhone: '01234567905'
  },
  {
    id: '48',
    title: 'سيارة فيات تيبو 2021',
    description: 'سيارة حديثة، كاملة المواصفات، ضمان الوكيل',
    images: ['/car2.webp', '/car3.png'],
    category: 'سيارات',
    price: '420,000 جنيه',
    location: 'قوص',
    submittedAt: '2024-01-21 13:35',
    status: 'rejected',
    submitterName: 'أحمد طه',
    submitterPhone: '01098765447'
  },
  {
    id: '49',
    title: 'مكيف شباك 1.5 حصان',
    description: 'مكيف شباك موفر للطاقة، تبريد قوي، صوت هادئ',
    images: ['/laptop.jpg'],
    category: 'أجهزة منزلية',
    price: '6,800 جنيه',
    location: 'الوقف',
    submittedAt: '2024-01-21 14:10',
    status: 'approved',
    submitterName: 'لبنى فتحي',
    submitterPhone: '01156789027'
  },
  {
    id: '50',
    title: 'كنبة زاوية مودرن',
    description: 'كنبة زاوية 7 مقاعد، قماش مقاوم للبقع، تصميم عصري',
    images: ['/flat.jpg'],
    category: 'أثاث',
    price: '22,000 جنيه',
    location: 'فرشوط',
    submittedAt: '2024-01-21 15:25',
    status: 'pending',
    submitterName: 'محمد عبدالعال',
    submitterPhone: '01234567906'
  }
  
];

const rejectionReasons = [
  'صور غير واضحة',
  'معلومات ناقصة',
  'سعر غير مناسب',
  'محتوى مخالف',
  'تصنيف خاطئ',
  'معلومات اتصال غير صحيحة'
];

export default function ModerationPage() {
  const [ads, setAds] = useState<Ad[]>(mockAds.map(a => ({ ...a, status: 'pending' })));
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
  const [editForm, setEditForm] = useState<{ title: string; description: string; category: string; price: string; location: string; images: string[] }>({
    title: '',
    description: '',
    category: '',
    price: '',
    location: '',
    images: []
  });
  const [newImageUrl, setNewImageUrl] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [autoApprove, setAutoApprove] = useState<boolean>(false);
  const uniqueCategories = Array.from(new Set(ads.map(ad => ad.category)));
  
  // حساب عدد الإعلانات قيد المراجعة
  const pendingAdsCount = ads.filter(ad => ad.status === 'pending').length;
  
  // حساب عدد الإعلانات لكل قسم
  const getCategoryCount = (category: string) => {
    return ads.filter(ad => ad.category === category).length;
  };
  
  // حساب إجمالي الإعلانات
  const totalAdsCount = ads.length;

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('moderation:autoApprove') : null;
    setAutoApprove(raw === 'true');
  }, []);

  useEffect(() => {
    if (!autoApprove) return;
    const pendingIds = ads.filter(a => a.status === 'pending').map(a => a.id);
    if (pendingIds.length === 0) return;
    pendingIds.forEach((id) => handleAction(id, 'approve'));
  }, [autoApprove, ads]);

  const CategorySelect = ({ options, value, onChange, placeholder, getCount, className }: { options: string[]; value: string; onChange: (v: string) => void; placeholder: string; getCount: (cat: string) => number; className?: string }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
      const h = (e: MouseEvent) => {
        if (!ref.current) return;
        const t = e.target as Node;
        if (!ref.current.contains(t)) setOpen(false);
      };
      document.addEventListener('mousedown', h);
      return () => document.removeEventListener('mousedown', h);
    }, []);
    return (
      <div className={`managed-select ${className ? className : ''}`} ref={ref}>
        <button type="button" className="managed-select-toggle" onClick={() => setOpen(p => !p)}>
          <span className={`managed-select-value ${value ? 'filled' : ''}`}>{value || placeholder}</span>
          <span className={`managed-select-caret ${open ? 'open' : ''}`}>▾</span>
        </button>
        {open && (
          <div className="managed-select-menu">
            <div className={`managed-select-item ${value === '' ? 'selected' : ''}`} onClick={() => { onChange(''); setOpen(false); }}>
              <span className="managed-select-text">{placeholder}</span>
            </div>
            {options.map(opt => (
              <div key={opt} className={`managed-select-item ${value === opt ? 'selected' : ''}`} onClick={() => { onChange(opt); setOpen(false); }}>
                <span className="managed-select-text">{opt}</span>
                <span className="managed-select-badge">{getCount(opt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // State variables for modals and forms
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'modify'>('reject');
  const [reasonTargetAdId, setReasonTargetAdId] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [imageModalAdId, setImageModalAdId] = useState<string | null>(null);
  const [imageModalIndex, setImageModalIndex] = useState(0);
  const [editTargetAdId, setEditTargetAdId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: number; type: 'success' | 'error' | 'info'; title: string; message?: string }[]>([]);
  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  const showToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => dismissToast(id), 4000);
  };

  const handleAction = (adId: string, action: 'approve' | 'reject' | 'modify', reason?: string) => {
    const target = ads.find(a => a.id === adId);
    if (!target) return;

    const toManagement = (ad: Ad) => {
      const createdDate = ad.submittedAt.split(' ')[0] || new Date().toISOString().slice(0,10);
      const addDays = (dateStr: string, days: number) => {
        const d = new Date(dateStr);
        d.setDate(d.getDate() + days);
        return d.toISOString().slice(0,10);
      };
      const numericId = Number(ad.id) || Math.floor(Math.random() * 1000000);
      const value = Number(String(ad.price).replace(/[^\d]/g, '')) || 0;
      return {
        id: numericId,
        status: "منشور",
        category: ad.category,
        createdDate,
        expiryDate: addDays(createdDate, 30),
        ownerCode: ad.submitterPhone || `USR${numericId}`,
        displayType: "عادي",
        value,
        views: 0,
        reports: 0,
      };
    };

    const toRejected = (ad: Ad, reasonText: string) => {
      const creationDate = ad.submittedAt.split(' ')[0] || new Date().toISOString().slice(0,10);
      const addDays = (dateStr: string, days: number) => {
        const d = new Date(dateStr);
        d.setDate(d.getDate() + days);
        return d.toISOString().slice(0,10);
      };
      const numericId = Number(ad.id) || Math.floor(Math.random() * 1000000);
      return {
        id: numericId,
        section: ad.category,
        creationDate,
        endDate: addDays(creationDate, 30),
        advertiserCode: ad.submitterPhone || `USR${numericId}`,
        rejectionReason: reasonText || "غير مذكور",
        rejectedBy: "مشرف النظام",
      };
    };

    if (action === 'approve') {
      const extra = JSON.parse(localStorage.getItem('adsManagementFromModeration') || '[]');
      localStorage.setItem('adsManagementFromModeration', JSON.stringify([...(Array.isArray(extra) ? extra : []), toManagement(target)]));
      showToast('success', 'تمت الموافقة على الإعلان', target.title);
    } else if (action === 'reject') {
      const extra = JSON.parse(localStorage.getItem('rejectedAdsFromModeration') || '[]');
      localStorage.setItem('rejectedAdsFromModeration', JSON.stringify([...(Array.isArray(extra) ? extra : []), toRejected(target, reason || '')]));
      showToast('error', 'تم رفض الإعلان', reason || target.title);
    } else {
      // تعديل فقط: لا ننقل الإعلان، نحدث حالته داخل الصفحة
      setAds(prev => prev.map(ad => ad.id === adId ? { ...ad, status: 'needs_modification' } : ad));
      if (selectedAd?.id === adId) {
        setSelectedAd(prev => prev ? { ...prev, status: 'needs_modification' } : null);
      }
      setShowReasonModal(false);
      setCustomReason('');
      setReasonTargetAdId(null);
      showToast('info', 'تم وضع الإعلان بحالة يحتاج تعديل', reason || target.title);
      return;
    }

    // إزالة الإعلان من صفحة المراجعة بعد القبول/الرفض
    setAds(prev => prev.filter(ad => ad.id !== adId));
    if (selectedAd?.id === adId) {
      setSelectedAd(null);
    }

    setShowReasonModal(false);
    setCustomReason('');
    setReasonTargetAdId(null);
  };

  const openImageModal = (adId: string, imageIndex: number) => {
    setImageModalAdId(adId);
    setImageModalIndex(imageIndex);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setImageModalAdId(null);
    setImageModalIndex(0);
  };

  const openReasonModal = (type: 'reject' | 'modify', adId: string) => {
    setActionType(type);
    setReasonTargetAdId(adId);
    setShowReasonModal(true);
  };

  const closeReasonModal = () => {
    setShowReasonModal(false);
    setCustomReason('');
    setReasonTargetAdId(null);
  };

  const openEditModal = (ad: Ad) => {
    setEditTargetAdId(ad.id);
    setEditForm({
      title: ad.title,
      description: ad.description,
      category: ad.category,
      price: ad.price,
      location: ad.location,
      images: [...ad.images]
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditTargetAdId(null);
  };

  const openMobileModal = (ad: Ad) => {
    setSelectedAd(ad);
    setShowMobileModal(true);
  };

  const closeMobileModal = () => {
    setShowMobileModal(false);
    setSelectedAd(null);
  };

  // معرض الصور
  const nextImage = () => {
    if (!imageModalAdId) return;
    const imgs = ads.find(a => a.id === imageModalAdId)?.images || [];
    if (imgs.length > 0) setImageModalIndex((prev) => (prev + 1) % imgs.length);
  };

  const prevImage = () => {
    if (!imageModalAdId) return;
    const imgs = ads.find(a => a.id === imageModalAdId)?.images || [];
    if (imgs.length > 0) setImageModalIndex((prev) => (prev - 1 + imgs.length) % imgs.length);
  };

  const deleteAdImage = (adId: string, index: number) => {
    setAds(prev => prev.map(a => a.id === adId ? { ...a, images: a.images.filter((_, i) => i !== index) } : a));
    if (selectedAd?.id === adId) {
      setSelectedAd(prev => prev ? { ...prev, images: prev.images.filter((_, i) => i !== index) } : null);
    }
    if (imageModalAdId === adId) {
      const imgs = ads.find(a => a.id === adId)?.images || [];
      const newLength = imgs.length - 1;
      if (newLength <= 0) {
        closeImageModal();
      } else {
        setImageModalIndex((prev) => Math.min(prev, newLength - 1));
      }
    }
  };

  const handleEditChange = (field: 'title' | 'description' | 'category' | 'price' | 'location', value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const addImageToEditForm = () => {
    if (newImageUrl.trim()) {
      setEditForm(prev => ({ ...prev, images: [...prev.images, newImageUrl.trim()] }));
      setNewImageUrl('');
    }
  };

  const removeImageFromEditForm = (index: number) => {
    setEditForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const saveEditChanges = () => {
    if (!editTargetAdId) return;
    setAds(prev => prev.map(ad => 
      ad.id === editTargetAdId
        ? { ...ad, 
            title: editForm.title,
            description: editForm.description,
            category: editForm.category,
            price: editForm.price,
            location: editForm.location,
            images: editForm.images
          }
        : ad
    ));
    if (selectedAd?.id === editTargetAdId) {
      setSelectedAd(prev => prev ? { 
        ...prev,
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        price: editForm.price,
        location: editForm.location,
        images: editForm.images
      } : null);
    }
    closeEditModal();
    showToast('info', 'تم حفظ تعديلات الإعلان', editForm.title);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#0f9c85';
      case 'rejected': return '#ef4444';
      case 'needs_modification': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد المراجعة';
      case 'approved': return 'موافق عليه';
      case 'rejected': return 'مرفوض';
      case 'needs_modification': return 'يحتاج تعديل';
      default: return 'غير محدد';
    }
  };

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
      {/* <div className="moderation-header">
        <div className="header-content">
          <div className="title-section">
            <div className="title-icon">🔍</div>
            <div>
              <h1 className="page-title">الموافقات والمراجعة</h1>
              <p className="page-subtitle">مراجعة وإدارة الإعلانات المرسلة</p>
            </div>
          </div>
          <div className="pending-counter">
            <div className="counter-badge">
              <span className="counter-number">{pendingAdsCount}</span>
              <span className="counter-label">إعلان قيد المراجعة</span>
            </div>
          </div>
        </div>
      </div> */}

      <div className="moderation-layout">
        <div className="queue-section">
          <div className="queue-header">
            <h2>مراجعة وإدارة الإعلانات المرسلة </h2>
            {/* <div className="pending-counter">
            <div className="counter-badge">
              <span className="counter-number">{pendingAdsCount}</span>
              <span className="counter-label">إعلان قيد المراجعة</span>
            </div>
          </div> */}
            {/* <div className="queue-filters"> */}
              {/* <label className="filter-label">القسم</label> */}
          <div className="filters-row">
            <CategorySelect
              options={uniqueCategories}
              value={categoryFilter}
              onChange={(v) => setCategoryFilter(v)}
              placeholder={`كل الأقسام (${totalAdsCount})`}
              getCount={getCategoryCount}
              className="category-select-wide"
            />
            <label className="toggle-label compact">
              <span className="toggle-text">الموافقة التلقائية على الإعلانات</span>
              <div className="toggle-switch-container">
                <input
                  type="checkbox"
                  className="toggle-input"
                  checked={autoApprove}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setAutoApprove(v);
                    localStorage.setItem('moderation:autoApprove', String(v));
                    showToast(v ? 'success' : 'info', v ? 'تم تفعيل الموافقة التلقائية' : 'تم إيقاف الموافقة التلقائية');
                  }}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-status">{autoApprove ? 'مفعل' : 'مغلق'}</span>
              </div>
            </label>
          </div>
            {/* </div> */}
          </div>

          <div className="ads-queue">
            {ads.filter(ad => !categoryFilter || ad.category === categoryFilter).map((ad) => (
              <div 
                key={ad.id} 
                className={`ad-card ${selectedAd?.id === ad.id ? 'selected' : ''}`}
                onClick={() => {
                  // Check if it's mobile view
                  if (window.innerWidth <= 968) {
                    openMobileModal(ad);
                  } else {
                    setSelectedAd(ad);
                  }
                }}
              >
                <div className="ad-card-header">
                  <div className="ad-status">
                    {getStatusText(ad.status)}
                  </div>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          openImageModal(ad.id, 0);
                        }}
                      />
                    )}
                    {ad.images.length > 1 && (
                      <div className="image-count">+{ad.images.length - 1}</div>
                    )}
                  </div>

                  <div className="ad-info">
                    <h3 className="ad-title">{ad.title}</h3>
                    <p className="ad-category">{ad.category}</p>
                    <p className="ad-price">{ad.price}</p>
                    <p className="ad-location">📍 {ad.location}</p>
                    <p className="ad-time">⏰ {ad.submittedAt}</p>
                  </div>
                </div>

                <div className="ad-card-actions">
                  <button 
                    className="action-btn approve-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(ad.id, 'approve');
                    }}
                  >
                    ✓ موافقة
                  </button>
                  <button 
                    className="action-btn reject-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openReasonModal('reject', ad.id);
                    }}
                  >
                    ✗ رفض
                  </button>
                  <button 
                    className="action-btn modify-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(ad);
                    }}
                  >
                    ✏️ تعديل البيانات
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="details-pane">
          {selectedAd ? (
            <div className="ad-details">
              <div className="details-header">
                <h2>تفاصيل الإعلان</h2>
                <div className="ad-status-large">
                  {getStatusText(selectedAd.status)}
                </div>
              </div>

              <div className="details-content">
                <div className="detail-section">
                  <h3>معلومات الإعلان</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>العنوان:</label>
                      <span>{selectedAd.title}</span>
                    </div>
                    <div className="detail-item">
                      <label>التصنيف:</label>
                      <span>{selectedAd.category}</span>
                    </div>
                    <div className="detail-item">
                      <label>السعر:</label>
                      <span>{selectedAd.price}</span>
                    </div>
                    <div className="detail-item">
                      <label>الموقع:</label>
                      <span>{selectedAd.location}</span>
                    </div>
                    <div className="detail-item full-width">
                      <label>الوصف:</label>
                      <span>{selectedAd.description}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>معلومات المرسل</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>الاسم:</label>
                      <span>{selectedAd.submitterName}</span>
                    </div>
                    <div className="detail-item">
                      <label>الهاتف:</label>
                      <span>{selectedAd.submitterPhone}</span>
                    </div>
                    <div className="detail-item">
                      <label>تاريخ الإرسال:</label>
                      <span>{selectedAd.submittedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>الصور ({selectedAd.images.length})</h3>
                  <div className="images-grid">
                    {selectedAd.images.map((image, index) => (
                      <div key={index} className="image-container">
                        <Image 
                          src={image} 
                          alt={`صورة ${index + 1}`}
                          width={120}
                          height={90}
                          className="detail-image"
                          onClick={() => openImageModal(selectedAd.id, index)}
                        />
                        <div className="image-actions">
                          <button className="image-action-btn zoom-btn" onClick={() => openImageModal(selectedAd.id, index)}>عرض</button>
                          <button className="image-action-btn delete-btn" onClick={() => deleteAdImage(selectedAd.id, index)}>حذف</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="detail-section">
                  <h3>أدوات الفحص السريع</h3>
                  <div className="quick-tools">
                    <button className="tool-btn">🔍 فحص النصوص المخالفة</button>
                    <button className="tool-btn">📊 تحليل الصور</button>
                    <button className="tool-btn">⚠️ تقرير مخالفة</button>
                  </div>
                </div>

                <div className="detail-actions">
                  <button 
                    className="detail-action-btn approve-btn"
                    onClick={() => handleAction(selectedAd.id, 'approve')}
                  >
                    موافقة على الإعلان
                  </button>
                  <button 
                    className="detail-action-btn reject-btn"
                    onClick={() => openReasonModal('reject', selectedAd.id)}
                  >
                     رفض الإعلان
                  </button>
                  <button 
                    className="detail-action-btn modify-btn"
                    onClick={() => openEditModal(selectedAd)}
                  >
                     تعديل البيانات
                  </button>
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
      </div>

      {/* Image Modal */}
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

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="modal-overlay" onClick={closeReasonModal}>
          <div className="reason-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {actionType === 'reject' ? 'سبب الرفض' : 'سبب طلب التعديل'}
              </h3>
              <button className="modal-close" onClick={closeReasonModal}>✕</button>
            </div>
            
            <div className="modal-content">
              <div className="reason-templates">
                <h4>أسباب جاهزة:</h4>
                {rejectionReasons.map((reason, index) => (
                  <button 
                    key={index}
                    className="reason-btn"
                    onClick={() => setCustomReason(reason)}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              
              <div className="custom-reason">
                <label>سبب مخصص:</label>
                <textarea 
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="اكتب السبب هنا..."
                  rows={4}
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="confirm-btn"
                onClick={() => reasonTargetAdId && handleAction(reasonTargetAdId, actionType, customReason)}
              >
                تأكيد
              </button>
              <button 
                className="cancel-btn"
                onClick={closeReasonModal}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
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
                  <label>العنوان</label>
                  <input 
                    type="text" 
                    value={editForm.title}
                    onChange={(e) => handleEditChange('title', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>الوصف</label>
                  <textarea 
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => handleEditChange('description', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>التصنيف</label>
                  <input 
                    type="text" 
                    value={editForm.category}
                    onChange={(e) => handleEditChange('category', e.target.value)}
                  />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>السعر</label>
                    <input 
                      type="text" 
                      value={editForm.price}
                      onChange={(e) => handleEditChange('price', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>الموقع</label>
                    <input 
                      type="text" 
                      value={editForm.location}
                      onChange={(e) => handleEditChange('location', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>الصور</label>
                  <div className="edit-images">
                    {editForm.images.map((img, idx) => (
                      <div key={idx} className="edit-image-item">
                        <Image src={img} alt={`صورة ${idx+1}`} width={80} height={60} />
                        <button className="image-action-btn delete-btn" onClick={() => removeImageFromEditForm(idx)}>حذف</button>
                      </div>
                    ))}
                  </div>
                  <div className="add-image-row">
                    <input 
                      type="text" 
                      placeholder="مسار الصورة (URL أو /public)"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                    />
                    <button className="tool-btn" onClick={addImageToEditForm}>إضافة صورة</button>
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

      {/* Mobile Modal */}
      {showMobileModal && selectedAd && (
        <div className="modal-overlay" onClick={closeMobileModal}>
          <div className="mobile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>تفاصيل الإعلان</h3>
              <button className="modal-close" onClick={closeMobileModal}>✕</button>
            </div>
            <div className="modal-content">
              <div className="mobile-ad-status">
                {getStatusText(selectedAd.status)}
              </div>
              
              <div className="mobile-detail-section">
                <h4>معلومات الإعلان</h4>
                <div className="mobile-detail-grid">
                  <div className="mobile-detail-item">
                    <label>العنوان:</label>
                    <span>{selectedAd.title}</span>
                  </div>
                  <div className="mobile-detail-item">
                    <label>التصنيف:</label>
                    <span>{selectedAd.category}</span>
                  </div>
                  <div className="mobile-detail-item">
                    <label>السعر:</label>
                    <span>{selectedAd.price}</span>
                  </div>
                  <div className="mobile-detail-item">
                    <label>الموقع:</label>
                    <span>{selectedAd.location}</span>
                  </div>
                  <div className="mobile-detail-item full-width">
                    <label>الوصف:</label>
                    <span>{selectedAd.description}</span>
                  </div>
                </div>
              </div>

              <div className="mobile-detail-section">
                <h4>معلومات المرسل</h4>
                <div className="mobile-detail-grid">
                  <div className="mobile-detail-item">
                    <label>الاسم:</label>
                    <span>{selectedAd.submitterName}</span>
                  </div>
                  <div className="mobile-detail-item">
                    <label>الهاتف:</label>
                    <span>{selectedAd.submitterPhone}</span>
                  </div>
                  <div className="mobile-detail-item">
                    <label>تاريخ الإرسال:</label>
                    <span>{selectedAd.submittedAt}</span>
                  </div>
                </div>
              </div>

              <div className="mobile-detail-section">
                <h4>الصور ({selectedAd.images.length})</h4>
                <div className="mobile-images-grid">
                  {selectedAd.images.map((image, index) => (
                    <div key={index} className="mobile-image-container">
                      <Image 
                        src={image} 
                        alt={`صورة ${index + 1}`}
                        width={100}
                        height={75}
                        className="mobile-detail-image"
                        onClick={() => openImageModal(selectedAd.id, index)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mobile-detail-actions">
                <button 
                  className="mobile-action-btn approve-btn"
                  onClick={() => {
                    handleAction(selectedAd.id, 'approve');
                    closeMobileModal();
                  }}
                >
                  ✓ موافقة
                </button>
                <button 
                  className="mobile-action-btn reject-btn"
                  onClick={() => {
                    openReasonModal('reject', selectedAd.id);
                    closeMobileModal();
                  }}
                >
                  ✗ رفض
                </button>
                <button 
                  className="mobile-action-btn modify-btn"
                  onClick={() => {
                    openEditModal(selectedAd);
                    closeMobileModal();
                  }}
                >
                  ✏️ تعديل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
