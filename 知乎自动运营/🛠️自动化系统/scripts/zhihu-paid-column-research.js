#!/usr/bin/env node

/**
 * 知乎付费专栏市场调研脚本
 * 访问知乎付费专栏页面，分析现有产品的定价策略、内容结构、热度
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置
const COOKIE_FILE = path.join(__dirname, '../../auth/zhihu-cookies-latest.json');
const OUTPUT_DIR = path.join(__dirname, '../../reports');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * 加载 Cookie
 */
function loadCookies() {
    try {
        const data = fs.readFileSync(COOKIE_FILE, 'utf8');
        const cookies = JSON.parse(data);
        console.log(`✅ 加载 Cookie: ${cookies.length} 个`);
        return cookies;
    } catch (error) {
        console.error('❌ 加载 Cookie 失败:', error.message);
        return [];
    }
}

/**
 * 访问知乎付费专栏首页
 */
async function browsePaidColumns(page) {
    console.log('🔍 访问知乎付费专栏首页...');

    const url = 'https://www.zhihu.com/special/all';
    await page.goto(url, { waitUntil: 'networkidle' });

    // 等待页面加载
    await page.waitForTimeout(3000);

    console.log('✅ 页面加载完成');

    // 截图
    const screenshotPath = path.join(OUTPUT_DIR, 'zhihu-paid-columns-home.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截图已保存: ${screenshotPath}`);

    return url;
}

/**
 * 获取付费专栏列表数据
 */
async function getPaidColumnList(page) {
    console.log('📊 分析付费专栏列表...');

    // 获取页面内容
    const content = await page.evaluate(() => {
        const columns = [];

        // 尝试多种选择器
        const selectors = [
            '.ContentItem-title',
            '.List-item .ContentItem',
            '.HotItem-title',
            '[data-zop-feedlist]',
            '.SpecialList-item'
        ];

        for (const selector of selectors) {
            const items = document.querySelectorAll(selector);
            if (items.length > 0) {
                console.log(`找到 ${items.length} 个专栏项目 (选择器: ${selector})`);

                items.forEach((item, index) => {
                    const title = item.querySelector('h2, .ContentItem-title, .HotItem-title')?.textContent?.trim() || '';
                    const link = item.querySelector('a')?.href || '';
                    const desc = item.querySelector('.RichContent, .ContentItem-excerpt, .HotItem-excerpt')?.textContent?.trim() || '';
                    const author = item.querySelector('.AuthorInfo-name')?.textContent?.trim() || '';
                    const meta = item.querySelector('.ContentItem-meta, .HotItem-meta')?.textContent?.trim() || '';

                    if (title && link) {
                        columns.push({
                            rank: index + 1,
                            title,
                            link,
                            description: desc.substring(0, 100),
                            author,
                            metadata: meta.substring(0, 50)
                        });
                    }
                });

                if (columns.length > 0) break;
            }
        }

        return columns;
    });

    console.log(`📊 找到 ${content.length} 个付费专栏`);

    return content;
}

/**
 * 分析页面结构
 */
async function analyzePageStructure(page) {
    console.log('🔬 分析页面结构...');

    const structure = await page.evaluate(() => {
        const info = {
            title: document.title,
            url: window.location.href,
            bodyText: document.body?.textContent?.substring(0, 500) || '',
            linksCount: document.querySelectorAll('a').length,
            imagesCount: document.querySelectorAll('img').length,
            mainSelectors: [],
            potentialColumnSelectors: []
        };

        // 检测主要选择器
        const potentialSelectors = [
            '.ContentItem',
            '.List-item',
            '.SpecialList-item',
            '.HotItem',
            '.Card'
        ];

        potentialSelectors.forEach(selector => {
            const count = document.querySelectorAll(selector).length;
            if (count > 0) {
                info.potentialColumnSelectors.push({
                    selector,
                    count
                });
            }
        });

        return info;
    });

    console.log('📄 页面结构:');
    console.log(`   标题: ${structure.title}`);
    console.log(`   链接数: ${structure.linksCount}`);
    console.log(`   图片数: ${structure.imagesCount}`);
    console.log(`   潜在专栏选择器: ${structure.potentialColumnSelectors.length}`);

    return structure;
}

/**
 * 保存分析报告
 */
async function saveReport(data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(OUTPUT_DIR, `zhihu-paid-column-research-${timestamp}.json`);

    fs.writeFileSync(reportPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ 分析报告已保存: ${reportPath}`);

    return reportPath;
}

/**
 * 主函数
 */
async function main() {
    console.log('========================================');
    console.log('知乎付费专栏市场调研');
    console.log('========================================');

    // 加载 Cookie
    const cookies = loadCookies();

    // 启动浏览器
    const browser = await chromium.launch({
        headless: false  // 使用有头模式以便观察
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });

    // 注入 Cookie
    if (cookies.length > 0) {
        await context.addCookies(cookies);
    }

    const page = await context.newPage();

    try {
        // 访问付费专栏页面
        await browsePaidColumns(page);

        // 分析页面结构
        const structure = await analyzePageStructure(page);

        // 获取专栏列表
        const columnList = await getPaidColumnList(page);

        // 保存报告
        const reportData = {
            timestamp: new Date().toISOString(),
            structure,
            columnList,
            summary: {
                totalColumns: columnList.length,
                topColumns: columnList.slice(0, 5)
            }
        };

        const reportPath = await saveReport(reportData);

        console.log('========================================');
        console.log('✅ 调研完成');
        console.log(`📊 专栏数量: ${columnList.length}`);
        console.log(`📄 报告: ${reportPath}`);
        console.log('========================================');

        // 保持浏览器打开 30 秒，方便观察
        console.log('⏰ 浏览器将保持打开 30 秒...');
        await page.waitForTimeout(30000);

    } catch (error) {
        console.error('❌ 调研失败:', error);
    } finally {
        await browser.close();
    }
}

// 运行
main();
