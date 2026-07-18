/**
 * session.js — يحفظ المستخدم المسجّل دخوله حاليًا بالجهاز
 * يستخدم localStorage (يبقى محفوظ حتى لو أغلقت المتصفح/التطبيق)
 * لا يُحفظ فيه أبدًا passwordHash — فقط بيانات آمنة للعرض
 */

const SESSION_KEY = 'supermarket_session';

export function setCurrentUser(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getCurrentUser() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
