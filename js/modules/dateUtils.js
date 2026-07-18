/**
 * dateUtils.js — التاريخ والوقت الحقيقي للجهاز
 * يستخدم التقويم الهجري المدمج بالمتصفح (بدون أي مكتبة خارجية)
 */

const DAY_NAMES_AR = [
  'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت',
];

export function now() {
  return new Date();
}

/** اسم اليوم بالعربي حسب تاريخ الجهاز الحقيقي */
export function dayNameAr(date = new Date()) {
  return DAY_NAMES_AR[date.getDay()];
}

/** التاريخ الميلادي بصيغة عربية (مثال: ١٨ يوليو ٢٠٢٦) */
export function gregorianAr(date = new Date()) {
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(date);
}

/** التاريخ الهجري بصيغة عربية (يعتمد على تقويم ICU المدمج بالمتصفح) */
export function hijriAr(date = new Date()) {
  return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(date);
}

/** الوقت الحالي بصيغة 12 ساعة عربية (مثال: ٠٣:٤٥ م) */
export function timeAr(date = new Date()) {
  return new Intl.DateTimeFormat('ar-SA', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(date);
}

/** يُستخدم للتخزين والفرز (ISO ثابت بغض النظر عن اللغة) */
export function isoNow() {
  return new Date().toISOString();
}

/** ملخص كامل جاهز للعرض أو الحفظ مع أي عملية */
export function fullStamp(date = new Date()) {
  return {
    iso: date.toISOString(),
    dayName: dayNameAr(date),
    gregorian: gregorianAr(date),
    hijri: hijriAr(date),
    time: timeAr(date),
  };
}
