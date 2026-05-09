#!/usr/bin/env tsx
/**
 * 🎮 Admin Dashboard Demo Simulation
 * Run with: npx tsx demo-simulation.ts
 */

// ─── Types ─────────────────────────────────────────
type UserRole = 'admin' | 'moderator' | 'viewer';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

interface Store {
  id: string;
  name: string;
  category: string;
  area: string;
  ownerId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

interface Offer {
  id: string;
  title: string;
  storeId: string;
  discount: number;
  status: 'pending' | 'active' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

interface Coupon {
  id: string;
  offerId: string;
  code: string;
  isUsed: boolean;
  usedAt?: Date;
}

interface ActivityLog {
  id: string;
  action: 'USER_LOGIN' | 'STORE_APPROVE' | 'STORE_REJECT' | 'OFFER_APPROVE' | 'OFFER_REJECT' | 'COUPON_CLAIMED' | 'BULK_ACTION';
  targetId: string;
  targetType: 'user' | 'store' | 'offer';
  adminName: string;
  details: string;
  timestamp: Date;
}

interface DashboardStats {
  users: { total: number; newToday: number; active: number };
  stores: { total: number; pending: number; approved: number; rejected: number };
  offers: { total: number; active: number; pending: number; expired: number };
  coupons: { total: number; used: number; conversionRate: number };
}

// ─── Mock Data ─────────────────────────────────────
const MOCK_DATA = {
  areas: ['الزقازيق', 'العاشر من رمضان', 'منيا القمح', 'أبو حماد', 'بلبيس', 'فاقوس', 'كفر صقر', 'الإبراهيمية'],
  categories: ['مطاعم', 'ملابس', 'إلكترونيات', 'سوبر ماركت', 'صيدليات', 'مستحضرات تجميل', 'ألعاب', 'مفروشات'],
  storeNames: [
    'هايبر وان', 'الفا ماركت', 'Carrefour', 'اللؤلؤة', 'البلاتينوم', 
    'أضواء مصر', 'بيتزا هت', 'KFC', 'ماكدونالدز', 'بابا جونز', 
    'ستارز', 'أمازون مصر', 'نون', 'جوميا'
  ],
  offerTitles: [
    'خصم 50% على كل المشتريات',
    'اشترِ 1 واحصل على 1 مجاناً',
    'توصيل مجاني للطلبات فوق 200 جنيه',
    'خصم 20% على أول طلب',
    'هدية مجانية مع كل طلب',
    'كاش باك 10%',
    'عرض اليوم الواحد - 30% خصم',
    'تخفيضات نهاية الموسم 70%'
  ],
  firstNames: ['محمد', 'أحمد', 'علي', 'خالد', 'عمر', 'يوسف', 'عبدالله', 'مصطفى', 'إبراهيم', 'حسن'],
  lastNames: ['السيد', 'أحمد', 'محمد', 'علي', 'حسن', 'إبراهيم', 'عبدالله', 'محمود', 'عمر', 'خالد'],
};

// ─── Colors for Terminal ───────────────────────────
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

// ─── Helper Functions ──────────────────────────────
function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logBox(title: string, content: string[]) {
  const width = Math.max(title.length, ...content.map(c => c.length)) + 4;
  const border = '═'.repeat(width);
  const empty = ' '.repeat(width - 2);
  
  log(`╔${border}╗`, 'cyan');
  log(`║${' '.repeat(Math.floor((width - title.length) / 2))}${title}${' '.repeat(Math.ceil((width - title.length) / 2))}║`, 'cyan');
  log(`╠${border}╣`, 'cyan');
  content.forEach(line => {
    const padding = width - 2 - line.length;
    log(`║ ${line}${' '.repeat(padding - 1)}║`, 'cyan');
  });
  log(`╚${border}╝`, 'cyan');
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function randomDate(daysBack: number = 30): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// ─── Data Generators ───────────────────────────────
function generateUser(): User {
  const firstName = randomItem(MOCK_DATA.firstNames);
  const lastName = randomItem(MOCK_DATA.lastNames);
  return {
    id: generateId(),
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    role: randomItem(['admin', 'moderator', 'viewer']),
    isActive: Math.random() > 0.2,
    createdAt: randomDate(60),
  };
}

function generateStore(): Store {
  return {
    id: generateId(),
    name: randomItem(MOCK_DATA.storeNames),
    category: randomItem(MOCK_DATA.categories),
    area: randomItem(MOCK_DATA.areas),
    ownerId: generateId(),
    status: randomItem(['pending', 'approved', 'rejected']),
    createdAt: randomDate(30),
  };
}

function generateOffer(): Offer {
  const created = randomDate(20);
  const expires = new Date(created);
  expires.setDate(expires.getDate() + 7);
  
  return {
    id: generateId(),
    title: randomItem(MOCK_DATA.offerTitles),
    storeId: generateId(),
    discount: Math.floor(Math.random() * 50) + 10,
    status: randomItem(['pending', 'active', 'expired']),
    createdAt: created,
    expiresAt: expires,
  };
}

function generateCoupon(offerId: string): Coupon {
  return {
    id: generateId(),
    offerId,
    code: Math.random().toString(36).substring(2, 8).toUpperCase(),
    isUsed: Math.random() > 0.6,
    usedAt: Math.random() > 0.6 ? randomDate(7) : undefined,
  };
}

// ─── Demo Scenarios ────────────────────────────────
class AdminDashboardDemo {
  private users: User[] = [];
  private stores: Store[] = [];
  private offers: Offer[] = [];
  private coupons: Coupon[] = [];
  private activityLogs: ActivityLog[] = [];
  private currentAdmin: string = 'Super Admin';

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Generate initial data
    for (let i = 0; i < 20; i++) this.users.push(generateUser());
    for (let i = 0; i < 15; i++) this.stores.push(generateStore());
    for (let i = 0; i < 25; i++) this.offers.push(generateOffer());
    for (let i = 0; i < 100; i++) {
      this.coupons.push(generateCoupon(randomItem(this.offers).id));
    }
    
    logBox('🎮 ADMIN DASHBOARD DEMO SIMULATION', [
      'Version: 1.0.0',
      'Initialized with mock data',
      'Ready for scenario testing',
    ]);
    console.log('');
  }

  // ─── SCENARIO 1: Login & Dashboard Stats ─────────
  scenario1_loginAndStats() {
    log('━'.repeat(60), 'yellow');
    log('📊 SCENARIO 1: Login & Dashboard Overview', 'yellow');
    log('━'.repeat(60), 'yellow');
    console.log('');

    // Simulate login
    const admin = this.users.find(u => u.role === 'admin');
    if (admin) {
      this.logActivity('USER_LOGIN', admin.id, 'user', `${admin.name} logged in`);
      log(`✅ Admin "${admin.name}" logged in successfully`, 'green');
    }

    // Show dashboard stats
    const stats = this.calculateStats();
    logBox('📈 Dashboard Statistics', [
      `👥 Users: ${stats.users.total} total (${stats.users.newToday} new today)`,
      `🏪 Stores: ${stats.stores.total} total (${stats.stores.pending} pending)`,
      `🏷️ Offers: ${stats.offers.total} total (${stats.offers.active} active)`,
      `🎫 Coupons: ${stats.coupons.total} total (${stats.coupons.used} used)`,
      `💰 Conversion Rate: ${stats.coupons.conversionRate}%`,
    ]);
    
    console.log('');
  }

  // ─── SCENARIO 2: Pending Approvals ────────────────
  scenario2_pendingApprovals() {
    log('━'.repeat(60), 'yellow');
    log('⏳ SCENARIO 2: Review Pending Approvals', 'yellow');
    log('━'.repeat(60), 'yellow');
    console.log('');

    const pendingStores = this.stores.filter(s => s.status === 'pending');
    const pendingOffers = this.offers.filter(o => o.status === 'pending');

    log(`🔍 Found ${pendingStores.length} pending stores and ${pendingOffers.length} pending offers`, 'blue');
    console.log('');

    // Review pending stores
    pendingStores.slice(0, 3).forEach(store => {
      const action = Math.random() > 0.3 ? 'approve' : 'reject';
      store.status = action === 'approve' ? 'approved' : 'rejected';
      
      this.logActivity(
        action === 'approve' ? 'STORE_APPROVE' : 'STORE_REJECT',
        store.id,
        'store',
        `${action === 'approve' ? 'Approved' : 'Rejected'} store "${store.name}"`
      );
      
      log(`${action === 'approve' ? '✅' : '❌'} ${action.toUpperCase()}: ${store.name} (${store.category}, ${store.area})`, 
        action === 'approve' ? 'green' : 'red');
    });

    // Review pending offers
    pendingOffers.slice(0, 3).forEach(offer => {
      const action = Math.random() > 0.4 ? 'approve' : 'reject';
      offer.status = action === 'approve' ? 'active' : 'expired';
      
      this.logActivity(
        action === 'approve' ? 'OFFER_APPROVE' : 'OFFER_REJECT',
        offer.id,
        'offer',
        `${action === 'approve' ? 'Approved' : 'Rejected'} offer "${offer.title}"`
      );
      
      log(`${action === 'approve' ? '✅' : '❌'} ${action.toUpperCase()}: ${offer.title.substring(0, 40)}...`,
        action === 'approve' ? 'green' : 'red');
    });

    console.log('');
    log(`📊 Updated stats: ${this.stores.filter(s => s.status === 'pending').length} stores still pending`, 'cyan');
    console.log('');
  }

  // ─── SCENARIO 3: Bulk Actions ───────────────────
  scenario3_bulkActions() {
    log('━'.repeat(60), 'yellow');
    log('⚡ SCENARIO 3: Bulk Actions (Approve All Pending)', 'yellow');
    log('━'.repeat(60), 'yellow');
    console.log('');

    const pendingStores = this.stores.filter(s => s.status === 'pending');
    const count = pendingStores.length;

    if (count === 0) {
      log('⚠️ No pending stores to approve', 'yellow');
      return;
    }

    log(`🔄 Bulk approving ${count} stores...`, 'blue');
    
    pendingStores.forEach(store => {
      store.status = 'approved';
    });

    this.logActivity('BULK_ACTION', 'multiple', 'store', `Bulk approved ${count} stores`);
    
    log(`✅ Successfully approved ${count} stores in bulk!`, 'green');
    console.log('');
    
    // Show updated list
    logBox('🏪 Approved Stores (Sample)', 
      this.stores.filter(s => s.status === 'approved').slice(0, 5).map(s => 
        `• ${s.name} - ${s.area}`
      )
    );
    console.log('');
  }

  // ─── SCENARIO 4: Advanced Filtering ─────────────
  scenario4_advancedFiltering() {
    log('━'.repeat(60), 'yellow');
    log('🔍 SCENARIO 4: Advanced Filtering', 'yellow');
    log('━'.repeat(60), 'yellow');
    console.log('');

    // Filter by category
    const category = 'مطاعم';
    const restaurantStores = this.stores.filter(s => s.category === category);
    log(`🍽️ Filter by category "${category}": ${restaurantStores.length} stores found`, 'cyan');
    
    // Filter by area
    const area = 'الزقازيق';
    const zagazigStores = this.stores.filter(s => s.area === area);
    log(`📍 Filter by area "${area}": ${zagazigStores.length} stores found`, 'cyan');
    
    // Combined filter
    const combined = this.stores.filter(s => s.category === category && s.area === area);
    log(`🔀 Combined filter (مطاعم in الزقازيق): ${combined.length} stores found`, 'green');
    
    if (combined.length > 0) {
      combined.slice(0, 3).forEach(s => {
        log(`   • ${s.name} - ${s.status}`, 'dim');
      });
    }
    
    console.log('');
  }

  // ─── SCENARIO 5: Real-time Notifications ────────
  scenario5_realtimeNotifications() {
    log('━'.repeat(60), 'yellow');
    log('🔔 SCENARIO 5: Real-time Notifications', 'yellow');
    log('━'.repeat(60), 'yellow');
    console.log('');

    // Simulate incoming notifications
    const notifications = [
      { type: 'store', title: 'متجر جديد', message: 'تم تسجيل متجر جديد بانتظار الموافقة' },
      { type: 'offer', title: 'عرض جديد', message: 'تم إضافة عرض جديد بانتظار المراجعة' },
      { type: 'coupon', title: 'كوبون جديد', message: 'مستخدم استخدم كوبون جديد' },
    ];

    notifications.forEach((notif, i) => {
      setTimeout(() => {
        const icon = notif.type === 'store' ? '🏪' : notif.type === 'offer' ? '🏷️' : '🎫';
        log(`${icon} [${new Date().toLocaleTimeString('ar-EG')}] ${notif.title}: ${notif.message}`, 'blue');
      }, i * 500);
    });

    // Simulate a notification
    this.logActivity('STORE_APPROVE', generateId(), 'store', 'New store registered and pending approval');
    
    logBox('🔔 Latest Notifications', [
      '🏪 متجر جديد بانتظار الموافقة',
      '🏷️ عرض جديد بانتظار المراجعة',
      '🎫 كوبون مستخدم من قبل عميل',
    ]);
    
    console.log('');
  }

  // ─── SCENARIO 6: Activity Logs ──────────────────
  scenario6_activityLogs() {
    log('━'.repeat(60), 'yellow');
    log('📝 SCENARIO 6: Activity Logs Review', 'yellow');
    log('━'.repeat(60), 'yellow');
    console.log('');

    log(`📊 Total activity logs: ${this.activityLogs.length}`, 'cyan');
    console.log('');
    
    logBox('📜 Recent Activity Logs', 
      this.activityLogs.slice(-8).map(log => {
        const icon = 
          log.action.includes('APPROVE') ? '✅' :
          log.action.includes('REJECT') ? '❌' :
          log.action.includes('LOGIN') ? '🔑' : '📝';
        return `[${log.timestamp.toLocaleTimeString('ar-EG')}] ${icon} ${log.action}: ${log.details.substring(0, 35)}`;
      })
    );
    
    console.log('');
  }

  // ─── SCENARIO 7: Export Data ────────────────────
  scenario7_exportData() {
    log('━'.repeat(60), 'yellow');
    log('📤 SCENARIO 7: Export Data to CSV', 'yellow');
    log('━'.repeat(60), 'yellow');
    console.log('');

    // Simulate export
    const exportData = this.stores.map(s => ({
      name: s.name,
      category: s.category,
      area: s.area,
      status: s.status,
      createdAt: s.createdAt.toISOString().split('T')[0],
    }));

    log(`📊 Preparing to export ${exportData.length} stores...`, 'blue');
    
    // Show CSV preview
    console.log('');
    log('📄 CSV Preview (first 5 rows):', 'cyan');
    console.log('name,category,area,status,createdAt');
    exportData.slice(0, 5).forEach(row => {
      console.log(`${row.name},${row.category},${row.area},${row.status},${row.createdAt}`);
    });
    
    log(`✅ Export complete! ${exportData.length} records exported`, 'green');
    console.log('');
  }

  // ─── SCENARIO 8: Dark Mode Toggle ────────────────
  scenario8_darkModeToggle() {
    log('━'.repeat(60), 'yellow');
    log('🌙 SCENARIO 8: Dark Mode Toggle', 'yellow');
    log('━'.repeat(60), 'yellow');
    console.log('');

    const modes = ['☀️ Light Mode', '🌙 Dark Mode'];
    
    log('🔄 Toggling theme...', 'blue');
    modes.forEach((mode, i) => {
      setTimeout(() => {
        log(`   Theme changed to: ${mode}`, i === 1 ? 'magenta' : 'cyan');
      }, i * 800);
    });

    setTimeout(() => {
      console.log('');
      log('✅ Dark mode settings saved to localStorage', 'green');
      console.log('');
    }, 1600);
  }

  // ─── SCENARIO 9: Search & Auto-refresh ───────────
  scenario9_searchAndAutoRefresh() {
    log('━'.repeat(60), 'yellow');
    log('🔍 SCENARIO 9: Search & Auto-refresh', 'yellow');
    log('━'.repeat(60), 'yellow');
    console.log('');

    // Search simulation
    const query = 'هايبر';
    const results = this.stores.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
    
    log(`🔍 Search query: "${query}"`, 'blue');
    log(`✅ Found ${results.length} matching stores`, 'green');
    results.slice(0, 3).forEach(s => log(`   • ${s.name} (${s.area})`, 'dim'));
    console.log('');

    // Auto-refresh simulation
    log('🔄 Auto-refresh enabled (every 5 minutes)', 'cyan');
    log('   ├─ Refreshing global stats...', 'dim');
    log('   ├─ Refreshing pending items...', 'dim');
    log('   └─ Refreshing top stores...', 'dim');
    log('✅ All data refreshed successfully', 'green');
    console.log('');
  }

  // ─── Helper Methods ─────────────────────────────
  private calculateStats(): DashboardStats {
    const usedCoupons = this.coupons.filter(c => c.isUsed).length;
    return {
      users: {
        total: this.users.length,
        newToday: Math.floor(Math.random() * 10) + 1,
        active: this.users.filter(u => u.isActive).length,
      },
      stores: {
        total: this.stores.length,
        pending: this.stores.filter(s => s.status === 'pending').length,
        approved: this.stores.filter(s => s.status === 'approved').length,
        rejected: this.stores.filter(s => s.status === 'rejected').length,
      },
      offers: {
        total: this.offers.length,
        active: this.offers.filter(o => o.status === 'active').length,
        pending: this.offers.filter(o => o.status === 'pending').length,
        expired: this.offers.filter(o => o.status === 'expired').length,
      },
      coupons: {
        total: this.coupons.length,
        used: usedCoupons,
        conversionRate: parseFloat(((usedCoupons / this.coupons.length) * 100).toFixed(1)),
      },
    };
  }

  private logActivity(
    action: ActivityLog['action'],
    targetId: string,
    targetType: ActivityLog['targetType'],
    details: string
  ) {
    this.activityLogs.push({
      id: generateId(),
      action,
      targetId,
      targetType,
      adminName: this.currentAdmin,
      details,
      timestamp: new Date(),
    });
  }

  // ─── Run All Scenarios ──────────────────────────
  async runAllScenarios() {
    console.clear();
    
    const scenarios = [
      () => this.scenario1_loginAndStats(),
      () => this.scenario2_pendingApprovals(),
      () => this.scenario3_bulkActions(),
      () => this.scenario4_advancedFiltering(),
      () => this.scenario5_realtimeNotifications(),
      () => this.scenario6_activityLogs(),
      () => this.scenario7_exportData(),
      () => this.scenario8_darkModeToggle(),
      () => this.scenario9_searchAndAutoRefresh(),
    ];

    for (const scenario of scenarios) {
      scenario();
      await this.delay(2000);
    }

    // Final summary
    log('━'.repeat(60), 'green');
    log('🎉 ALL SCENARIOS COMPLETED SUCCESSFULLY!', 'green');
    log('━'.repeat(60), 'green');
    console.log('');
    
    const finalStats = this.calculateStats();
    logBox('📊 Final Dashboard State', [
      `Total Users: ${finalStats.users.total}`,
      `Active Stores: ${finalStats.stores.approved}`,
      `Pending Stores: ${finalStats.stores.pending}`,
      `Active Offers: ${finalStats.offers.active}`,
      `Coupons Used: ${finalStats.coupons.used}`,
      `Activity Logs: ${this.activityLogs.length}`,
    ]);
    
    console.log('');
    log('💡 To run again: npx tsx demo-simulation.ts', 'cyan');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ─── Main ─────────────────────────────────────────
const demo = new AdminDashboardDemo();

demo.runAllScenarios().catch(console.error);

// Handle process exit
process.on('SIGINT', () => {
  console.log('\n');
  log('👋 Demo terminated by user', 'yellow');
  process.exit(0);
});
