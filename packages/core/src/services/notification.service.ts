/**
 * Notification Service - Core
 * Provides email, webhook, and Slack notification capabilities
 *
 * Features:
 * - Email notifications via SMTP
 * - Webhook notifications (HTTP POST/GET)
 * - Slack notifications via webhook
 * - Multi-channel broadcasting
 * - Connection verification
 */

import nodemailer, { Transporter } from 'nodemailer';
import { HttpService } from './http.service';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface EmailConfig {
  host: string;
  port: number;
  secure?: boolean; // true for 465, false for other ports
  auth: {
    user: string;
    pass: string;
  };
  from?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface WebhookOptions {
  url: string;
  payload: any;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  timeout?: number;
}

export interface SlackOptions {
  webhookUrl: string;
  text: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
  attachments?: Array<{
    color?: string;
    title?: string;
    text?: string;
    fields?: Array<{ title: string; value: string; short?: boolean }>;
  }>;
}

export interface NotificationChannel {
  email?: EmailOptions;
  webhook?: WebhookOptions;
  slack?: SlackOptions;
}

// ============================================================================
// Notification Service
// ============================================================================

export class NotificationService {
  private static emailTransporter: Transporter | null = null;
  private static emailConfig: EmailConfig | null = null;
  private static emailConfigured = false;

  /**
   * Configure email service
   */
  static configureEmail(config: EmailConfig): void {
    try {
      this.emailTransporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure ?? config.port === 465,
        auth: config.auth,
      });

      this.emailConfig = config;
      this.emailConfigured = true;
    } catch (error: any) {
      throw new Error(`Failed to configure email: ${error.message}`);
    }
  }

  /**
   * Configure email from environment variables
   */
  static configureEmailFromEnv(): void {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM;

    if (!host || !port || !user || !pass) {
      throw new Error('Missing required SMTP environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)');
    }

    this.configureEmail({
      host,
      port: parseInt(port, 10),
      auth: { user, pass },
      from,
    });
  }

  /**
   * Send email notification
   */
  static async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.emailConfigured || !this.emailTransporter) {
      throw new Error('Email not configured. Call configureEmail() or configureEmailFromEnv() first.');
    }

    const { to, subject, body, html, attachments } = options;

    try {
      const mailOptions = {
        from: this.emailConfig?.from || 'noreply@nxforge.local',
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        text: body,
        html: html || body,
        attachments,
      };

      await this.emailTransporter.sendMail(mailOptions);
    } catch (error: any) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send webhook notification
   */
  static async sendWebhook(options: WebhookOptions): Promise<void> {
    const { url, payload, method = 'POST', headers = {}, timeout = 30000 } = options;

    try {
      await HttpService.request(method, url, {
        data: method !== 'GET' ? payload : undefined,
        params: method === 'GET' ? payload : undefined,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NxForge/5.0',
          ...headers,
        },
        timeout,
        retries: 1,
      });
    } catch (error: any) {
      const errorMessage = error.response
        ? `Webhook failed with status ${error.response.status}: ${error.response.statusText}`
        : `Webhook failed: ${error.message}`;

      throw new Error(errorMessage);
    }
  }

  /**
   * Send Slack notification
   */
  static async sendSlack(options: SlackOptions): Promise<void> {
    const { webhookUrl, text, channel, username, iconEmoji, attachments } = options;

    const payload: any = {
      text,
    };

    if (channel) payload.channel = channel;
    if (username) payload.username = username;
    if (iconEmoji) payload.icon_emoji = iconEmoji;
    if (attachments) payload.attachments = attachments;

    try {
      await HttpService.post(webhookUrl, payload, {
        httpConfig: {
          timeout: 10000,
          retries: 2,
        },
      });
    } catch (error: any) {
      throw new Error(`Failed to send Slack notification: ${error.message}`);
    }
  }

  /**
   * Send notification to multiple channels
   */
  static async sendMulti(channels: NotificationChannel): Promise<void> {
    const promises: Promise<void>[] = [];

    if (channels.email) {
      promises.push(this.sendEmail(channels.email));
    }

    if (channels.webhook) {
      promises.push(this.sendWebhook(channels.webhook));
    }

    if (channels.slack) {
      promises.push(this.sendSlack(channels.slack));
    }

    await Promise.all(promises);
  }

  /**
   * Verify email connection
   */
  static async verifyEmailConnection(): Promise<boolean> {
    if (!this.emailTransporter) {
      return false;
    }

    try {
      await this.emailTransporter.verify();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if email is configured
   */
  static isEmailConfigured(): boolean {
    return this.emailConfigured;
  }

  /**
   * Get email configuration status
   */
  static getEmailConfig(): { configured: boolean; host?: string; port?: number; from?: string } {
    return {
      configured: this.emailConfigured,
      host: this.emailConfig?.host,
      port: this.emailConfig?.port,
      from: this.emailConfig?.from,
    };
  }

  /**
   * Send alert notification (pre-formatted)
   */
  static async sendAlert(options: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    channels: NotificationChannel;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const { title, message, severity, channels, metadata } = options;

    // Format email if configured
    if (channels.email) {
      const emailHtml = `
        <h2 style="color: ${this.getSeverityColor(severity)};">${title}</h2>
        <p><strong>Severity:</strong> ${severity.toUpperCase()}</p>
        <p>${message}</p>
        ${metadata ? `<hr><pre>${JSON.stringify(metadata, null, 2)}</pre>` : ''}
      `;

      await this.sendEmail({
        ...channels.email,
        subject: `[${severity.toUpperCase()}] ${title}`,
        body: `${title}\n\nSeverity: ${severity}\n\n${message}`,
        html: emailHtml,
      });
    }

    // Format Slack if configured
    if (channels.slack) {
      const color = this.getSeverityColor(severity);
      const attachment = {
        color,
        title,
        text: message,
        fields: metadata
          ? Object.entries(metadata).map(([key, value]) => ({
              title: key,
              value: String(value),
              short: true,
            }))
          : undefined,
      };

      await this.sendSlack({
        ...channels.slack,
        text: `*[${severity.toUpperCase()}]* ${title}`,
        attachments: [attachment],
      });
    }

    // Send webhook if configured
    if (channels.webhook) {
      await this.sendWebhook({
        ...channels.webhook,
        payload: {
          title,
          message,
          severity,
          metadata,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Get color for severity level
   */
  private static getSeverityColor(severity: string): string {
    const colors = {
      info: '#2196F3',
      warning: '#FF9800',
      error: '#F44336',
      critical: '#9C27B0',
    };
    return colors[severity as keyof typeof colors] || colors.info;
  }

  /**
   * Reset configuration (useful for testing)
   */
  static reset(): void {
    this.emailTransporter = null;
    this.emailConfig = null;
    this.emailConfigured = false;
  }
}
