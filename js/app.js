/**
 * app.js — نقطة الدخول الرئيسية
 * الخطوة 3: تسجيل الدخول الحقيقي + هيكل التطبيق بعد الدخول (Sidebar حسب الصلاحيات)
 */
import DB from './db.js';
import { seedDefaultAdminIfNeeded, login, hasPermission } from './modules/auth.js';
import { logActivity } from './modules/activityLog.js';
import { fullStamp } from './modules/dateUtils.js';
import { getCurrentUser, setCurrentUser, clearSession } from './modules/session.js';

// كل الأقسام المتاحة بالنظام — الأقسام غير المبنية بعد تظهر بعلامة "قريبًا"
const SECTIONS = [
  { key: 'dashboard', label: 'لوحة التحكم', icon: '📊', ready: true },
  { key: 'pos', label: 'نقطة البيع', icon: '🧾', ready: false },
  { key: 'products', label: 'المنتجات', icon: '📦', ready: false },
  { key: 'inventory', label: 'المخزون', icon: '🏬', ready: false },
  { key: 'suppliers', label: 'الموردين', icon: '🚚', ready: false },
  { key: 'customers', label: 'العملاء', icon: '👥', ready: false },
  { key: 'accounting', label: 'المحاسبة', icon: '💰', ready: false },
  { key: 'reports', label: 'التقارير', icon: '📈', ready: false },
  { key: 'users', label: 'المستخدمون', icon: '👤', ready: false },
  { key: 'activityLog', label: 'سجل العمليات', icon: '🕒', ready: false },
];

const loginView = document.getElementById('loginView');
const appShell = document.getElementById('appShell');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const navList = document.getElementById('navList');
const contentEl = document.getElementById('content');
const topbarTitle = document.getElementById('topbarTitle');
const userBadge = document.getElementById('userBadge');
const logoutBtn = document.getElementById('logoutBtn');

let currentSection = 'dashboard';

async function init() {
  await DB.open();
  await seedDefaultAdminIfNeeded();

  const allUsers = await DB.getAll('users');
  alert('عدد المستخدمين بقاعدة البيانات: ' + allUsers.length + ' | أول مستخدم: ' + (allUsers[0] ? allUsers[0].username : 'لا يوجد'));

  const user = getCurrentUser();
  if (user) {
    showApp(user);
  } else {
    showLogin();
  }
}

function showLogin() {
  loginView.hidden = false;
  appShell.hidden = true;
}

function showApp(user) {
  loginView.hidden = true;
  appShell.hidden = false;
  buildNav(user);
  userBadge.textContent = `${user.fullName} — ${user.role}`;
  renderSection(currentSection, user);
}

function buildNav(user) {
  navList.innerHTML = '';
  SECTIONS.forEach((section) => {
    if (!hasPermission(user, section.key)) return;

    const btn = document.createElement('button');
    btn.className = 'nav-item' + (section.key === currentSection ? ' active' : '');
    btn.innerHTML = `<span>${section.icon} ${section.label}</span>` +
      (section.ready ? '' : '<span class="soon">قريبًا</span>');
    btn.addEventListener('click', () => {
      currentSection = section.key;
      buildNav(user);
      renderSection(section.key, user);
    });
    navList.appendChild(btn);
  });
}

function renderSection(key, user) {
  const section = SECTIONS.find((s) => s.key === key);
  topbarTitle.textContent = section ? section.label : '';

  if (key === 'dashboard') {
    renderDashboardPlaceholder(user);
    return;
  }

  contentEl.innerHTML = `
    <div class="placeholder-box">
      <div style="font-size:32px; margin-bottom:8px;">${section.icon}</div>
      <div>قسم "${section.label}" لسه ما انبنى — جاي بخطوة قادمة</div>
    </div>
  `;
}

async function renderDashboardPlaceholder(user) {
  const stamp = fullStamp();
  const products = await DB.getAll('products');
  const invoices = await DB.getAll('invoices');

  contentEl.innerHTML = `
    <div class="placeholder-box" style="text-align:right;">
      <p style="font-size:16px; font-weight:700; margin:0 0 6px;">أهلًا ${user.fullName} 👋</p>
      <p style="margin:0 0 16px; color:var(--muted); font-size:13px;">
        ${stamp.dayName} — ${stamp.gregorian} — ${stamp.hijri} هـ — ${stamp.time}
      </p>
      <p style="margin:0; color:var(--muted); font-size:13px;">
        عدد المنتجات: <b>${products.length}</b> &nbsp;|&nbsp;
        عدد الفواتير: <b>${invoices.length}</b>
      </p>
      <p style="margin-top:16px; font-size:13px; color:var(--muted);">
        لوحة التحكم الكاملة بالرسوم البيانية والإحصائيات تُبنى بخطوة قادمة.
      </p>
    </div>
  `;
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  alert('تم الضغط على دخول. اسم المستخدم: "' + username + '"');

  try {
    const user = await login(username, password);
    alert('نتيجة تسجيل الدخول: ' + JSON.stringify(user));

    if (!user) {
      loginError.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
      loginError.hidden = false;
      return;
    }

    setCurrentUser(user);
    currentSection = 'dashboard';
    showApp(user);
  } catch (err) {
    alert('صار خطأ: ' + err.message);
  }
});

logoutBtn.addEventListener('click', async () => {
  const user = getCurrentUser();
  if (user) await logActivity(user.id, user.fullName, 'تسجيل خروج');
  clearSession();
  showLogin();
  loginForm.reset();
});

document.addEventListener('DOMContentLoaded', init);

// تسجيل Service Worker لدعم العمل بدون إنترنت (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
