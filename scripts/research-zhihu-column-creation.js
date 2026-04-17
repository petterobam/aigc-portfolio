/**
 * 知乎专栏创建流程研究脚本
 * 目的：研究知乎专栏的创建流程、定价机制、功能限制
 */

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const os = require("os");

// 配置
const COOKIE_FILE = path.join(os.homedir(), ".openclaw/workspace/知乎自动运营/🛠️自动化系统/auth/zhihu-cookies-latest.json");
const OUTPUT_DIR = path.join(os.homedir(), ".openclaw/workspace/知乎自动运营/🛠️自动化系统/reports");

// 加载 Cookie
async function loadCookies() {
  try {
    const cookieData = fs.readFileSync(COOKIE_FILE, "utf8");
    const cookies = JSON.parse(cookieData);
    return cookies;
  } catch (error) {
    console.error("❌ 加载 Cookie 失败:", error.message);
    return [];
  }
}

async function main() {
  console.log("🌐 启动浏览器...");

  // 使用临时用户数据目录
  const browser = await chromium.launch({
    headless: false,
    viewport: { width: 1920, height: 1080 },
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  try {
    // 加载并设置 Cookie
    console.log("🍪 加载知乎 Cookie...");
    const cookies = await loadCookies();
    await context.addCookies(cookies);
    console.log(`✅ 已加载 ${cookies.length} 个 Cookie`);

    console.log("📖 导航到知乎创作中心...");
    const page = await context.newPage();
    await page.goto("https://www.zhihu.com/creator", {
      waitUntil: "networkidle",
    });

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 检查登录状态
    const isLoggedIn = await page.evaluate(() => {
      return document.querySelector(".SignButton") === null;
    });

    if (!isLoggedIn) {
      console.log("❌ Cookie 可能已失效，未登录知乎账号");
      console.log("⚠️ 建议重新提取 Cookie");
      await page.waitForTimeout(30000); // 等待30秒供观察
    } else {
      console.log("✅ 登录状态检查通过");
    }

    // 寻找专栏创建入口
    console.log("🔍 寻找专栏创建入口...");

    const columnButton = await page.evaluate(() => {
      // 尝试多种选择器（使用标准 CSS 选择器）
      const selectors = [
        'a[href*="column"]',
        'a[href*="专栏"]',
        ".CreatorHome-menuItem",
      ];

      for (const selector of selectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        for (const element of elements) {
          if (element.textContent.includes("专栏")) {
            return {
              text: element.textContent.trim(),
              href: element.href || element.getAttribute("href"),
              selector: selector,
            };
          }
        }
      }
      return null;
    });

    console.log("📊 专栏入口信息:", JSON.stringify(columnButton, null, 2));

    // 如果找到专栏入口，点击进入
    if (columnButton && columnButton.href) {
      console.log("🚀 导航到专栏页面...");
      await page.goto(columnButton.href, { waitUntil: "networkidle" });
      await page.waitForTimeout(3000);

      // 截图保存
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const screenshotPath = path.join(
        OUTPUT_DIR,
        `zhihu-column-${timestamp}.png`,
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 截图已保存: ${screenshotPath}`);

      // 提取页面信息
      const pageInfo = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          // 查找创建专栏按钮
          createButton: (() => {
            const buttons = Array.from(document.querySelectorAll("button, a"));
            for (const btn of buttons) {
              const text = btn.textContent.trim();
              if (
                text.includes("创建") ||
                text.includes("新建") ||
                text.includes("写专栏")
              ) {
                return {
                  text: text,
                  visible: btn.offsetParent !== null,
                };
              }
            }
            return null;
          })(),
          // 查找现有专栏列表
          existingColumns: Array.from(
            document.querySelectorAll(
              '.ColumnCard, .ColumnItem, [class*="column"], .ContentItem-title',
            ),
          )
            .slice(0, 10)
            .map((el) => ({
              title:
                el
                  .querySelector('h2, h3, .title, [class*="title"]')
                  ?.textContent.trim() || "",
              url: el.querySelector("a")?.href || "",
            }))
            .filter((col) => col.title),
          // 提取页面文本内容
          pageText: document.body.innerText.slice(0, 1000),
        };
      });

      console.log("📋 页面信息:", JSON.stringify(pageInfo, null, 2));

      // 保存页面信息
      const reportPath = path.join(
        OUTPUT_DIR,
        `zhihu-column-research-${timestamp}.json`,
      );
      fs.writeFileSync(reportPath, JSON.stringify(pageInfo, null, 2), "utf8");
      console.log(`📄 报告已保存: ${reportPath}`);
    } else {
      console.log("⚠️ 未找到专栏入口，可能需要权限或账号未开通专栏功能");
    }

    // 保持浏览器打开30秒供观察
    console.log("⏳ 浏览器将保持打开30秒供观察...");
    await page.waitForTimeout(30000);
  } catch (error) {
    console.error("❌ 发生错误:", error.message);
    console.error("堆栈:", error.stack);
  } finally {
    await browser.close();
    console.log("✅ 浏览器已关闭");
  }
}

main();
