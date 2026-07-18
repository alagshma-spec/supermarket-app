/**
 * activityLog.js — يسجل أي عملية (إضافة/تعديل/حذف/بيع/شراء) تلقائيًا
 */
import DB from '../db.js';
import { fullStamp } from './dateUtils.js';

/**
 * @param {number} userId - id المستخدم اللي نفذ العملية
 * @param {string} userName - اسم المستخدم (يُحفظ كنص عشان يبقى بالسجل حتى لو انحذف المستخدم لاحقًا)
 * @param {string} action - نوع العملية، مثال: "إضافة منتج", "بيع فاتورة", "حذف مورد"
 * @param {string} details - تفاصيل إضافية، مثال: "منتج: أرز بسمتي 5 كجم"
 */
export async function logActivity(userId, userName, action, details = '') {
  const stamp = fullStamp();
  return DB.add('activityLog', {
    userId,
    userName,
    action,
    details,
    datetime: stamp.iso,
    dayName: stamp.dayName,
    gregorian: stamp.gregorian,
    hijri: stamp.hijri,
    time: stamp.time,
  });
}

/** جلب آخر العمليات (الأحدث أولاً) */
export async function getRecentActivity(limit = 50) {
  const all = await DB.getAll('activityLog');
  return all.sort((a, b) => new Date(b.datetime) - new Date(a.datetime)).slice(0, limit);
}
