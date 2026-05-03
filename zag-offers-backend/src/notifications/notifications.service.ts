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
      return;
    }

    try {
      const message: admin.messaging.Message = {
        notification: { title, body, imageUrl },
        topic: 'all_users',
        data: data || {},
        android: {
          priority: 'high',
          notification: { sound: 'default', channelId: 'offers_channel' },
        },
        apns: {
          payload: { aps: { sound: 'default', badge: 1 } },
          fcmOptions: { imageUrl },
        },
      };

      await admin.messaging().send(message);
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
    if (!this.isFirebaseReady || !area) {
      return;
    }

    try {
      const topic = `area_${area.replace(/\s+/g, '_')}`;
      const message: admin.messaging.Message = {
        notification: { title, body, imageUrl },
        topic,
        data: data || {},
        android: {
          priority: 'high',
          notification: { sound: 'default', channelId: 'offers_channel' },
        },
        apns: {
          fcmOptions: { imageUrl },
        },
      };

      await admin.messaging().send(message);
    } catch (error) {
      this.logger.error(`sendToArea failed: ${(error as Error).message}`);
    }
  }

  async sendToUser(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    imageUrl?: string,
  ): Promise<void> {
    if (!this.isFirebaseReady || !fcmToken) {
      return;
    }

    try {
      const message: admin.messaging.Message = {
        notification: { title, body, imageUrl },
        token: fcmToken,
        data: data || {},
        android: {
          priority: 'high',
          notification: { sound: 'default', channelId: 'offers_channel' },
        },
        apns: {
          payload: { aps: { sound: 'default', badge: 1 } },
          fcmOptions: { imageUrl },
        },
      };

      await admin.messaging().send(message);
    } catch (error) {
      const message = (error as Error).message;
      if (!message.includes('registration-token-not-registered')) {
        this.logger.error(`sendToUser failed: ${message}`);
      }
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
