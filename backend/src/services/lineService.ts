import { Client, ClientConfig, TextMessage, FlexMessage } from '@line/bot-sdk';
import prisma from '../lib/prisma';

export class LineService {
  private client: Client | null = null;
  private config: ClientConfig | null = null;

  async initialize() {
    try {
      const settings = await prisma.systemSetting.findUnique({
        where: { key: 'line_oa' },
      });

      if (!settings || !settings.value) {
        console.log('[LINE Service] LINE OA settings not found');
        return false;
      }

      const lineSettings = settings.value as any;

      if (!lineSettings.enabled || !lineSettings.channel_access_token || !lineSettings.channel_secret) {
        console.log('[LINE Service] LINE OA not enabled or missing credentials');
        return false;
      }

      this.config = {
        channelAccessToken: lineSettings.channel_access_token,
        channelSecret: lineSettings.channel_secret,
      };

      this.client = new Client(this.config);
      console.log('[LINE Service] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[LINE Service] Initialization error:', error);
      return false;
    }
  }

  async sendTextMessage(userId: string, message: string): Promise<boolean> {
    try {
      if (!this.client) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.error('[LINE Service] Cannot send message: service not initialized');
          return false;
        }
      }

      const textMessage: TextMessage = {
        type: 'text',
        text: message,
      };

      await this.client!.pushMessage(userId, textMessage);
      console.log(`[LINE Service] Message sent to ${userId}`);
      return true;
    } catch (error) {
      console.error('[LINE Service] Error sending text message:', error);
      return false;
    }
  }

  async sendShippingUpdateNotification(
    userId: string,
    orderNumber: string,
    status: string,
    trackingNumber?: string,
    currentLocation?: string
  ): Promise<boolean> {
    try {
      if (!this.client) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.error('[LINE Service] Cannot send notification: service not initialized');
          return false;
        }
      }

      // Create status message in Thai
      const statusMessages: Record<string, string> = {
        pending: 'รอดำเนินการ',
        processing: 'กำลังดำเนินการ',
        shipped: 'จัดส่งแล้ว',
        in_transit: 'อยู่ระหว่างการขนส่ง',
        delivered: 'จัดส่งสำเร็จ',
        cancelled: 'ยกเลิก',
      };

      const statusText = statusMessages[status] || status;

      // Build message
      let message = `🚢 การอัปเดทการจัดส่ง\n\n`;
      message += `เลขที่คำสั่งซื้อ: ${orderNumber}\n`;
      message += `สถานะ: ${statusText}\n`;

      if (trackingNumber) {
        message += `หมายเลขติดตาม: ${trackingNumber}\n`;
      }

      if (currentLocation) {
        message += `สถานที่ปัจจุบัน: ${currentLocation}\n`;
      }

      message += `\nขอบคุณที่ใช้บริการ 🙏`;

      const textMessage: TextMessage = {
        type: 'text',
        text: message,
      };

      await this.client!.pushMessage(userId, textMessage);

      // Log notification
      await prisma.notification.create({
        data: {
          type: 'line',
          subject: `Order ${orderNumber} - ${statusText}`,
          message: message,
          status: 'sent',
          sentAt: new Date(),
        },
      });

      console.log(`[LINE Service] Shipping update sent to ${userId}`);
      return true;
    } catch (error) {
      console.error('[LINE Service] Error sending shipping update:', error);

      // Log failed notification
      try {
        await prisma.notification.create({
          data: {
            type: 'line',
            subject: `Order ${orderNumber} - Failed`,
            message: `Failed to send notification`,
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      } catch (logError) {
        console.error('[LINE Service] Error logging failed notification:', logError);
      }

      return false;
    }
  }

  async sendFlexMessage(userId: string, altText: string, contents: any): Promise<boolean> {
    try {
      if (!this.client) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.error('[LINE Service] Cannot send message: service not initialized');
          return false;
        }
      }

      const flexMessage: FlexMessage = {
        type: 'flex',
        altText: altText,
        contents: contents,
      };

      await this.client!.pushMessage(userId, flexMessage);
      console.log(`[LINE Service] Flex message sent to ${userId}`);
      return true;
    } catch (error) {
      console.error('[LINE Service] Error sending flex message:', error);
      return false;
    }
  }

  async getProfile(userId: string): Promise<any> {
    try {
      if (!this.client) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.error('[LINE Service] Cannot get profile: service not initialized');
          return null;
        }
      }

      const profile = await this.client!.getProfile(userId);
      return profile;
    } catch (error) {
      console.error('[LINE Service] Error getting profile:', error);
      return null;
    }
  }

  isConfigured(): boolean {
    return this.client !== null && this.config !== null;
  }

  async sendPaymentReminder(
    userId: string,
    customerName: string,
    orderNumber: string,
    totalAmount: number,
    paidAmount: number,
    dueDate?: Date,
    bankInfo?: { bankName: string; accountName: string; accountNumber: string }
  ): Promise<boolean> {
    try {
      if (!this.client) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.error('[LINE Service] Cannot send reminder: service not initialized');
          return false;
        }
      }

      const remainingAmount = totalAmount - paidAmount;

      let message = `💳 แจ้งเตือนการชำระเงิน\n\n`;
      message += `สวัสดีคุณ ${customerName}\n\n`;
      message += `📋 เลขที่ออเดอร์: ${orderNumber}\n`;
      message += `💰 ยอดรวม: ฿${totalAmount.toLocaleString()}\n`;

      if (paidAmount > 0) {
        message += `✅ ชำระแล้ว: ฿${paidAmount.toLocaleString()}\n`;
      }

      message += `⚠️ ยอดค้างชำระ: ฿${remainingAmount.toLocaleString()}\n`;

      if (dueDate) {
        message += `📅 กำหนดชำระ: ${dueDate.toLocaleDateString('th-TH')}\n`;
      }

      if (bankInfo) {
        message += `\n🏦 ข้อมูลการโอนเงิน:\n`;
        message += `ธนาคาร: ${bankInfo.bankName}\n`;
        message += `ชื่อบัญชี: ${bankInfo.accountName}\n`;
        message += `เลขบัญชี: ${bankInfo.accountNumber}\n`;
      }

      message += `\nหากชำระเงินแล้วกรุณาแจ้งกลับ\nขอบคุณครับ/ค่ะ 🙏`;

      const textMessage: TextMessage = {
        type: 'text',
        text: message,
      };

      await this.client!.pushMessage(userId, textMessage);

      // Log notification
      await prisma.notification.create({
        data: {
          type: 'line',
          subject: `Payment Reminder - ${orderNumber}`,
          message: message,
          status: 'sent',
          sentAt: new Date(),
        },
      });

      console.log(`[LINE Service] Payment reminder sent to ${userId}`);
      return true;
    } catch (error) {
      console.error('[LINE Service] Error sending payment reminder:', error);

      // Log failed notification
      try {
        await prisma.notification.create({
          data: {
            type: 'line',
            subject: `Payment Reminder Failed - ${orderNumber}`,
            message: `Failed to send payment reminder`,
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      } catch (logError) {
        console.error('[LINE Service] Error logging failed notification:', logError);
      }

      return false;
    }
  }
}

// Export singleton instance
export const lineService = new LineService();
