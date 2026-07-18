/**
 * db.js — طبقة قاعدة البيانات (IndexedDB)
 * ------------------------------------------------
 * كل التطبيق يعتمد على هذا الملف للتعامل مع البيانات.
 * كل دالة ترجع Promise عشان نقدر نستخدم async/await بباقي الموديولات.
 *
 * الجداول (Object Stores):
 *  - users              المستخدمون (مدير/محاسب/كاشير)
 *  - categories         تصنيفات المنتجات
 *  - products           المنتجات
 *  - suppliers          الموردين
 *  - supplierTransactions  حركات مالية مع الموردين (مدفوع/متبقي)
 *  - customers          العملاء
 *  - invoices           رؤوس الفواتير
 *  - invoiceItems       بنود كل فاتورة
 *  - stockMovements     حركات المخزون (دخول/خروج/جرد)
 *  - expenses           المصروفات (رواتب/كهرباء/إيجار/ضرائب...)
 *  - activityLog        سجل كل عملية (من/متى/ماذا)
 */

const DB_NAME = 'supermarket_db';
const DB_VERSION = 1;

let _dbInstance = null;

/** فتح (أو إنشاء) قاعدة البيانات وكل الجداول والفهارس */
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (_dbInstance) return resolve(_dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // ---- المستخدمون ----
      if (!db.objectStoreNames.contains('users')) {
        const store = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
        store.createIndex('username', 'username', { unique: true });
        store.createIndex('role', 'role', { unique: false });
      }

      // ---- التصنيفات ----
      if (!db.objectStoreNames.contains('categories')) {
        const store = db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
        store.createIndex('name', 'name', { unique: true });
      }

      // ---- المنتجات ----
      if (!db.objectStoreNames.contains('products')) {
        const store = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
        store.createIndex('barcode', 'barcode', { unique: true });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('categoryId', 'categoryId', { unique: false });
        store.createIndex('supplierId', 'supplierId', { unique: false });
        store.createIndex('expiryDate', 'expiryDate', { unique: false });
      }

      // ---- الموردين ----
      if (!db.objectStoreNames.contains('suppliers')) {
        const store = db.createObjectStore('suppliers', { keyPath: 'id', autoIncrement: true });
        store.createIndex('name', 'name', { unique: false });
      }

      // ---- حركات الموردين المالية ----
      if (!db.objectStoreNames.contains('supplierTransactions')) {
        const store = db.createObjectStore('supplierTransactions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('supplierId', 'supplierId', { unique: false });
        store.createIndex('date', 'date', { unique: false });
      }

      // ---- العملاء ----
      if (!db.objectStoreNames.contains('customers')) {
        const store = db.createObjectStore('customers', { keyPath: 'id', autoIncrement: true });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('phone', 'phone', { unique: false });
      }

      // ---- رؤوس الفواتير ----
      if (!db.objectStoreNames.contains('invoices')) {
        const store = db.createObjectStore('invoices', { keyPath: 'id', autoIncrement: true });
        store.createIndex('number', 'number', { unique: true });
        store.createIndex('datetime', 'datetime', { unique: false });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('customerId', 'customerId', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }

      // ---- بنود الفواتير ----
      if (!db.objectStoreNames.contains('invoiceItems')) {
        const store = db.createObjectStore('invoiceItems', { keyPath: 'id', autoIncrement: true });
        store.createIndex('invoiceId', 'invoiceId', { unique: false });
        store.createIndex('productId', 'productId', { unique: false });
      }

      // ---- حركات المخزون ----
      if (!db.objectStoreNames.contains('stockMovements')) {
        const store = db.createObjectStore('stockMovements', { keyPath: 'id', autoIncrement: true });
        store.createIndex('productId', 'productId', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('datetime', 'datetime', { unique: false });
      }

      // ---- المصروفات ----
      if (!db.objectStoreNames.contains('expenses')) {
        const store = db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('date', 'date', { unique: false });
      }

      // ---- سجل العمليات ----
      if (!db.objectStoreNames.contains('activityLog')) {
        const store = db.createObjectStore('activityLog', { keyPath: 'id', autoIncrement: true });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('datetime', 'datetime', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      _dbInstance = event.target.result;
      resolve(_dbInstance);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

/** تنفيذ عملية على جدول معين داخل transaction، مع إرجاع Promise */
function runTransaction(storeName, mode, callback) {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const request = callback(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

/** ---------------- عمليات عامة تُستخدم لكل الجداول ---------------- */

const DB = {
  /** إضافة سجل جديد، ترجع الـ id الجديد */
  add(storeName, data) {
    return runTransaction(storeName, 'readwrite', (store) => store.add(data));
  },

  /** تحديث سجل موجود (لازم يحتوي id) */
  put(storeName, data) {
    return runTransaction(storeName, 'readwrite', (store) => store.put(data));
  },

  /** جلب سجل واحد بالـ id */
  get(storeName, id) {
    return runTransaction(storeName, 'readonly', (store) => store.get(id));
  },

  /** جلب كل السجلات من جدول */
  getAll(storeName) {
    return runTransaction(storeName, 'readonly', (store) => store.getAll());
  },

  /** حذف سجل بالـ id */
  delete(storeName, id) {
    return runTransaction(storeName, 'readwrite', (store) => store.delete(id));
  },

  /** البحث عبر فهرس معين (مثلاً: البحث عن منتج بالباركود) */
  async getByIndex(storeName, indexName, value) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const index = tx.objectStore(storeName).index(indexName);
      const request = index.get(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  /** جلب كل السجلات المطابقة لقيمة فهرس معين (مثلاً كل منتجات مورد معين) */
  async getAllByIndex(storeName, indexName, value) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const index = tx.objectStore(storeName).index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  open: openDatabase,
};

export default DB;
