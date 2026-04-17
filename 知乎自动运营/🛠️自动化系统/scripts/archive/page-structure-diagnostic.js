const { chromium } = require("playwright");

(async () => {
  console.log("=== Starting Zhihu Page Structure Diagnosis ===");

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Go to Zhihu creator center
    await page.goto("https://www.zhihu.com/creator");
    await page.waitForLoadState("networkidle");
    console.log("✅ Successfully loaded Zhihu creator page");

    // Take a screenshot to see current page structure
    const screenshotPath =
      "~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/reports/current-zhihu-creator-page.png";
    await page.screenshot({ path: screenshotPath });
    console.log("📸 Screenshot saved to:", screenshotPath);

    // Try to find title input fields using different selectors
    const selectors = [
      'input[placeholder*="标题"]',
      'input[placeholder*="请输入"]',
      'input[type="text"]',
      'textarea[placeholder*="标题"]',
      '[placeholder*="标题"] input',
      '[placeholder*="请输入"] input',
      ".Editor-title input",
      ".Post-title input",
      ".Question-title input",
      ".Publish-title input",
      'input[name*="title"]',
      'input[name*="Title"]',
      ".DraftEditor-root",
      ".ProseMirror",
      ".editor-title",
      ".title-input",
      '[data-testid="title-input"]',
      '[aria-label*="标题"]',
      ".ql-editor",
      ".text-input",
    ];

    console.log("\n=== Checking title input field selectors ===");
    const workingSelectors = [];

    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const isVisible = await element.isVisible();
          const isEditable = await element.isEditable();
          console.log(
            `✅ FOUND: ${selector} - Visible: ${isVisible}, Editable: ${isEditable}`,
          );
          workingSelectors.push({ selector, isVisible, isEditable });
        } else {
          console.log(`❌ NOT FOUND: ${selector}`);
        }
      } catch (error) {
        console.log(`❌ ERROR with ${selector}: ${error.message}`);
      }
    }

    // Check if we found any working selectors
    if (workingSelectors.length === 0) {
      console.log(
        "\n🚨 NO WORKING SELECTORS FOUND - Page structure has definitely changed",
      );

      // Let's examine the page source to understand the new structure
      const pageSource = await page.content();
      console.log("\n=== Analyzing page source for relevant patterns ===");

      const patterns = [
        /placeholder.*[标题titleTitle]/,
        /name.*[标题titleTitle]/,
        /class.*[标题titleTitle]/,
        /id.*[标题titleTitle]/,
        /data-testid.*[标题titleTitle]/,
        /aria-label.*[标题titleTitle]/,
      ];

      const foundPatterns = [];
      patterns.forEach((pattern) => {
        const matches = pageSource.match(pattern);
        if (matches) {
          console.log(`🔍 FOUND pattern: ${pattern}`);
          foundPatterns.push(pattern);
        }
      });

      // Look for iframe elements
      const iframeCount = await page.$$("iframe");
      console.log(`📋 Found ${iframeCount.length} iframes in the page`);

      if (iframeCount.length > 0) {
        console.log("🔍 Checking iframes for title input fields...");
        for (let i = 0; i < Math.min(iframeCount.length, 3); i++) {
          try {
            const iframe = await page.frames()[i];
            if (iframe) {
              const iframeSelectors = [
                'input[placeholder*="标题"]',
                'input[type="text"]',
                ".DraftEditor-root",
                ".ProseMirror",
              ];

              for (const selector of iframeSelectors) {
                try {
                  const element = await iframe.$(selector);
                  if (element) {
                    const isVisible = await element.isVisible();
                    console.log(
                      `✅ FOUND in iframe ${i}: ${selector} - Visible: ${isVisible}`,
                    );
                  }
                } catch (error) {
                  // Ignore iframe errors
                }
              }
            }
          } catch (error) {
            console.log(`❌ Error accessing iframe ${i}: ${error.message}`);
          }
        }
      }

      // Extract the complete page source for analysis
      const sourcePath =
        "~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/reports/zhihu-page-source.html";
      require("fs").writeFileSync(sourcePath, pageSource);
      console.log(`📄 Complete page source saved to: ${sourcePath}`);
    } else {
      console.log("\n✅ WORKING SELECTORS FOUND:");
      workingSelectors.forEach(({ selector, isVisible, isEditable }) => {
        console.log(
          `  - ${selector} (Visible: ${isVisible}, Editable: ${isEditable})`,
        );
      });

      // Test the first working selector
      const bestSelector =
        workingSelectors.find((s) => s.isVisible && s.isEditable) ||
        workingSelectors[0];
      if (bestSelector) {
        const element = await page.$(bestSelector.selector);
        const value = await element.inputValue();
        console.log(`\n🧪 Testing selector "${bestSelector.selector}":`);
        console.log(`  - Current value: "${value}"`);
        console.log(`  - Is visible: ${bestSelector.isVisible}`);
        console.log(`  - Is editable: ${bestSelector.isEditable}`);
      }
    }

    // Save the findings to a report file
    const report = {
      timestamp: new Date().toISOString(),
      workingSelectors: workingSelectors,
      recommendations:
        workingSelectors.length > 0
          ? "Update automation scripts with the working selectors"
          : "Complete page structure rebuild required",
      nextSteps:
        workingSelectors.length > 0
          ? "Update batch publish script with new selectors"
          : "Manual analysis and selector reconstruction needed",
    };

    const reportPath =
      "~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/reports/page-structure-diagnosis.json";
    require("fs").writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📊 Diagnosis report saved to: ${reportPath}`);
  } catch (error) {
    console.error("❌ Error during diagnosis:", error);
  } finally {
    await browser.close();
    console.log("\n=== Diagnosis completed ===");
  }
})();
