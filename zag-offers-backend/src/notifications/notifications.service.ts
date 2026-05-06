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
    return imageUrl ? imageUrl.replace(/([^:])\/\//g, '$1/') : undefined;
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
    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken: token },
    });

    if (!this.isFirebaseReady) {
      return;
    }

    try {
      await admin.messaging().subscribeToTopic([token], 'all_users');

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { area: true },
      });

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
      select: { fcmToken: true, area: true },
    });

    if (!user?.fcmToken) {
      return;
    }

    if (this.isFirebaseReady) {
      try {
        await admin
          .messaging()
          .unsubscribeFromTopic([user.fcmToken], 'all_users');

        if (user.area) {
          await admin
            .messaging()
            .unsubscribeFromTopic(
              [user.fcmToken],
              `area_${user.area.replace(/\s+/g, '_')}`,
            );
        }
      } catch {
        // ignore unsubscribe failure
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken: null },
    });
  }

  async sendToAll(
    title: string,
    body: string,
    data?: Record<string, string>,
    imageUrl?: string,
  ): Promise<void> {
    if (!this.isFirebaseReady) {
      // Still save to DB even if Firebase is disabled
    }

    // Save to DB
    try {
      const allUsers = await this.prisma.user.findMany({
        select: { id: true },
      });
      await this.saveNotificationsForUsers(
        allUsers.map((u) => u.id),
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

      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
          ...(sanitizedImageUrl ? { imageUrl: sanitizedImageUrl } : {}),
        },
        topic: 'all_users',
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

      this.logger.debug(
        `Sending FCM broadcast to all_users. Payload: ${JSON.stringify(message)}`,
      );
      await admin.messaging().send(message);
      this.logger.log('FCM broadcast sent successfully');
    } catch (error) {
      this.logger.error(`sendToAll failed: ${(error as Error).message}`);
      if ((error as Error).stack) {
        this.logger.debug((error as Error).stack);
      }
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

    // Save to DB
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

    if (!this.isFirebaseReady) {
      return;
    }

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

    // Save to DB
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

    if (!this.isFirebaseReady) {
      return false;
    }

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
      const message = (error as Error).message;
      const isInvalidToken =
        message.includes('registration-token-not-registered') ||
        message.includes('Requested entity was not found');
      if (isInvalidToken) {
        await this.prisma.user.updateMany({
          where: { fcmToken },
          data: { fcmToken: null },
        });
        return false;
      }
      this.logger.error(`sendToUser failed: ${message}`);
      return false;
    }
  }

  async sendToUserId(
    userId: string,
    notification: NotificationPayload,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    if (!user?.fcmToken) {
      return;
    }

    await this.sendToUser(
      user.fcmToken,
      notification.title,
      notification.body,
      notification.data,
      notification.imageUrl,
    );
  }

  async sendToUserIds(
    userIds: string[],
    notification: NotificationPayload,
  ): Promise<{ sent: number; skipped: number }> {
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
      const ok = await this.sendToUser(
        user.fcmToken,
        notification.title,
        notification.body,
        notification.data,
        notification.imageUrl,
      );
      if (ok) {
        sent += 1;
      } else {
        skipped += 1;
      }
    }

    // Include user IDs that were not found in DB
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

  isReady(): boolean {
    return this.isFirebaseReady;
  }
}
