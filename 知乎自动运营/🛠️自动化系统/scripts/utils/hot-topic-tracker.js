#!/usr/bin/env node

/**
 * 知乎热点追踪脚本
 *
 * 功能：
 * 1. 追踪知乎热榜技术话题（需要Cookie）
 * 2. 追踪AI技术领域热点（arXiv、GitHub Trending、Hacker News等）
 * 3. 生成热点报告，用于选题参考
 * 4. 保存热点数据，支持历史分析
 *
 * 作者: 知乎技术分享与知识付费运营 AI
 * 创建时间: 2026-03-28
 * 版本: v1.0
 */

const fs = require('fs').promises;
const path = require('path');
const { chromium } = require('playwright');
const Logger = require('./logger');

// 配置
const CONFIG = {
  // 数据保存目录
  dataDir: path.join(__dirname, '../../data'),
  // Cookie文件路径
  cookieFile: path.join(__dirname, '../../auth/zhihu-cookies.json'),
  // 报告输出目录
  reportDir: path.join(__dirname, '../../reports'),
  // 技术话题关键词
  techKeywords: [
    'AI', '人工智能', '大模型', 'LLM', 'GPT', 'Claude',
    'OpenClaw', 'Agent', 'RAG', '提示词', 'Prompt',
    'Transformer', 'Diffusion', '微调', 'LoRA',
    'Python', 'JavaScript', '前端', '后端',
    'Docker', 'Kubernetes', 'DevOps', 'CI/CD',
    '深度学习', '机器学习', '神经网络',
    '自然语言处理', 'NLP', '计算机视觉', 'CV'
  ]
};

// 主类
class HotTopicTracker {
  constructor() {
    this.logger = new Logger({
      logDir: path.join(__dirname, '../../logs'),
      consoleOutput: true,
      fileOutput: true
    });
    this.browser = null;
    this.context = null;
    this.topics = [];
  }

  /**
   * 初始化浏览器
   */
  async initBrowser() {
    try {
      this.logger.info('启动浏览器...');

      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });

      // 尝试加载Cookie
      await this.loadCookies();

      this.logger.info('浏览器启动成功');
      return true;
    } catch (error) {
      this.logger.error('浏览器启动失败:', error);
      return false;
    }
  }

  /**
   * 加载Cookie
   */
  async loadCookies() {
    try {
      const cookieContent = await fs.readFile(CONFIG.cookieFile, 'utf-8');
      const cookies = JSON.parse(cookieContent);
      await this.context.addCookies(cookies);
      this.logger.info(`已加载 ${cookies.length} 个Cookie`);
    } catch (error) {
      this.logger.warn('Cookie加载失败（可能首次运行）:', error.message);
    }
  }

  /**
   * 追踪知乎热榜
   */
  async trackZhihuHot() {
    try {
      this.logger.info('追踪知乎热榜...');

      const page = await this.context.newPage();
      await page.goto('https://www.zhihu.com/hot', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      // 等待内容加载
      await page.waitForTimeout(4000);

      // 检查是否跳转到登录页
      const currentUrl = page.url();
      if (currentUrl.includes('signin')) {
        this.logger.warn('知乎需要登录才能访问热榜');
        await page.close();
        return [];
      }

      // 提取热榜内容
      const hotItems = await page.evaluate(() => {
        const items = [];
        const hotList = document.querySelectorAll('.HotList-item');

        hotList.forEach((item, index) => {
          const titleEl = item.querySelector('.HotList-itemTitle');
          const contentEl = item.querySelector('.HotList-itemMeta');
          const excerptEl = item.querySelector('.HotList-itemExcerpt');

          if (titleEl) {
            items.push({
              rank: index + 1,
              title: titleEl.textContent.trim(),
              link: titleEl.href,
              excerpt: excerptEl ? excerptEl.textContent.trim() : '',
              heatValue: contentEl ? contentEl.textContent.trim() : ''
            });
          }
        });

        return items;
      });

      // 过滤技术话题
      const techTopics = hotItems.filter(item =>
        CONFIG.techKeywords.some(keyword =>
          item.title.includes(keyword) ||
          (item.excerpt && item.excerpt.includes(keyword))
        )
      );

      this.logger.info(`知乎热榜: 共 ${hotItems.length} 条, 技术相关 ${techTopics.length} 条`);
      await page.close();

      return {
        source: 'zhihu-hot',
        timestamp: new Date().toISOString(),
        total: hotItems.length,
        techTopics: techTopics.length,
        items: techTopics
      };
    } catch (error) {
      this.logger.error('追踪知乎热榜失败:', error);
      return [];
    }
  }

  /**
   * 追踪Hacker News
   */
  async trackHackerNews() {
    try {
      this.logger.info('追踪Hacker News...');

      const page = await this.context.newPage();
      await page.goto('https://news.ycombinator.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      // 等待页面加载
      await page.waitForTimeout(3000);

      // 提取热门故事
      const stories = await page.evaluate(() => {
        const items = [];
        const storyElements = document.querySelectorAll('.athing');

        storyElements.forEach((element, index) => {
          const titleEl = element.querySelector('.titleline > a');
          const scoreEl = element.nextElementSibling?.querySelector('.score');
          const commentEl = element.nextElementSibling?.querySelector('a[href*="item"]');

          if (titleEl) {
            items.push({
              rank: index + 1,
              title: titleEl.textContent.trim(),
              link: titleEl.href,
              score: scoreEl ? scoreEl.textContent.trim() : '0 points',
              comments: commentEl ? commentEl.textContent.trim() : '0 comments'
            });
          }
        });

        return items;
      });

      // 过滤技术话题
      const techTopics = stories.filter(item =>
        CONFIG.techKeywords.some(keyword =>
          item.title.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      this.logger.info(`Hacker News: 共 ${stories.length} 条, 技术相关 ${techTopics.length} 条`);
      await page.close();

      return {
        source: 'hackernews',
        timestamp: new Date().toISOString(),
        total: stories.length,
        techTopics: techTopics.length,
        items: techTopics
      };
    } catch (error) {
      this.logger.error('追踪Hacker News失败:', error);
      return [];
    }
  }

  /**
   * 追踪GitHub Trending
   */
  async trackGithubTrending() {
    try {
      this.logger.info('追踪GitHub Trending...');

      const page = await this.context.newPage();

      // 增加更多伪装，避免被检测
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      });

      await page.goto('https://github.com/trending', {
        waitUntil: 'domcontentloaded',
        timeout: 90000  // 增加到90秒
      });

      // 增加等待时间，让页面完全加载
      await page.waitForTimeout(5000);

      // 提取趋势仓库 - 使用更通用的选择器
      const repos = await page.evaluate(() => {
        const items = [];

        // 尝试多种选择器
        let repoElements = document.querySelectorAll('article.Box-row');

        // 如果找不到，尝试其他选择器
        if (repoElements.length === 0) {
          repoElements = document.querySelectorAll('[data-testid="repo-list-item"]');
        }

        if (repoElements.length === 0) {
          repoElements = document.querySelectorAll('li[data-hpc]');
        }

        repoElements.forEach(element => {
          // 尝试多种标题选择器
          let titleEl = element.querySelector('h2 a');
          if (!titleEl) {
            titleEl = element.querySelector('a[href^="/"]');
          }

          // 尝试多种描述选择器
          let descEl = element.querySelector('p');
          if (!descEl) {
            descEl = element.querySelector('[data-testid="repo-description"]');
          }

          // 尝试多种 star 选择器
          let starsEl = element.querySelector('a[href*="/stargazers"]');
          if (!starsEl) {
            starsEl = element.querySelector('[data-testid="repo-stars-count"]');
          }

          // 尝试多种 fork 选择器
          let forksEl = element.querySelector('a[href*="/forks"]');
          if (!forksEl) {
            forksEl = element.querySelector('[data-testid="repo-forks-count"]');
          }

          if (titleEl) {
            items.push({
              title: titleEl.textContent.trim(),
              link: 'https://github.com' + titleEl.getAttribute('href'),
              description: descEl ? descEl.textContent.trim() : '',
              stars: starsEl ? starsEl.textContent.trim() : '0',
              forks: forksEl ? forksEl.textContent.trim() : '0'
            });
          }
        });

        return items;
      });

      // 过滤AI相关仓库
      const aiRepos = repos.filter(repo =>
        CONFIG.techKeywords.some(keyword =>
          repo.title.toLowerCase().includes(keyword.toLowerCase()) ||
          (repo.description && repo.description.toLowerCase().includes(keyword.toLowerCase()))
        )
      );

      this.logger.info(`GitHub Trending: 共 ${repos.length} 条, AI相关 ${aiRepos.length} 条`);
      await page.close();

      return {
        source: 'github-trending',
        timestamp: new Date().toISOString(),
        total: repos.length,
        aiTopics: aiRepos.length,
        items: aiRepos
      };
    } catch (error) {
      this.logger.error('追踪GitHub Trending失败:', error);
      return [];
    }
  }

  /**
   * 追踪arXiv最新论文（AI方向）
   */
  async trackArxivPapers() {
    try {
      this.logger.info('追踪arXiv AI论文...');

      const page = await this.context.newPage();
      await page.goto('https://arxiv.org/list/cs.AI/recent', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      // 等待页面加载完成
      await page.waitForTimeout(3000);

      // 提取论文列表 - 修复选择器
      const papers = await page.evaluate(() => {
        const items = [];
        // 使用 dd 元素作为容器
        const paperElements = document.querySelectorAll('dd');

        paperElements.forEach((element, index) => {
          const titleEl = element.querySelector('.list-title');
          const authorsEl = element.querySelector('.list-authors');
          const abstractEl = element.querySelector('.list-abstract');

          // 查找对应的 dt 元素获取链接
          const dtElement = element.previousElementSibling;
          let link = '';
          if (dtElement) {
            const linkEl = dtElement.querySelector('a[href*="abs"]');
            if (linkEl) {
              link = linkEl.href;
            }
          }

          if (titleEl) {
            items.push({
              title: titleEl.textContent.replace('Title:', '').trim(),
              link: link,
              authors: authorsEl ? authorsEl.textContent.replace('Authors:', '').trim() : '',
              abstract: abstractEl ? abstractEl.textContent.substring(0, 200).trim() : '',
              rank: index + 1
            });
          }
        });

        return items.slice(0, 20); // 只取前20篇
      });

      this.logger.info(`arXiv AI论文: 共 ${papers.length} 篇`);
      await page.close();

      return {
        source: 'arxiv',
        timestamp: new Date().toISOString(),
        total: papers.length,
        items: papers
      };
    } catch (error) {
      this.logger.error('追踪arXiv论文失败:', error);
      return [];
    }
  }

  /**
   * 生成热点报告
   */
  async generateReport() {
    this.logger.info('生成热点报告...');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSources: this.topics.length,
        totalTopics: this.topics.reduce((sum, t) => sum + (t.items?.length || 0), 0)
      },
      sources: this.topics
    };

    // 保存报告
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(CONFIG.reportDir, `hot-topics-${timestamp}.json`);
    const latestReportFile = path.join(CONFIG.reportDir, 'hot-topics-latest.json');

    await fs.mkdir(CONFIG.reportDir, { recursive: true });
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    await fs.writeFile(latestReportFile, JSON.stringify(report, null, 2));

    this.logger.info(`报告已保存: ${reportFile}`);

    return report;
  }

  /**
   * 分析热点并生成选题建议
   */
  async analyzeTopics(report) {
    this.logger.info('分析热点并生成选题建议...');

    const suggestions = [];

    // 分析知乎技术话题
    const zhihuTech = report.sources.find(s => s.source === 'zhihu-hot');
    if (zhihuTech && zhihuTech.items.length > 0) {
      zhihuTech.items.forEach(item => {
        suggestions.push({
          source: '知乎热榜',
          topic: item.title,
          reason: '知乎热榜技术话题，热度高，适合追热点',
          suggestedType: '热点解读型',
          priority: 'high'
        });
      });
    }

    // 分析Hacker News
    const hnTech = report.sources.find(s => s.source === 'hackernews');
    if (hnTech && hnTech.items.length > 0) {
      hnTech.items.slice(0, 3).forEach(item => {
        suggestions.push({
          source: 'Hacker News',
          topic: item.title,
          reason: `Hacker News热门 (${item.score})，技术社区关注度高`,
          suggestedType: '深度分析型',
          priority: 'medium'
        });
      });
    }

    // 分析GitHub Trending
    const githubAI = report.sources.find(s => s.source === 'github-trending');
    if (githubAI && githubAI.items.length > 0) {
      githubAI.items.slice(0, 3).forEach(item => {
        suggestions.push({
          source: 'GitHub Trending',
          topic: item.title + ' - ' + item.description,
          reason: `GitHub热门AI项目 (${item.stars})，开发者关注度高`,
          suggestedType: '实战案例型',
          priority: 'medium'
        });
      });
    }

    // 分析arXiv论文
    const arxiv = report.sources.find(s => s.source === 'arxiv');
    if (arxiv && arxiv.items.length > 0) {
      arxiv.items.slice(0, 3).forEach(item => {
        suggestions.push({
          source: 'arXiv',
          topic: item.title,
          reason: 'arXiv最新AI论文，前沿技术，适合深度分析',
          suggestedType: '深度分析型',
          priority: 'low'
        });
      });
    }

    return suggestions;
  }

  /**
   * 关闭浏览器
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.logger.info('浏览器已关闭');
    }
  }

  /**
   * 主执行方法
   */
  async run() {
    try {
      this.logger.info('开始热点追踪...');

      // 初始化浏览器
      const success = await this.initBrowser();
      if (!success) {
        throw new Error('浏览器初始化失败');
      }

      // 追踪各个数据源
      // 知乎热榜（需要Cookie，可能失败）
      const zhihuResult = await this.trackZhihuHot();
      if (zhihuResult) {
        this.topics.push(zhihuResult);
      }

      // Hacker News（公开访问）
      const hnResult = await this.trackHackerNews();
      if (hnResult) {
        this.topics.push(hnResult);
      }

      // GitHub Trending（公开访问）
      const githubResult = await this.trackGithubTrending();
      if (githubResult) {
        this.topics.push(githubResult);
      }

      // arXiv论文（公开访问）
      const arxivResult = await this.trackArxivPapers();
      if (arxivResult) {
        this.topics.push(arxivResult);
      }

      // 生成报告
      const report = await this.generateReport();

      // 分析并生成选题建议
      const suggestions = await this.analyzeTopics(report);

      // 保存选题建议
      const suggestionsFile = path.join(CONFIG.reportDir, 'topic-suggestions-latest.json');
      await fs.writeFile(suggestionsFile, JSON.stringify(suggestions, null, 2));

      this.logger.info('热点追踪完成');
      this.logger.info(`共追踪 ${this.topics.length} 个数据源`);
      this.logger.info(`生成 ${suggestions.length} 个选题建议`);

      return {
        success: true,
        report,
        suggestions
      };
    } catch (error) {
      this.logger.error('热点追踪失败:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      await this.close();
    }
  }
}

// 主入口
async function main() {
  const tracker = new HotTopicTracker();
  const result = await tracker.run();

  if (result.success) {
    console.log('\n✅ 热点追踪成功！');
    console.log(`📊 共追踪 ${result.report.summary.totalSources} 个数据源`);
    console.log(`🎯 生成 ${result.suggestions.length} 个选题建议`);
    console.log(`\n📍 报告位置: ${CONFIG.reportDir}/hot-topics-latest.json`);
    console.log(`📝 选题建议: ${CONFIG.reportDir}/topic-suggestions-latest.json`);

    // 打印选题建议
    console.log('\n📌 选题建议:');
    result.suggestions.slice(0, 5).forEach((s, i) => {
      console.log(`${i + 1}. [${s.source}] ${s.topic}`);
      console.log(`   类型: ${s.suggestedType} | 优先级: ${s.priority}`);
      console.log(`   理由: ${s.reason}`);
      console.log('');
    });
  } else {
    console.error('\n❌ 热点追踪失败:', result.error);
    process.exit(1);
  }
}

// 运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = HotTopicTracker;
