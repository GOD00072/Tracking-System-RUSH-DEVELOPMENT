import { Client, ClientConfig, TextMessage, FlexMessage } from '@line/bot-sdk';
import prisma from '../lib/prisma';

// Default PakkuNeko assets
const DEFAULT_LOGO_URL = 'https://img5.pic.in.th/file/secure-sv1/pakkuneko-logo.jpeg';
const DEFAULT_BG_URL = 'https://img5.pic.in.th/file/secure-sv1/bg-mountain.jpeg';

export class LineService {
  private client: Client | null = null;
  private config: ClientConfig | null = null;
  private logoUrl: string = DEFAULT_LOGO_URL;
  private bgUrl: string = DEFAULT_BG_URL;

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

      // Fetch custom logo URL from system settings (fallback to default)
      try {
        const logoSetting = await prisma.systemSetting.findUnique({
          where: { key: 'company_logo_url' },
        });
        if (logoSetting && logoSetting.value) {
          const customUrl = (logoSetting.value as any).url || logoSetting.value as string;
          if (customUrl) {
            this.logoUrl = customUrl;
          }
        }
      } catch (logoError) {
        console.log('[LINE Service] Using default logo URL');
      }

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

  // Force reinitialize the service (call after settings update)
  async reinitialize(): Promise<boolean> {
    this.client = null;
    this.config = null;
    console.log('[LINE Service] Reinitializing...');
    return await this.initialize();
  }

  // Flex Message for bulk status update notification
  async sendStatusUpdateFlexMessage(
    userId: string,
    customerName: string,
    newStatus: string,
    items: Array<{ productCode: string; productName?: string }>,
    orderNumber?: string,
    trackingUrl?: string
  ): Promise<boolean> {
    try {
      if (!this.client) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.error('[LINE Service] Cannot send flex message: service not initialized');
          return false;
        }
      }

      // Status configuration with colors and icons
      const statusConfig: Record<string, { label: string; color: string; icon: string; bgColor: string }> = {
        order_received: { label: 'รับออเดอร์แล้ว', color: '#6B7280', icon: '📋', bgColor: '#F3F4F6' },
        first_payment: { label: 'ชำระเงินงวดแรก', color: '#10B981', icon: '💳', bgColor: '#D1FAE5' },
        ordered_from_japan: { label: 'สั่งซื้อจากญี่ปุ่นแล้ว', color: '#3B82F6', icon: '🛒', bgColor: '#DBEAFE' },
        arrived_jp_warehouse: { label: 'ถึงโกดังญี่ปุ่น', color: '#8B5CF6', icon: '🏭', bgColor: '#EDE9FE' },
        shipped_from_japan: { label: 'ส่งออกจากญี่ปุ่น', color: '#F59E0B', icon: '✈️', bgColor: '#FEF3C7' },
        arrived_thailand: { label: 'ถึงไทยแล้ว', color: '#EC4899', icon: '🇹🇭', bgColor: '#FCE7F3' },
        out_for_delivery: { label: 'กำลังจัดส่ง', color: '#F97316', icon: '🚚', bgColor: '#FFEDD5' },
        delivered: { label: 'จัดส่งสำเร็จ', color: '#059669', icon: '✅', bgColor: '#D1FAE5' },
        cancelled: { label: 'ยกเลิก', color: '#EF4444', icon: '❌', bgColor: '#FEE2E2' },
      };

      const config = statusConfig[newStatus] || {
        label: newStatus,
        color: '#6B7280',
        icon: '📦',
        bgColor: '#F3F4F6'
      };

      // Build items list (max 3 items shown for dark theme cards)
      const displayItems = items.slice(0, 3);
      const remainingCount = items.length - 3;

      // Build item cards for dark theme
      const itemCards = displayItems.map((item, index) => ({
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: item.productName || item.productCode,
            size: 'xs',
            color: '#FFFFFF',
            align: 'center',
            wrap: true,
            maxLines: 2
          }
        ],
        backgroundColor: `${config.color}22`,
        cornerRadius: '8px',
        paddingAll: '12px',
        flex: 1,
        borderColor: `${config.color}66`,
        borderWidth: '1px',
        ...(index > 0 ? { margin: 'sm' } : {})
      }));

      // Add remaining count card if needed
      if (remainingCount > 0) {
        itemCards.push({
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: `+${remainingCount}`,
              size: 'xs',
              color: '#FFFFFF99',
              align: 'center'
            }
          ],
          backgroundColor: '#FFFFFF11',
          cornerRadius: '8px',
          paddingAll: '12px',
          flex: 0,
          margin: 'sm',
          borderColor: '#FFFFFF22',
          borderWidth: '1px'
        } as any);
      }

      // Current time in compact format
      const now = new Date();
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = (now.getFullYear() + 543) % 100;
      const hour = now.getHours().toString().padStart(2, '0');
      const minute = now.getMinutes().toString().padStart(2, '0');
      const timeString = `${day}.${month}.${year} · ${hour}:${minute}`;

      // Build Dark Theme Flex Message
      const flexContents: any = {
        type: 'bubble',
        size: 'giga',
        hero: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'image',
              url: this.bgUrl,
              size: 'full',
              aspectRatio: '20:13',
              aspectMode: 'cover',
              position: 'absolute',
              offsetTop: '0px',
              offsetBottom: '0px',
              offsetStart: '0px',
              offsetEnd: '0px'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [],
              position: 'absolute',
              offsetTop: '0px',
              offsetBottom: '0px',
              offsetStart: '0px',
              offsetEnd: '0px',
              background: {
                type: 'linearGradient',
                angle: '180deg',
                startColor: '#18181800',
                centerColor: '#18181866',
                endColor: '#181818FF'
              }
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    {
                      type: 'box',
                      layout: 'vertical',
                      contents: [
                        {
                          type: 'image',
                          url: this.logoUrl,
                          size: 'full',
                          aspectRatio: '1:1',
                          aspectMode: 'cover'
                        }
                      ],
                      width: '32px',
                      height: '32px',
                      cornerRadius: '8px'
                    },
                    {
                      type: 'text',
                      text: 'PAKKUNEKO',
                      size: 'xs',
                      color: '#1d1d1dff',
                      weight: 'bold',
                      margin: 'md',
                      gravity: 'center'
                    },
                    {
                      type: 'filler'
                    },
                    {
                      type: 'text',
                      text: 'JP → TH',
                      size: 'xxs',
                      color: '#00000099',
                      gravity: 'center'
                    }
                  ],
                  alignItems: 'center'
                },
                {
                  type: 'filler'
                },
                {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'text',
                      text: config.label,
                      size: 'xxl',
                      weight: 'bold',
                      color: '#FFFFFF'
                    }
                  ]
                }
              ],
              paddingAll: '20px',
              height: '180px'
            }
          ],
          height: '180px',
          paddingAll: '0px'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: `สวัสดีคุณ${customerName}`,
                  size: 'md',
                  color: '#FFFFFF',
                  weight: 'bold'
                },
                {
                  type: 'text',
                  text: 'สินค้าของคุณมีการอัปเดตสถานะใหม่',
                  size: 'sm',
                  color: '#FFFFFF99',
                  margin: 'sm'
                }
              ]
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'text',
                      text: 'ORDER',
                      size: 'xxs',
                      color: '#FFFFFF66'
                    },
                    {
                      type: 'text',
                      text: orderNumber || '-',
                      size: 'sm',
                      color: '#FFFFFF',
                      weight: 'bold',
                      margin: 'sm'
                    }
                  ],
                  flex: 1
                },
                {
                  type: 'separator',
                  color: '#FFFFFF22'
                },
                {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'text',
                      text: 'DATE',
                      size: 'xxs',
                      color: '#FFFFFF66',
                      align: 'end'
                    },
                    {
                      type: 'text',
                      text: timeString,
                      size: 'sm',
                      color: '#FFFFFF',
                      align: 'end',
                      margin: 'sm'
                    }
                  ],
                  flex: 1
                }
              ],
              backgroundColor: '#FFFFFF11',
              cornerRadius: '12px',
              paddingAll: '15px',
              margin: 'xl'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: 'ITEMS UPDATED',
                  size: 'xxs',
                  color: '#FFFFFF66'
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: itemCards,
                  margin: 'md'
                }
              ],
              margin: 'lg'
            },
            ...(trackingUrl ? [{
              type: 'button',
              action: {
                type: 'uri',
                label: 'ดูรายละเอียดออเดอร์',
                uri: trackingUrl
              },
              style: 'primary',
              color: '#F97316',
              margin: 'xl', 
              height: 'md'
            }] : []),
            {
              type: 'text',
              text: '🐱 PakkuNeko - ฝากซื้อฝากส่งจากญี่ปุ่น',
              size: 'xxs',
              color: '#FFFFFF44',
              align: 'center',
              margin: 'lg'
            }
          ],
          paddingAll: '20px',
          backgroundColor: '#181818'
        }
      };

      const flexMessage: FlexMessage = {
        type: 'flex',
        altText: `📦 อัปเดตสถานะ: ${config.label} (${items.length} รายการ)`,
        contents: flexContents
      };

      await this.client!.pushMessage(userId, flexMessage);

      // Log notification
      await prisma.notification.create({
        data: {
          type: 'line',
          subject: `Status Update - ${config.label}`,
          message: `Updated ${items.length} items to ${config.label}`,
          status: 'sent',
          sentAt: new Date(),
        },
      });

      console.log(`[LINE Service] Status update flex message sent to ${userId}`);
      return true;
    } catch (error) {
      console.error('[LINE Service] Error sending status update flex:', error);

      // Log failed notification
      try {
        await prisma.notification.create({
          data: {
            type: 'line',
            subject: `Status Update Failed`,
            message: `Failed to send status update notification`,
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

  // Flex Message for payment reminder
  async sendPaymentReminderFlex(
    userId: string,
    customerName: string,
    orderNumber: string,
    totalAmount: number,
    paidAmount: number,
    remainingAmount: number,
    dueDate?: Date,
    bankInfo?: { bankName: string; accountName: string; accountNumber: string }
  ): Promise<boolean> {
    try {
      if (!this.client) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.error('[LINE Service] Cannot send payment reminder: service not initialized');
          return false;
        }
      }

      const progressPercent = Math.round((paidAmount / totalAmount) * 100);
      const dueDateText = dueDate
        ? dueDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'ไม่ระบุ';

      // Build Professional Payment Reminder Flex Message
      const flexContents: any = {
        type: 'bubble',
        size: 'giga',
        // Hero section with background image and logo overlay
        hero: {
          type: 'box',
          layout: 'vertical',
          contents: [
            // Background image layer
            {
              type: 'image',
              url: this.bgUrl,
              size: 'full',
              aspectRatio: '20:9',
              aspectMode: 'cover',
              position: 'absolute',
              offsetTop: '0px',
              offsetBottom: '0px',
              offsetStart: '0px',
              offsetEnd: '0px'
            },
            // Overlay gradient layer
            {
              type: 'box',
              layout: 'vertical',
              contents: [],
              position: 'absolute',
              offsetTop: '0px',
              offsetBottom: '0px',
              offsetStart: '0px',
              offsetEnd: '0px',
              background: {
                type: 'linearGradient',
                angle: '180deg',
                startColor: '#1A1A2E00',
                endColor: '#1A1A2ECC'
              }
            },
            // Content layer
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                // Logo
                {
                  type: 'image',
                  url: this.logoUrl,
                  size: 'xxs',
                  aspectRatio: '1:1',
                  aspectMode: 'cover'
                },
                // Brand name
                {
                  type: 'text',
                  text: 'PakkuNeko',
                  size: 'md',
                  weight: 'bold',
                  color: '#FFFFFF',
                  align: 'center',
                  margin: 'sm'
                },
                {
                  type: 'text',
                  text: 'ฝากซื้อ ฝากส่งจากญี่ปุ่น',
                  size: 'xxs',
                  color: '#FFFFFFCC',
                  align: 'center'
                },
                // Spacer
                {
                  type: 'filler'
                },
                // Payment badge
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    {
                      type: 'box',
                      layout: 'baseline',
                      contents: [
                        {
                          type: 'text',
                          text: '💳',
                          size: 'md',
                          flex: 0
                        },
                        {
                          type: 'text',
                          text: 'แจ้งเตือนการชำระเงิน',
                          size: 'sm',
                          weight: 'bold',
                          color: '#FFFFFF',
                          margin: 'sm',
                          flex: 0,
                          wrap: false
                        }
                      ],
                      backgroundColor: '#F59E0B',
                      cornerRadius: '20px',
                      paddingAll: '10px',
                      paddingStart: '15px',
                      paddingEnd: '15px'
                    }
                  ],
                  justifyContent: 'center'
                }
              ],
              paddingAll: '15px',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '150px'
            }
          ],
          height: '150px',
          paddingAll: '0px'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            // Greeting
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: `สวัสดีคุณ ${customerName} 👋`,
                  size: 'md',
                  weight: 'bold',
                  color: '#1A1A2E',
                  flex: 1
                },
                {
                  type: 'text',
                  text: `#${orderNumber}`,
                  size: 'xs',
                  color: '#888888',
                  align: 'end'
                }
              ]
            },
            // Divider
            {
              type: 'separator',
              margin: 'lg',
              color: '#E8E8E8'
            },
            // Big amount card
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: 'ยอดค้างชำระ',
                  size: 'xs',
                  color: '#888888',
                  align: 'center'
                },
                {
                  type: 'text',
                  text: `฿${remainingAmount.toLocaleString()}`,
                  size: 'xxl',
                  weight: 'bold',
                  color: '#F59E0B',
                  align: 'center',
                  margin: 'sm'
                },
                // Progress bar
                {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'box',
                      layout: 'horizontal',
                      contents: [
                        {
                          type: 'box',
                          layout: 'vertical',
                          contents: [],
                          backgroundColor: '#10B981',
                          height: '6px',
                          width: `${progressPercent}%`
                        }
                      ],
                      backgroundColor: '#E5E7EB',
                      cornerRadius: '3px'
                    }
                  ],
                  margin: 'lg',
                  paddingStart: '20px',
                  paddingEnd: '20px'
                },
                {
                  type: 'text',
                  text: `ชำระแล้ว ${progressPercent}%`,
                  size: 'xxs',
                  color: '#10B981',
                  align: 'center',
                  margin: 'sm'
                }
              ],
              margin: 'lg',
              paddingAll: '15px',
              backgroundColor: '#FFFBEB',
              cornerRadius: '12px'
            },
            // Amount breakdown
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: 'ยอดรวมทั้งหมด', size: 'sm', color: '#666666' },
                    { type: 'text', text: `฿${totalAmount.toLocaleString()}`, size: 'sm', color: '#1A1A2E', weight: 'bold', align: 'end' }
                  ]
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: '✓ ชำระแล้ว', size: 'sm', color: '#10B981' },
                    { type: 'text', text: `฿${paidAmount.toLocaleString()}`, size: 'sm', color: '#10B981', align: 'end' }
                  ],
                  margin: 'sm'
                },
                {
                  type: 'separator',
                  margin: 'md',
                  color: '#E8E8E8'
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: '📅 กำหนดชำระ', size: 'sm', color: '#666666' },
                    { type: 'text', text: dueDateText, size: 'sm', color: '#EF4444', weight: 'bold', align: 'end' }
                  ],
                  margin: 'md'
                }
              ],
              margin: 'lg',
              paddingAll: '12px',
              backgroundColor: '#F8F9FA',
              cornerRadius: '8px'
            },
            // Bank info (if provided)
            ...(bankInfo ? [{
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: '🏦', size: 'sm', flex: 0 },
                    { type: 'text', text: 'ข้อมูลการโอนเงิน', size: 'sm', weight: 'bold', color: '#1A1A2E', margin: 'sm' }
                  ]
                },
                {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    { type: 'text', text: bankInfo.bankName, size: 'md', weight: 'bold', color: '#1A1A2E' },
                    { type: 'text', text: bankInfo.accountName, size: 'sm', color: '#666666', margin: 'xs' },
                    { type: 'text', text: bankInfo.accountNumber, size: 'lg', weight: 'bold', color: '#4A6FA5', margin: 'sm' }
                  ],
                  margin: 'md',
                  paddingAll: '10px',
                  backgroundColor: '#FFFFFF',
                  cornerRadius: '8px',
                  borderColor: '#E8E8E8',
                  borderWidth: '1px'
                }
              ],
              margin: 'lg',
              paddingAll: '12px',
              backgroundColor: '#EEF2FF',
              cornerRadius: '8px'
            }] : [])
          ],
          paddingAll: '20px',
          backgroundColor: '#FFFFFF'
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'หากชำระเงินแล้ว กรุณาแจ้งกลับ',
              size: 'xs',
              color: '#888888',
              align: 'center'
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '🐱 PakkuNeko - ฝากซื้อฝากส่งจากญี่ปุ่น',
                  size: 'xxs',
                  color: '#AAAAAA',
                  align: 'center'
                }
              ],
              justifyContent: 'center',
              margin: 'md'
            }
          ],
          paddingAll: '15px',
          backgroundColor: '#FAFAFA'
        }
      };

      const flexMessage: FlexMessage = {
        type: 'flex',
        altText: `💳 แจ้งเตือนการชำระเงิน - ค้างชำระ ฿${remainingAmount.toLocaleString()}`,
        contents: flexContents
      };

      await this.client!.pushMessage(userId, flexMessage);

      // Log notification
      await prisma.notification.create({
        data: {
          type: 'line',
          subject: `Payment Reminder - ${orderNumber}`,
          message: `Remaining: ฿${remainingAmount.toLocaleString()}`,
          status: 'sent',
          sentAt: new Date(),
        },
      });

      console.log(`[LINE Service] Payment reminder flex sent to ${userId}`);
      return true;
    } catch (error) {
      console.error('[LINE Service] Error sending payment reminder flex:', error);
      return false;
    }
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
