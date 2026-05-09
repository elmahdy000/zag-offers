#!/usr/bin/env node
/**
 * 🎮 Admin Dashboard Demo Simulation
 * Run with: node demo-simulation.js
 */

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
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logBox(title, content) {
  const width = Math.max(title.length, ...content.map(c => c.length)) + 4;
  const border = '═'.repeat(width);
  
  log(`╔${border}╗`, 'cyan');
  log(`║${' '.repeat(Math.floor((width - title.length) / 2))}${title}${' '.repeat(Math.ceil((width - title.length) / 2))}║`, 'cyan');
  log(`╠${border}╣`, 'cyan');
  content.forEach(line => {
    const padding = width - 2 - line.length;
    log(`║ ${line}${' '.repeat(padding - 1)}║`, 'cyan');
  });
  log(`╚${border}╝`, 'cyan');
}

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
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

// ─── Data Generators ───────────────────────────────
function generateUser() {
  const firstName = randomItem(MOCK_DATA.firstNames);
  const lastName = randomItem(MOCK_DATA.lastNames);
  return {
    id: generateId(),
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    role: randomItem(['admin', 'moderator', 'viewer']),
    isActive: Math.random() > 0.2,
    createdAt: new Date(),
  };
}

function generateStore() {
  return {
    id: generateId(),
    name: randomItem(MOCK_DATA.storeNames),
    category: randomItem(MOCK_DATA.categories),
    area: randomItem(MOCK_DATA.areas),
    status: randomItem(['pending', 'approved', 'rejected']),
    createdAt: new Date(),
  };
}

function generateOffer() {
  return {
    id: generateId(),
    title: randomItem(MOCK_DATA.offerTitles),
    discount: Math.floor(Math.random() * 50) + 10,
    status: randomItem(['pending', 'active', 'expired']),
    createdAt: new Date(),
  };
}

// ─── Demo Class ───────────────────────────────────
class AdminDashboardDemo {
  constructor() {
    this.users = [];
    this.stores = [];
    this.offers = [];
    this.activityLogs = [];
    this.currentAdmin = 'Super Admin';
    
    // Initialize data
    for (let i = 0; i < 20; i++) this.users.push(generateUser());
    for (let i = 0; i < 15; i++) this.stores.push(generateStore());
    for (let i = 0; i < 25; i++) this.offers.push(generateOffer());
    
    logBox('🎮 ADMIN DASHBOARD DEMO SIMULATION', [
      'Version: 1.0.0',
      'Initialized with mock data',
      'Ready for scenario testing',
    ]);
    console.log('');
  }

  logActivity(action, targetId, targetType, details) {
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

  calculateStats() {
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
    };
  }

  // ─── SCENARIO 1: Dashboard Stats ─────────────────
  scenario1_loginAndStats() {
    log('━'.repeat(60), 'yellow');
    log('📊 SCENARIO 1: Login & Dashboard Overview', 'yellow');
    log('━'.repeat(60), 'yellow');
    console.log('');

    const admin = this.users.find(u => u.role === 'admin');
    if (admin) {
      this.logActivity('USER_LOGIN', admin.id, 'user', `${admin.name} logged in`);
      log(`✅ Admin "${admin.name}" logged in successfully`, 'green');
    }

    const stats = this.calculateStats();
    logBox('📈 Dashboard Statistics', [
      `👥 Users: ${stats.users.total} total (${stats.users.newToday} new today)`,
      `🏪 Stores: ${stats.stores.total} total (${stats.stores.pending} pending)`,
      `🏷️ Offers: ${stats.offers.total} total (${stats.offers.active} active)`,
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

    console.log('');
    log(`📊 Updated: ${this.stores.filter(s => s.status === 'pending').length} stores still pending`, 'cyan');
    console.log('');
  }

  // ─── SCENARIO 3: Bulk Actions ───────────────────
  scenario3_bulkActions() {
    log('━'.repeat(60), 'yellow');
    log('⚡ SCENARIO 3: Bulk Actions', 'yellow');
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
  }

  // ─── SCENARIO 4: Advanced Filtering ─────────────
  scenario4_advancedFiltering() {
    log('━'.repeat(60), 'yellow');
    log('🔍 SCENARIO 4: Advanced Filtering', 'yellow');
    log('━'.repeat(60), 'yellow');
    console.log('');

    const category = 'مطاعم';
    const restaurantStores = this.stores.filter(s => s.category === category);
    log(`🍽️ Filter by category "${category}": ${restaurantStores.length} stores found`, 'cyan');
    
    const area = 'الزقازيق';
    const zagazigStores = this.stores.filter(s => s.area === area);
    log(`📍 Filter by area "${area}": ${zagazigStores.length} stores found`, 'cyan');
    
    const combined = this.stores.filter(s => s.category === category && s.area === area);
    log(`🔀 Combined filter (مطاعم in الزقازيق): ${combined.length} stores found`, 'green');
    
    if (combined.length > 0) {
      combined.slice(0, 3).forEach(s => {
        log(`   • ${s.name} - ${s.status}`, 'dim');
      });
    }
    
    console.log('');
  }

  // ─── SCENARIO 5: Activity Logs ──────────────────
  scenario5_activityLogs() {
    log('━'.repeat(60), 'yellow');
    log('📝 SCENARIO 5: Activity Logs Review', 'yellow');
    log('━'.repeat(60), 'yellow');
    console.log('');

    log(`📊 Total activity logs: ${this.activityLogs.length}`, 'cyan');
    console.log('');
    
    logBox('📜 Recent Activity Logs', 
      this.activityLogs.slice(-6).map(log => {
        const icon = 
          log.action.includes('APPROVE') ? '✅' :
          log.action.includes('REJECT') ? '❌' :
          log.action.includes('LOGIN') ? '🔑' : '📝';
        return `[${log.timestamp.toLocaleTimeString('ar-EG')}] ${icon} ${log.action}: ${log.details.substring(0, 35)}`;
      })
    );
    
    console.log('');
  }

  // ─── SCENARIO 6: Search & Export ────────────────
  scenario6_searchAndExport() {
    log('━'.repeat(60), 'yellow');
    log('🔍 SCENARIO 6: Search & Export Data', 'yellow');
    log('━'.repeat(60), 'yellow');
    console.log('');

    // Search simulation
    const query = 'هايبر';
    const results = this.stores.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
    
    log(`🔍 Search query: "${query}"`, 'blue');
    log(`✅ Found ${results.length} matching stores`, 'green');
    console.log('');

    // Export simulation
    log('📤 Exporting stores to CSV...', 'cyan');
    console.log('name,category,area,status');
    this.stores.slice(0, 5).forEach(s => {
      console.log(`${s.name},${s.category},${s.area},${s.status}`);
    });
    
    log(`✅ Exported ${this.stores.length} stores`, 'green');
    console.log('');
  }

  // ─── SCENARIO 7: Real-time Notifications ────────
  scenario7_notifications() {
    log('━'.repeat(60), 'yellow');
    log('🔔 SCENARIO 7: Real-time Notifications', 'yellow');
    log('━'.repeat(60), 'yellow');
    console.log('');

    const notifications = [
      { icon: '🏪', title: 'متجر جديد', message: 'هايبر وان - بانتظار الموافقة' },
      { icon: '🏷️', title: 'عرض جديد', message: 'خصم 50% - بانتظار المراجعة' },
      { icon: '🎫', title: 'كوبون مستخدم', message: 'عميل استخدم كوبون في بيتزا هت' },
    ];

    logBox('🔔 Latest Notifications', 
      notifications.map(n => `${n.icon} ${n.title}: ${n.message}`)
    );
    
    console.log('');
  }

  // ─── SCENARIO 8: Dark Mode ────────────────────────
  scenario8_darkMode() {
    log('━'.repeat(60), 'yellow');
    log('🌙 SCENARIO 8: Dark Mode Toggle', 'yellow');
    log('━'.repeat(60), 'yellow');
    console.log('');

    log('☀️ Light Mode', 'cyan');
    log('🔄 Toggling...', 'dim');
    log('🌙 Dark Mode', 'magenta');
    
    console.log('');
    log('✅ Theme saved to localStorage', 'green');
    console.log('');
  }

  // ─── Run All ────────────────────────────────────
  async runAllScenarios() {
    console.clear();
    
    const scenarios = [
      () => this.scenario1_loginAndStats(),
      () => this.scenario2_pendingApprovals(),
      () => this.scenario3_bulkActions(),
      () => this.scenario4_advancedFiltering(),
      () => this.scenario5_activityLogs(),
      () => this.scenario6_searchAndExport(),
      () => this.scenario7_notifications(),
      () => this.scenario8_darkMode(),
    ];

    for (const scenario of scenarios) {
      scenario();
      await this.delay(1500);
    }

    // Final summary
    log('━'.repeat(60), 'green');
    log('🎉 ALL SCENARIOS COMPLETED!', 'green');
    log('━'.repeat(60), 'green');
    console.log('');
    
    const finalStats = this.calculateStats();
    logBox('📊 Final Dashboard State', [
      `Total Users: ${finalStats.users.total}`,
      `Active Stores: ${finalStats.stores.approved}`,
      `Pending Stores: ${finalStats.stores.pending}`,
      `Activity Logs: ${this.activityLogs.length}`,
    ]);
    
    console.log('');
    log('💡 Run again: node demo-simulation.js', 'cyan');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ─── Main ─────────────────────────────────────────
const demo = new AdminDashboardDemo();

demo.runAllScenarios().catch(console.error);

// Handle exit
process.on('SIGINT', () => {
  console.log('\n');
  log('👋 Demo terminated by user', 'yellow');
  process.exit(0);
});
