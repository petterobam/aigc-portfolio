#!/usr/bin/env node

/**
 * 清理重复记忆脚本
 * 策略 A：保留最新，归档历史
 */

const sqlite3 = require('sqlite3').verbose();
const { DB_CONFIG } = require('./config');

// 数据库连接
const db = new sqlite3.Database(DB_CONFIG.dbPath);

/**
 * 归档记忆
 * @param {number} id - 记忆 ID
 * @returns {Promise<void>}
 */
function archiveMemory(id) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE metadata SET category = "archived" WHERE id = ?',
      [id],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

/**
 * 执行清理操作
 */
async function cleanup() {
  console.log('============================================================');
  console.log('  清理重复记忆 - 策略 A：保留最新，归档历史');
  console.log('============================================================');

  try {
    // 策略 A：保留最新，归档历史
    const cleanupPlan = {
      '2026-03-24 系列': {
        keep: [76], // 保留 ID 76 (23:16)
        archive: [84, 83, 82, 81, 80, 79] // 归档其他
      },
      '2026-03-25 系列': {
        keep: [49], // 保留 ID 49 (16:30)
        archive: [74, 73, 71, 51] // 归档其他
      }
    };

    console.log('\n📋 清理计划:');
    console.log(`  - 2026-03-24 系列: 保留 1 条 (ID 76), 归档 6 条 (ID 84, 83, 82, 81, 80, 79)`);
    console.log(`  - 2026-03-25 系列: 保留 1 条 (ID 49), 归档 4 条 (ID 74, 73, 71, 51)`);
    console.log(`  - 总计: 保留 2 条, 归档 10 条\n`);

    // 执行归档操作
    let archivedCount = 0;
    for (const series in cleanupPlan) {
      const plan = cleanupPlan[series];
      for (const id of plan.archive) {
        try {
          await archiveMemory(id);
          console.log(`✅ 已归档 ID ${id} (${series})`);
          archivedCount++;
        } catch (err) {
          console.error(`❌ 归档 ID ${id} 失败:`, err.message);
        }
      }
    }

    console.log('\n============================================================');
    console.log('  清理完成');
    console.log('============================================================');
    console.log(`\n📊 清理统计:`);
    console.log(`  - 总归档数: ${archivedCount}`);
    console.log(`  - 预期记忆库规模: 85 → 75 (减少 10 条, 11.8%)`);
    console.log(`  - 预期重复率: 38.8% → ~26.7%`);

  } catch (err) {
    console.error('\n❌ 清理失败:', err);
    process.exit(1);
  } finally {
    db.close();
  }
}

// 执行清理
cleanup();
