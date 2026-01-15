/**
 * Web Scraping Service - Core
 * Provides flexible web scraping capabilities for NxForge modules
 *
 * Features:
 * - Browser instance pooling and reuse
 * - Multiple authentication strategies (none, basic, form, cookie)
 * - Multi-step navigation and interaction
 * - Value extraction using CSS selectors and regex patterns
 * - Screenshot capture on errors
 * - Configurable timeouts and retries
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ScrapingStep {
  action: 'navigate' | 'click' | 'type' | 'wait' | 'select';
  url?: string;
  selector?: string;
  value?: string;
  milliseconds?: number;
}

export interface ScrapingConfig {
  steps: ScrapingStep[];
  valueSelector: string;
  valuePattern?: string; // Regex pattern to extract number from text
  additionalSelectors?: {
    [key: string]: { selector: string; pattern?: string };
  };
}

export interface AuthConfig {
  type: 'none' | 'basic' | 'form' | 'cookie';
  username?: string;
  password?: string;
  loginUrl?: string;
  usernameField?: string;
  passwordField?: string;
  submitButton?: string;
  cookies?: Array<{ name: string; value: string; domain?: string }>;
}

export interface ScrapingOptions {
  timeout?: number;
  screenshotOnError?: boolean;
  viewport?: { width: number; height: number };
  userAgent?: string;
}

export interface ScrapingResult {
  success: boolean;
  value: number | null;
  additionalData?: Record<string, number | null>;
  rawHtml?: string;
  error?: string;
  screenshot?: Buffer;
  duration?: number;
}

// ============================================================================
// Browser Pool Manager
// ============================================================================

class BrowserPool {
  private browsers: Browser[] = [];
  private maxBrowsers: number = 5;
  private browserIndex: number = 0;

  async getBrowser(): Promise<Browser> {
    // Return existing browser in round-robin fashion if available
    if (this.browsers.length > 0) {
      const browser = this.browsers[this.browserIndex];
      this.browserIndex = (this.browserIndex + 1) % this.browsers.length;

      // Check if browser is still connected
      if (browser.isConnected()) {
        return browser;
      } else {
        // Remove disconnected browser
        this.browsers.splice(this.browserIndex, 1);
        this.browserIndex = 0;
      }
    }

    // Create new browser if under limit
    if (this.browsers.length < this.maxBrowsers) {
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
        ],
      });
      this.browsers.push(browser);
      return browser;
    }

    // If at max, return first available
    return this.browsers[0];
  }

  async closeAll(): Promise<void> {
    await Promise.all(this.browsers.map(browser =>
      browser.close().catch(() => {})
    ));
    this.browsers = [];
    this.browserIndex = 0;
  }

  getActiveCount(): number {
    return this.browsers.filter(b => b.isConnected()).length;
  }
}

// Global browser pool instance
const browserPool = new BrowserPool();

// ============================================================================
// Scraping Service
// ============================================================================

export class ScrapingService {
  /**
   * Main scraping method with full configuration support
   */
  static async scrape(
    url: string,
    authConfig: AuthConfig | null,
    scrapingConfig: ScrapingConfig,
    options: ScrapingOptions = {}
  ): Promise<ScrapingResult> {
    const startTime = Date.now();
    const {
      timeout = 30000,
      screenshotOnError = false,
      viewport = { width: 1280, height: 720 },
      userAgent,
    } = options;

    let page: Page | null = null;

    try {
      const browser = await browserPool.getBrowser();
      page = await browser.newPage();

      // Configure page
      await page.setViewport(viewport);
      page.setDefaultTimeout(timeout);

      if (userAgent) {
        await page.setUserAgent(userAgent);
      }

      // Construct base URL
      const baseUrl = url.startsWith('http') ? url : `http://${url}`;

      // Handle authentication
      await this.authenticate(page, baseUrl, authConfig);

      // Execute scraping steps
      for (const step of scrapingConfig.steps) {
        await this.executeStep(page, baseUrl, step);
      }

      // Extract values
      const html = await page.content();
      const value = this.extractValue(
        html,
        scrapingConfig.valueSelector,
        scrapingConfig.valuePattern
      );

      // Extract additional values if configured
      const additionalData: Record<string, number | null> = {};
      if (scrapingConfig.additionalSelectors) {
        for (const [key, config] of Object.entries(scrapingConfig.additionalSelectors)) {
          additionalData[key] = this.extractValue(
            html,
            config.selector,
            config.pattern
          );
        }
      }

      await page.close();

      return {
        success: true,
        value,
        additionalData: Object.keys(additionalData).length > 0 ? additionalData : undefined,
        rawHtml: html.substring(0, 5000), // Store first 5KB for debugging
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      const result: ScrapingResult = {
        success: false,
        value: null,
        error: error.message,
        duration: Date.now() - startTime,
      };

      // Capture screenshot on error if requested
      if (screenshotOnError && page) {
        try {
          result.screenshot = await page.screenshot({ type: 'png', fullPage: true });
        } catch (screenshotError) {
          // Ignore screenshot errors
        }
      }

      if (page) {
        await page.close().catch(() => {});
      }

      return result;
    }
  }

  /**
   * Simplified scrape method for basic use cases
   */
  static async scrapeSimple(
    url: string,
    selector: string,
    pattern?: string
  ): Promise<number | null> {
    const result = await this.scrape(
      url,
      null,
      {
        steps: [],
        valueSelector: selector,
        valuePattern: pattern,
      }
    );
    return result.value;
  }

  /**
   * Handle authentication based on config
   */
  private static async authenticate(
    page: Page,
    baseUrl: string,
    authConfig: AuthConfig | null
  ): Promise<void> {
    if (!authConfig || authConfig.type === 'none') {
      await page.goto(baseUrl, { waitUntil: 'networkidle2' });
      return;
    }

    switch (authConfig.type) {
      case 'basic':
        await page.authenticate({
          username: authConfig.username || '',
          password: authConfig.password || '',
        });
        await page.goto(baseUrl, { waitUntil: 'networkidle2' });
        break;

      case 'form':
        const loginUrl = authConfig.loginUrl
          ? `${baseUrl}${authConfig.loginUrl}`
          : baseUrl;
        await page.goto(loginUrl, { waitUntil: 'networkidle2' });

        if (authConfig.usernameField && authConfig.username) {
          await page.type(authConfig.usernameField, authConfig.username);
        }
        if (authConfig.passwordField && authConfig.password) {
          await page.type(authConfig.passwordField, authConfig.password);
        }

        if (authConfig.submitButton) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click(authConfig.submitButton),
          ]);
        } else {
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.keyboard.press('Enter'),
          ]);
        }
        break;

      case 'cookie':
        if (authConfig.cookies) {
          await page.setCookie(...authConfig.cookies);
        }
        await page.goto(baseUrl, { waitUntil: 'networkidle2' });
        break;
    }
  }

  /**
   * Execute a single scraping step
   */
  private static async executeStep(
    page: Page,
    baseUrl: string,
    step: ScrapingStep
  ): Promise<void> {
    switch (step.action) {
      case 'navigate':
        if (step.url) {
          const url = step.url.startsWith('http') ? step.url : `${baseUrl}${step.url}`;
          await page.goto(url, { waitUntil: 'networkidle2' });
        }
        break;

      case 'click':
        if (step.selector) {
          await page.waitForSelector(step.selector, { timeout: 10000 });
          await page.click(step.selector);
          await page.waitForTimeout(1000);
        }
        break;

      case 'type':
        if (step.selector && step.value) {
          await page.waitForSelector(step.selector, { timeout: 10000 });
          await page.type(step.selector, step.value);
        }
        break;

      case 'wait':
        if (step.milliseconds) {
          await page.waitForTimeout(step.milliseconds);
        } else if (step.selector) {
          await page.waitForSelector(step.selector, { timeout: 10000 });
        }
        break;

      case 'select':
        if (step.selector && step.value) {
          await page.waitForSelector(step.selector, { timeout: 10000 });
          await page.select(step.selector, step.value);
          await page.waitForTimeout(500);
        }
        break;

      default:
        throw new Error(`Unknown step action: ${(step as any).action}`);
    }
  }

  /**
   * Extract numeric value from HTML using selector and optional regex pattern
   */
  private static extractValue(
    html: string,
    selector: string,
    pattern?: string
  ): number | null {
    const $ = cheerio.load(html);
    const element = $(selector);

    if (element.length === 0) {
      return null;
    }

    const text = element.text().trim();

    if (pattern) {
      const regex = new RegExp(pattern);
      const match = text.match(regex);
      if (match && match[1]) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        return isNaN(value) ? null : value;
      }
      return null;
    } else {
      // Try to parse the entire text as a number
      const cleaned = text.replace(/[^\d.-]/g, '');
      const value = parseFloat(cleaned);
      return isNaN(value) ? null : value;
    }
  }

  /**
   * Extract text from HTML using selector
   */
  static extractText(html: string, selector: string): string | null {
    const $ = cheerio.load(html);
    const element = $(selector);
    return element.length > 0 ? element.text().trim() : null;
  }

  /**
   * Extract number from text using pattern
   */
  static extractNumber(text: string, pattern?: string): number | null {
    if (pattern) {
      const regex = new RegExp(pattern);
      const match = text.match(regex);
      if (match && match[1]) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        return isNaN(value) ? null : value;
      }
      return null;
    } else {
      const cleaned = text.replace(/[^\d.-]/g, '');
      const value = parseFloat(cleaned);
      return isNaN(value) ? null : value;
    }
  }

  /**
   * Create a new browser instance (for custom use cases)
   */
  static async createBrowser(): Promise<Browser> {
    return browserPool.getBrowser();
  }

  /**
   * Close all browser instances (cleanup)
   */
  static async closeAllBrowsers(): Promise<void> {
    await browserPool.closeAll();
  }

  /**
   * Get browser pool statistics
   */
  static getBrowserPoolStats() {
    return {
      activeBrowsers: browserPool.getActiveCount(),
    };
  }
}

// Export singleton instance for convenience
export const scrapingService = new ScrapingService();
