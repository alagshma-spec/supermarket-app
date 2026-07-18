/**
 * app.js — نقطة الدخول الرئيسية
 * الخطوة الحالية: تهيئة قاعدة البيانات + شاشة تأكيد أن كل شي شغال
 * الشاشات الحقيقية (تسجيل الدخول، POS، لوحة التحكم...) تُبنى بالخطوات الجاية
 */
import DB from './db.js';
import { seedDefaultAdminIfNeeded } from './modules/auth.js';
import { fullStamp } from './modules/dateUtils.js';

const STORE_NAMES = [
  'users', 'categories', 'products', 'suppliers', 'supplierTransactions',
  'customers', 'invoices', 'invoiceItems', 'stockMovements', 'expenses', 'activityLog',
];

async function init() {
  const statusEl = document.getElementById('status');
  const dateEl = document.getElementById('dateInfo');
  const tablesEl = document.getElementById('tablesList');

  try {
    await DB.open();
    await seedDefaultAdminIfNeeded();

    statusEl.textContent = 'قاعدة البيانات جاهزة وتعمل ✅';
    statusEl.classList.add('ok');

    const stamp = fullStamp();
    dateEl.innerHTML = `
      <div>${stamp.dayName} — ${stamp.gregorian}</div>
      <div>${stamp.hijri} هـ</div>
      <div>الوقت الحالي: ${stamp.time}</div>
    `;

    // نتأكد إن كل جدول انبنى صح، ونعرض عدد السجلات فيه
    tablesEl.innerHTML = '';
    for (const name of STORE_NAMES) {
      const rows = await DB.getAll(name);
      const li = document.createElement('li');
      li.innerHTML = `<span>${name}</span><span class="count">${rows.length}</span>`;
      tablesEl.appendChild(li);
    }
  } catch (err) {
    statusEl.textContent = 'صار خطأ بتهيئة قاعدة البيانات ❌';
    statusEl.classList.add('error');
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', init);

// تسجيل Service Worker لدعم العمل بدون إنترنت (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
