/**
 * auth.js — المستخدمون، الصلاحيات، تسجيل الدخول
 * التشفير عبر Web Crypto API المدمجة بالمتصفح (SHA-256) — بدون أي مكتبة خارجية
 */
import DB from '../db.js';
import { logActivity } from './activityLog.js';

export const ROLES = {
  MANAGER: 'مدير',
  ACCOUNTANT: 'محاسب',
  CASHIER: 'كاشير',
};

/** صلاحيات كل دور — تُستخدم لإخفاء/إظهار أقسام الواجهة لاحقًا */
export const PERMISSIONS = {
  [ROLES.MANAGER]: ['dashboard', 'pos', 'products', 'inventory', 'suppliers', 'customers', 'accounting', 'reports', 'users', 'activityLog'],
  [ROLES.ACCOUNTANT]: ['dashboard', 'products', 'inventory', 'suppliers', 'customers', 'accounting', 'reports', 'activityLog'],
  [ROLES.CASHIER]: ['pos', 'products'],
};

async function hashPassword(plain) {
  const data = new TextEncoder().encode(plain);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** يُنشئ حساب المدير الافتراضي أول مرة فقط يفتح فيها التطبيق */
export async function seedDefaultAdminIfNeeded() {
  const users = await DB.getAll('users');
  if (users.length > 0) return null;

  const passwordHash = await hashPassword('admin123');
  const id = await DB.add('users', {
    username: 'admin',
    fullName: 'المدير العام',
    role: ROLES.MANAGER,
    passwordHash,
    active: true,
  });

  await logActivity(id, 'المدير العام', 'إنشاء النظام', 'تم إنشاء حساب المدير الافتراضي');
  return id;
}

/** تسجيل الدخول — يرجع بيانات المستخدم لو صح، أو null لو خطأ */
export async function login(username, password) {
  const user = await DB.getByIndex('users', 'username', username);
  if (!user || !user.active) return null;

  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) return null;

  await logActivity(user.id, user.fullName, 'تسجيل دخول');
  // ما نرجع passwordHash للواجهة أبدًا
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/** إنشاء مستخدم جديد (يُستخدم من قِبل المدير فقط) */
export async function createUser({ username, fullName, role, password }) {
  const passwordHash = await hashPassword(password);
  const id = await DB.add('users', { username, fullName, role, passwordHash, active: true });
  return id;
}

export function hasPermission(user, section) {
  if (!user) return false;
  return (PERMISSIONS[user.role] || []).includes(section);
}
