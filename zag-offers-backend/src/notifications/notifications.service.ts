import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private isFirebaseReady = false;

  constructor(private prisma: PrismaService) {}

  private sanitizeImageUrl(imageUrl?: string): string | undefined {
    if (!imageUrl) return undefined;
    try {
      const url = new URL(imageUrl);
      url.pathname = url.pathname.replace(/\/\/+/g, '/');
      return url.toString();
    } catch {
      return imageUrl;
    }
  }

  private parseServiceAccount(value: string): admin.ServiceAccount | undefined {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') {
      return undefined;
    }
    return parsed;
  }

  onModuleInit() {
    try {
      if (admin.apps.length === 0) {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
          const serviceAccount = this.parseServiceAccount(
            process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
          );
          if (!serviceAccount) {
            throw new Error('Invalid Firebase service account');
          }
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        } else {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
          });
        }
      }
      this.isFirebaseReady = true;
      this.logger.log('Firebase Admin initialized successfully');
    } catch (error) {
      this.logger.warn(
        'Firebase Admin could not be initialized - Push Notifications disabled',
      );
      this.logger.debug(`Firebase init error: ${(error as Error).message}`);
    }
  }

  isReady(): boolean {
    return this.isFirebaseReady;
  }

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markNotificationAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllNotificationsAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  private async saveNotification(
    userId: string,
    payload: NotificationPayload,
    type?: string,
  ) {
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
          type: type || payload.data?.type,
          data: payload.data ? JSON.stringify(payload.data) : null,
        },
      });
    } catch (e) {
      this.logger.error('Failed to save notification: ' + (e as Error).message);
    }
  }

  private async saveNotificationsForUsers(
    userIds: string[],
    payload: NotificationPayload,
    type?: string,
  ) {
    if (userIds.length === 0) return;
    try {
      await this.prisma.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
          type: type || payload.data?.type,
          data: payload.data ? JSON.stringify(payload.data) : null,
        })),
        skipDuplicates: true,
      });
    } catch (e) {
      this.logger.error(
        'Failed to save notifications for users: ' + (e as Error).message,
      );
    }
  }

  async saveFcmToken(userId: string, token: string): Promise<void> {
    // Read old token before overwriting so we can unsubscribe stale topics
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true, area: true },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken: token },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, area: true },
    });

    if (!this.isFirebaseReady) return;

    try {
      // Unsubscribe old token if the device token changed
      if (existing?.fcmToken && existing.fcmToken !== token) {
        try {
          // Fallback unsubscribe from all possible legacy topics
          await admin
            .messaging()
            .unsubscribeFromTopic([existing.fcmToken], 'all_users')
            .catch(() => {});
          await admin
            .messaging()
            .unsubscribeFromTopic([existing.fcmToken], 'all_customers')
            .catch(() => {});
          await admin
            .messaging()
            .unsubscribeFromTopic([existing.fcmToken], 'all_merchants')
            .catch(() => {});
          await admin
            .messaging()
            .unsubscribeFromTopic([existing.fcmToken], 'all_admins')
            .catch(() => {});

          if (existing.area) {
            await admin
              .messaging()
              .unsubscribeFromTopic(
                [existing.fcmToken],
                `area_${existing.area.replace(/\s+/g, '_')}`,
              );
          }
        } catch {
          // Ignore stale-token unsubscribe errors
        }
      }

      // Subscribe to role-specific topic
      let roleTopic = 'all_customers';
      if (user?.role === 'MERCHANT') roleTopic = 'all_merchants';
      else if (user?.role === 'ADMIN') roleTopic = 'all_admins';
      
      await admin.messaging().subscribeToTopic([token], roleTopic);

      if (user?.area) {
        const areaTopic = `area_${user.area.replace(/\s+/g, '_')}`;
        await admin.messaging().subscribeToTopic([token], areaTopic);
      }
    } catch (error) {
      this.logger.error(
        `Failed to subscribe token: ${(error as Error).message}`,
      );
    }
  }

  async removeFcmToken(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true, area: true, role: true },
    });

    if (!user?.fcmToken) return;

    if (this.isFirebaseReady) {
      try {
        let roleTopic = 'all_customers';
        if (user.role === 'MERCHANT') roleTopic = 'all_merchants';
        else if (user.role === 'ADMIN') roleTopic = 'all_admins';
        
        await admin
          .messaging()
          .unsubscribeFromTopic([user.fcmToken], roleTopic);

        if (user.area) {
          await admin
            .messaging()
            .unsubscribeFromTopic(
              [user.fcmToken],
              `area_${user.area.replace(/\s+/g, '_')}`,
            );
        }
      } catch {
        // Ignore unsubscribe failure
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken: null },
    });
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    imageUrl?: string,
  ): Promise<void> {
    if (!this.isFirebaseReady) return;

    try {
      const sanitizedImageUrl = this.sanitizeImageUrl(imageUrl);
      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
          ...(sanitizedImageUrl ? { imageUrl: sanitizedImageUrl } : {}),
        },
        topic,
        data: {
          ...(data || {}),
          ...(sanitizedImageUrl
            ? { image: sanitizedImageUrl, imageUrl: sanitizedImageUrl }
            : {}),
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId:
              topic === 'all_merchants' ? 'merchants_channel' : 
              topic === 'all_admins' ? 'admin_channel' : 'offers_channel',
            imageUrl: sanitizedImageUrl,
          },
        },
        apns: {
          payload: { aps: { 'mutable-content': 1 } },
          fcmOptions: { imageUrl: sanitizedImageUrl },
        },
      };
      await admin.messaging().send(message);
      this.logger.log(`FCM topic broadcast to ${topic} sent successfully`);
    } catch (error) {
      this.logger.error(`sendToTopic failed for ${topic}: ${(error as Error).message}`);
    }
  }

  async sendToAll(
    title: string,
    body: string,
    data?: Record<string, string>,
    imageUrl?: string,
  ): Promise<void> {
    // Save to DB for ALL users
    try {
      const targetUsers = await this.prisma.user.findMany({
        select: { id: true },
      });
      await this.saveNotificationsForUsers(
        targetUsers.map((u) => u.id),
        { title, body, data, imageUrl },
        data?.type,
      );
    } catch (e) {
      this.logger.error(
        'Failed fetching users for broadcast: ' + (e as Error).message,
      );
    }

    if (!this.isFirebaseReady) return;

    try {
      const sanitizedImageUrl = this.sanitizeImageUrl(imageUrl);
      
      // Send to both topics
      const topics = ['all_customers', 'all_merchants'];
      
      for (const topic of topics) {
        const message: admin.messaging.Message = {
          notification: {
            title,
            body,
            ...(sanitizedImageUrl ? { imageUrl: sanitizedImageUrl } : {}),
          },
          topic,
          data: {
            ...(data || {}),
            ...(sanitizedImageUrl
              ? { image: sanitizedImageUrl, imageUrl: sanitizedImageUrl }
              : {}),
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: topic === 'all_merchants' ? 'merchants_channel' : 'offers_channel',
              imageUrl: sanitizedImageUrl,
            },
          },
          apns: {
            payload: {
              aps: { sound: 'default', badge: 1, 'mutable-content': 1 },
            },
            fcmOptions: { imageUrl: sanitizedImageUrl },
          },
        };
        await admin.messaging().send(message);
      }
      this.logger.log('FCM broadcast sent successfully to all topics');
    } catch (error) {
      this.logger.error(`sendToAll failed: ${(error as Error).message}`);
    }
  }

  async sendToArea(
    area: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    imageUrl?: string,
  ): Promise<void> {
    if (!area) return;

    // Save to DB for users in this area
    try {
      const usersInArea = await this.prisma.user.findMany({
        where: { area },
        select: { id: true },
      });
      await this.saveNotificationsForUsers(
        usersInArea.map((u) => u.id),
        { title, body, data, imageUrl },
        data?.type,
      );
    } catch (e) {
      this.logger.error(
        'Failed fetching users for area broadcast: ' + (e as Error).message,
      );
    }

    if (!this.isFirebaseReady) return;

    try {
      const sanitizedImageUrl = this.sanitizeImageUrl(imageUrl);
      const topic = `area_${area.replace(/\s+/g, '_')}`;
      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
          ...(sanitizedImageUrl ? { imageUrl: sanitizedImageUrl } : {}),
        },
        topic,
        data: {
          ...(data || {}),
          ...(sanitizedImageUrl
            ? { image: sanitizedImageUrl, imageUrl: sanitizedImageUrl }
            : {}),
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'offers_channel',
            imageUrl: sanitizedImageUrl,
          },
        },
        apns: {
          payload: { aps: { 'mutable-content': 1 } },
          fcmOptions: { imageUrl: sanitizedImageUrl },
        },
      };
      this.logger.debug(
        `Sending FCM area broadcast to ${topic}. Payload: ${JSON.stringify(message)}`,
      );
      await admin.messaging().send(message);
      this.logger.log(`FCM area broadcast to ${topic} sent successfully`);
    } catch (error) {
      this.logger.error(`sendToArea failed: ${(error as Error).message}`);
      if ((error as Error).stack) {
        this.logger.debug((error as Error).stack);
      }
    }
  }

  async sendToUser(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    imageUrl?: string,
  ): Promise<boolean> {
    if (!fcmToken) return false;

    // Save to DB (look up user by token)
    try {
      const user = await this.prisma.user.findFirst({ where: { fcmToken } });
      if (user) {
        await this.saveNotification(
          user.id,
          { title, body, data, imageUrl },
          data?.type,
        );
      }
    } catch (e) {
      this.logger.error(
        `Error saving notification to DB: ${(e as Error).message}`,
      );
    }

    if (!this.isFirebaseReady) return false;

    try {
      const sanitizedImageUrl = this.sanitizeImageUrl(imageUrl);
      const message: admin.messaging.Message = {
        notification: { title, body, imageUrl: sanitizedImageUrl },
        token: fcmToken,
        data: {
          ...(data || {}),
          ...(sanitizedImageUrl
            ? { image: sanitizedImageUrl, imageUrl: sanitizedImageUrl }
            : {}),
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'offers_channel',
            imageUrl: sanitizedImageUrl,
          },
        },
        apns: {
          payload: {
            aps: { sound: 'default', badge: 1, 'mutable-content': 1 },
          },
          fcmOptions: { imageUrl: sanitizedImageUrl },
        },
      };
      await admin.messaging().send(message);
      return true;
    } catch (error) {
      const msg = (error as Error).message;
      const isInvalidToken =
        msg.includes('registration-token-not-registered') ||
        msg.includes('Requested entity was not found');
      if (isInvalidToken) {
        await this.prisma.user.updateMany({
          where: { fcmToken },
          data: { fcmToken: null },
        });
        return false;
      }
      this.logger.error(`sendToUser failed: ${msg}`);
      return false;
    }
  }

  /**
   * Send a notification to a user by userId.
   * Always persists to DB — even if the user has no FCM token.
   * Only sends a push if FCM token is registered.
   */
  async sendToUserId(
    userId: string,
    notification: NotificationPayload,
  ): Promise<void> {
    // DB persistence is unconditional — user sees the notification in-app regardless
    await this.saveNotification(userId, notification, notification.data?.type);

    if (!this.isFirebaseReady) return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    if (!user?.fcmToken) return;

    // Send FCM push without re-saving to DB (already saved above)
    try {
      const sanitizedImageUrl = this.sanitizeImageUrl(notification.imageUrl);
      const message: admin.messaging.Message = {
        notification: {
          title: notification.title,
          body: notification.body,
          ...(sanitizedImageUrl ? { imageUrl: sanitizedImageUrl } : {}),
        },
        token: user.fcmToken,
        data: {
          ...(notification.data || {}),
          ...(sanitizedImageUrl
            ? { image: sanitizedImageUrl, imageUrl: sanitizedImageUrl }
            : {}),
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'offers_channel',
            imageUrl: sanitizedImageUrl,
          },
        },
        apns: {
          payload: {
            aps: { sound: 'default', badge: 1, 'mutable-content': 1 },
          },
          fcmOptions: { imageUrl: sanitizedImageUrl },
        },
      };
      await admin.messaging().send(message);
    } catch (error) {
      const msg = (error as Error).message;
      if (
        msg.includes('registration-token-not-registered') ||
        msg.includes('Requested entity was not found')
      ) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { fcmToken: null },
        });
      }
      this.logger.error(`sendToUserId FCM failed for user ${userId}: ${msg}`);
    }
  }

  /**
   * Send a notification to multiple users by userId[].
   * Always persists to DB for ALL users upfront — regardless of FCM token status.
   */
  async sendToUserIds(
    userIds: string[],
    notification: NotificationPayload,
  ): Promise<{ sent: number; skipped: number }> {
    if (userIds.length === 0) return { sent: 0, skipped: 0 };

    // DB persistence is unconditional and bulk
    await this.saveNotificationsForUsers(
      userIds,
      notification,
      notification.data?.type,
    );

    if (!this.isFirebaseReady) return { sent: 0, skipped: userIds.length };

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fcmToken: true },
    });

    let sent = 0;
    let skipped = 0;

    for (const user of users) {
      if (!user.fcmToken) {
        skipped += 1;
        continue;
      }

      // Send FCM push without re-saving to DB
      try {
        const sanitizedImageUrl = this.sanitizeImageUrl(notification.imageUrl);
        const message: admin.messaging.Message = {
          notification: {
            title: notification.title,
            body: notification.body,
            ...(sanitizedImageUrl ? { imageUrl: sanitizedImageUrl } : {}),
          },
          token: user.fcmToken,
          data: {
            ...(notification.data || {}),
            ...(sanitizedImageUrl
              ? { image: sanitizedImageUrl, imageUrl: sanitizedImageUrl }
              : {}),
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'offers_channel',
              imageUrl: sanitizedImageUrl,
            },
          },
          apns: {
            payload: {
              aps: { sound: 'default', badge: 1, 'mutable-content': 1 },
            },
            fcmOptions: { imageUrl: sanitizedImageUrl },
          },
        };
        await admin.messaging().send(message);
        sent += 1;
      } catch (error) {
        const msg = (error as Error).message;
        if (
          msg.includes('registration-token-not-registered') ||
          msg.includes('Requested entity was not found')
        ) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { fcmToken: null },
          });
        }
        skipped += 1;
      }
    }

    const notFound = Math.max(0, userIds.length - users.length);
    skipped += notFound;

    return { sent, skipped };
  }

  async notifyNewOfferInArea(
    area: string,
    storeName: string,
    offerTitle: string,
    offerId: string,
    imageUrl?: string,
  ): Promise<void> {
    await this.sendToArea(
      area,
      `عرض جديد في ${area}`,
      `${storeName}: "${offerTitle}" - متاح الآن لفترة محدودة.`,
      { offerId, type: 'NEW_OFFER', area },
      imageUrl,
    );
  }

  async notifyStoreApproved(
    fcmToken: string,
    storeName: string,
    storeId: string,
  ): Promise<void> {
    await this.sendToUser(
      fcmToken,
      'تم اعتماد متجرك بنجاح',
      `تمت الموافقة على "${storeName}". يمكنك الآن البدء في إضافة عروضك.`,
      { storeId, type: 'STORE_APPROVED' },
    );
  }

  async notifyOfferApproved(
    fcmToken: string,
    offerTitle: string,
    offerId: string,
    imageUrl?: string,
  ): Promise<void> {
    await this.sendToUser(
      fcmToken,
      'تم اعتماد عرضك بنجاح',
      `عرضك "${offerTitle}" متاح الآن لجميع العملاء.`,
      { offerId, type: 'OFFER_APPROVED' },
      imageUrl,
    );
  }

  async notifyCouponRedeemed(
    fcmToken: string,
    offerTitle: string,
    storeName: string,
  ): Promise<void> {
    await this.sendToUser(
      fcmToken,
      'تم استخدام الكوبون بنجاح',
      `تم تفعيل خصمك لدى "${storeName}" على عرض "${offerTitle}".`,
      { type: 'COUPON_REDEEMED' },
    );
  }

  async notifyCouponGeneratedForMerchant(
    fcmToken: string,
    offerTitle: string,
    customerName: string,
  ): Promise<void> {
    await this.sendToUser(
      fcmToken,
      'كوبون جديد مستخرج',
      `حصل العميل "${customerName}" على كوبون لعرض "${offerTitle}".`,
      { type: 'COUPON_GENERATED' },
    );
  }
}
