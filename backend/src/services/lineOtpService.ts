import { Client, ClientConfig, TextMessage, FlexMessage } from '@line/bot-sdk';

// LINE OTP Service for Staff Code notifications
// Channel Access Token for OTP notifications
const LINE_OTP_CHANNEL_ACCESS_TOKEN = 'uVcHsuG++eQ+JqnWrKNTjtq2ckAQC9atbxiJ2zJk2IAzdMG5sq9TMr/b+yPFizI+4D4hkOKdruvZ407eX893IKRRvriQwRanS8U/VJd1U6N6mKj7PyMV+J3rollcfZsSfDfPeKaGrH+HlQQQ7lIDmgdB04t89/1O/w1cDnyilFU=';
const LINE_OTP_CHANNEL_SECRET = '2007891444';

// Group ID for staff code notifications
let STAFF_GROUP_ID = 'Cd056d25774bf9cf2f61375858d07fe46';

export class LineOtpService {
  private client: Client;
  private config: ClientConfig;

  constructor() {
    this.config = {
      channelAccessToken: LINE_OTP_CHANNEL_ACCESS_TOKEN,
      channelSecret: LINE_OTP_CHANNEL_SECRET,
    };
    this.client = new Client(this.config);
    console.log('[LINE OTP Service] Initialized');
  }

  // Set the group ID (call this after getting from webhook)
  setGroupId(groupId: string) {
    STAFF_GROUP_ID = groupId;
    console.log(`[LINE OTP Service] Group ID set to: ${groupId}`);
  }

  getGroupId(): string {
    return STAFF_GROUP_ID;
  }

  // Send staff code to group as Flex Message
  async sendStaffCodeToGroup(
    staffCode: string,
    requestedBy: string,
    email: string
  ): Promise<boolean> {
    try {
      if (!STAFF_GROUP_ID) {
        console.error('[LINE OTP Service] Group ID not set');
        return false;
      }

      const now = new Date();
      const timeString = now.toLocaleString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Create Flex Message
      const flexContents: any = {
        type: 'bubble',
        size: 'kilo',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '🔐',
                  size: 'xl',
                },
                {
                  type: 'text',
                  text: 'Staff Registration',
                  size: 'lg',
                  weight: 'bold',
                  color: '#FFFFFF',
                  margin: 'md',
                },
              ],
              alignItems: 'center',
            },
          ],
          backgroundColor: '#7C3AED',
          paddingAll: '15px',
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'มีคนขอสมัครพนักงานใหม่',
              size: 'sm',
              color: '#666666',
            },
            {
              type: 'separator',
              margin: 'lg',
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
                      type: 'text',
                      text: 'ชื่อ',
                      size: 'sm',
                      color: '#999999',
                      flex: 1,
                    },
                    {
                      type: 'text',
                      text: requestedBy || 'ไม่ระบุ',
                      size: 'sm',
                      color: '#333333',
                      flex: 2,
                      align: 'end',
                    },
                  ],
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    {
                      type: 'text',
                      text: 'อีเมล',
                      size: 'sm',
                      color: '#999999',
                      flex: 1,
                    },
                    {
                      type: 'text',
                      text: email || 'ไม่ระบุ',
                      size: 'sm',
                      color: '#333333',
                      flex: 2,
                      align: 'end',
                    },
                  ],
                  margin: 'md',
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    {
                      type: 'text',
                      text: 'เวลา',
                      size: 'sm',
                      color: '#999999',
                      flex: 1,
                    },
                    {
                      type: 'text',
                      text: timeString,
                      size: 'sm',
                      color: '#333333',
                      flex: 2,
                      align: 'end',
                    },
                  ],
                  margin: 'md',
                },
              ],
              margin: 'lg',
            },
            {
              type: 'separator',
              margin: 'lg',
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: 'STAFF CODE',
                  size: 'xs',
                  color: '#7C3AED',
                  weight: 'bold',
                  align: 'center',
                },
                {
                  type: 'text',
                  text: staffCode,
                  size: 'xxl',
                  weight: 'bold',
                  color: '#7C3AED',
                  align: 'center',
                  margin: 'md',
                },
              ],
              margin: 'lg',
              paddingAll: '15px',
              backgroundColor: '#F3E8FF',
              cornerRadius: '10px',
            },
          ],
          paddingAll: '20px',
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'PakkuNeko Admin System',
              size: 'xs',
              color: '#AAAAAA',
              align: 'center',
            },
          ],
          paddingAll: '10px',
        },
      };

      const flexMessage: FlexMessage = {
        type: 'flex',
        altText: `[Staff Code] ${requestedBy} ขอสมัครพนักงาน - Code: ${staffCode}`,
        contents: flexContents,
      };

      await this.client.pushMessage(STAFF_GROUP_ID, flexMessage);
      console.log(`[LINE OTP Service] Staff code sent to group: ${STAFF_GROUP_ID}`);
      return true;
    } catch (error) {
      console.error('[LINE OTP Service] Error sending staff code:', error);
      return false;
    }
  }

  // Send login OTP to group as Flex Message
  async sendLoginOtpToGroup(
    otpCode: string,
    userName: string,
    email: string
  ): Promise<boolean> {
    try {
      if (!STAFF_GROUP_ID) {
        console.error('[LINE OTP Service] Group ID not set');
        return false;
      }

      const now = new Date();
      const timeString = now.toLocaleString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Create Flex Message for Login OTP
      const flexContents: any = {
        type: 'bubble',
        size: 'kilo',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '🔑',
                  size: 'xl',
                },
                {
                  type: 'text',
                  text: 'Login Verification',
                  size: 'lg',
                  weight: 'bold',
                  color: '#FFFFFF',
                  margin: 'md',
                },
              ],
              alignItems: 'center',
            },
          ],
          backgroundColor: '#059669', // Green color for login
          paddingAll: '15px',
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'มีคนกำลังเข้าสู่ระบบ',
              size: 'sm',
              color: '#666666',
            },
            {
              type: 'separator',
              margin: 'lg',
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
                      type: 'text',
                      text: 'ชื่อ',
                      size: 'sm',
                      color: '#999999',
                      flex: 1,
                    },
                    {
                      type: 'text',
                      text: userName || 'ไม่ระบุ',
                      size: 'sm',
                      color: '#333333',
                      flex: 2,
                      align: 'end',
                    },
                  ],
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    {
                      type: 'text',
                      text: 'อีเมล',
                      size: 'sm',
                      color: '#999999',
                      flex: 1,
                    },
                    {
                      type: 'text',
                      text: email || 'ไม่ระบุ',
                      size: 'sm',
                      color: '#333333',
                      flex: 2,
                      align: 'end',
                    },
                  ],
                  margin: 'md',
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    {
                      type: 'text',
                      text: 'เวลา',
                      size: 'sm',
                      color: '#999999',
                      flex: 1,
                    },
                    {
                      type: 'text',
                      text: timeString,
                      size: 'sm',
                      color: '#333333',
                      flex: 2,
                      align: 'end',
                    },
                  ],
                  margin: 'md',
                },
              ],
              margin: 'lg',
            },
            {
              type: 'separator',
              margin: 'lg',
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: 'LOGIN OTP',
                  size: 'xs',
                  color: '#059669',
                  weight: 'bold',
                  align: 'center',
                },
                {
                  type: 'text',
                  text: otpCode,
                  size: 'xxl',
                  weight: 'bold',
                  color: '#059669',
                  align: 'center',
                  margin: 'md',
                },
                {
                  type: 'text',
                  text: 'หมดอายุใน 5 นาที',
                  size: 'xs',
                  color: '#999999',
                  align: 'center',
                  margin: 'sm',
                },
              ],
              margin: 'lg',
              paddingAll: '15px',
              backgroundColor: '#ECFDF5',
              cornerRadius: '10px',
            },
          ],
          paddingAll: '20px',
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'PakkuNeko Admin System',
              size: 'xs',
              color: '#AAAAAA',
              align: 'center',
            },
          ],
          paddingAll: '10px',
        },
      };

      const flexMessage: FlexMessage = {
        type: 'flex',
        altText: `[Login OTP] ${userName} กำลังเข้าสู่ระบบ - OTP: ${otpCode}`,
        contents: flexContents,
      };

      await this.client.pushMessage(STAFF_GROUP_ID, flexMessage);
      console.log(`[LINE OTP Service] Login OTP sent to group: ${STAFF_GROUP_ID}`);
      return true;
    } catch (error) {
      console.error('[LINE OTP Service] Error sending login OTP:', error);
      return false;
    }
  }

  // Send simple text message to group (for debugging)
  async sendTextToGroup(message: string): Promise<boolean> {
    try {
      if (!STAFF_GROUP_ID) {
        console.error('[LINE OTP Service] Group ID not set');
        return false;
      }

      const textMessage: TextMessage = {
        type: 'text',
        text: message,
      };

      await this.client.pushMessage(STAFF_GROUP_ID, textMessage);
      console.log(`[LINE OTP Service] Text message sent to group`);
      return true;
    } catch (error) {
      console.error('[LINE OTP Service] Error sending text message:', error);
      return false;
    }
  }

  // Get group summary (for debugging)
  async getGroupSummary(groupId: string): Promise<any> {
    try {
      const summary = await this.client.getGroupSummary(groupId);
      return summary;
    } catch (error) {
      console.error('[LINE OTP Service] Error getting group summary:', error);
      return null;
    }
  }
}

// Export singleton instance
export const lineOtpService = new LineOtpService();
