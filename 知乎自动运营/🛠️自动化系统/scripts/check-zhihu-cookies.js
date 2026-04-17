#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const COOKIE_FILE = path.join(__dirname, '../auth/zhihu-cookies-latest.json');

console.log('🔍 检查知乎 Cookie 文件...\n');

if (!fs.existsSync(COOKIE_FILE)) {
  console.log('❌ Cookie 文件不存在');
  console.log('   Cookie 文件路径:', COOKIE_FILE);
  console.log('   需要运行登录脚本: node zhihu-auto-operations.js login\n');
  process.exit(1);
}

try {
  const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf8'));
  console.log('✅ Cookie 文件存在');
  console.log(`   Cookie 数量: ${cookies.length}`);
  console.log(`   文件大小: ${(fs.statSync(COOKIE_FILE).size / 1024).toFixed(2)} KB`);
  console.log(`   文件路径: ${COOKIE_FILE}`);

  // 检查关键 Cookie
  const keyCookies = cookies.filter(c =>
    c.name === 'z_c0' ||
    c.name === 'd_c0' ||
    c.name.includes('cap')
  );

  if (keyCookies.length > 0) {
    console.log(`   \n🔑 关键 Cookie:`);
    keyCookies.forEach(cookie => {
      console.log(`      - ${cookie.name}: ${cookie.value ? '存在' : '缺失'}`);
    });
  }

  // 检查 Cookie 过期时间
  const expiredCookies = cookies.filter(c => c.expires && c.expires * 1000 < Date.now());
  if (expiredCookies.length > 0) {
    console.log(`   \n⚠️  警告: ${expiredCookies.length} 个 Cookie 已过期`);
  }

  console.log('\n如果需要重新登录，请删除 Cookie 文件后重新运行脚本:');
  console.log('  rm', COOKIE_FILE);
  console.log('  node', path.join(__dirname, 'zhihu-auto-operations.js'), 'login\n');

  process.exit(0);
} catch (error) {
  console.log('❌ 读取 Cookie 文件失败:', error.message);
  console.log('   请检查文件格式或重新登录\n');
  process.exit(1);
}
