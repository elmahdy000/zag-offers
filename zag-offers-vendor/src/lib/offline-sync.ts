import { vendorApi } from './api';

interface SyncTask {
  id: string;
  type: 'REDEEM_COUPON';
  data: any;
  timestamp: number;
  retryCount: number;
}

const STORAGE_KEY = 'zag_offline_sync_queue';

import { secureStorage } from './crypto';

/**
 * مدير المزامنة غير المتصلة (Offline Sync Manager)
 * يقوم بتخزين العمليات الفاشلة بسبب انقطاع الإنترنت وإعادة محاولتها عند عودة الاتصال.
 */
export const OfflineSync = {
  /** إضافة مهمة للطابور */
  async addToQueue(type: 'REDEEM_COUPON', data: any) {
    const queue = this.getQueue();
    const newTask: SyncTask = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    queue.push(newTask);
    this.saveQueue(queue);
    console.log(`[OfflineSync] Added task to queue: ${type}`, data);
    return newTask.id;
  },

  /** جلب الطابور الحالي */
  getQueue(): SyncTask[] {
    if (typeof window === 'undefined') return [];
    return secureStorage.get<SyncTask[]>(STORAGE_KEY) || [];
  },

  /** حفظ الطابور */
  saveQueue(queue: SyncTask[]) {
    if (typeof window === 'undefined') return;
    secureStorage.set(STORAGE_KEY, queue);
  },

  /** معالجة الطابور بالكامل */
  async processQueue() {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    console.log(`[OfflineSync] Processing ${queue.length} tasks...`);
    const remainingTasks: SyncTask[] = [];

    for (const task of queue) {
      try {
        await this.executeTask(task);
        console.log(`[OfflineSync] Task ${task.id} synced successfully`);
      } catch (error) {
        console.error(`[OfflineSync] Task ${task.id} failed, will retry later`, error);
        if (task.retryCount < 5) {
          remainingTasks.push({ ...task, retryCount: task.retryCount + 1 });
        }
      }
    }

    this.saveQueue(remainingTasks);
    
    // إرسال حدث مخصص لتحديث الواجهة إذا لزم الأمر
    window.dispatchEvent(new CustomEvent('offline-sync-completed', { 
      detail: { syncedCount: queue.length - remainingTasks.length } 
    }));
  },

  /** تنفيذ مهمة محددة */
  async executeTask(task: SyncTask) {
    const api = vendorApi();
    switch (task.type) {
      case 'REDEEM_COUPON':
        return await api.post('/coupons/redeem', task.data);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  },

  /** بدء مراقبة الاتصال */
  init() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('[OfflineSync] Connection restored. Processing queue...');
      this.processQueue();
    });

    // المحاولة عند التحميل أيضاً في حالة كان الإنترنت متاحاً بالفعل
    if (navigator.onLine) {
      this.processQueue();
    }
  }
};
