import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

function getAllowedOrigins(): string[] {
  const rawOrigins = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGINS;
  if (rawOrigins) {
    return rawOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  // Safe defaults including production domains
  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://zagoffers.online',
    'https://www.zagoffers.online',
    'https://vendor.zagoffers.online',
    'https://admin.zagoffers.online',
  ];
}

export interface WsNewOffer {
  offerId: string;
  title: string;
  discount: string;
  storeName: string;
  storeArea: string;
  categoryName?: string;
}

export interface WsSocialProof {
  storeName: string;
  offerTitle: string;
  couponCount?: number;
}

export interface WsAdminNotification {
  type:
    | 'NEW_PENDING_OFFER'
    | 'NEW_PENDING_STORE'
    | 'NEW_REVIEW'
    | 'NEW_USER'
    | 'SYSTEM';
  title: string;
  body: string;
  payload?: Record<string, unknown>;
  timestamp: string;
}

export interface WsMerchantNotification {
  type:
    | 'STORE_APPROVED'
    | 'STORE_REJECTED'
    | 'STORE_SUSPENDED'
    | 'OFFER_APPROVED'
    | 'OFFER_REJECTED'
    | 'OFFER_UPDATED'
    | 'NEW_REVIEW'
    | 'COUPON_REDEEMED'
    | 'COUPON_GENERATED';
  title: string;
  body: string;
  payload?: Record<string, unknown>;
  timestamp: string;
}

export interface WsCouponUpdate {
  status: 'USED' | 'EXPIRED';
  code: string;
  offerTitle?: string;
  storeName?: string;
}

export interface WsAnnouncement {
  title: string;
  body: string;
  area?: string;
  timestamp: string;
}

interface ConnectedClient {
  userId: string;
  role: string;
  area?: string;
  socketId: string;
  connectedAt: Date;
}

interface JwtSocketPayload {
  sub: string;
  role: string;
  area?: string;
}

interface JoinRoomPayload {
  token: string;
  room?: string;
}

@WebSocketGateway({
  cors: {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const allowedOrigins = getAllowedOrigins();
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS blocked'));
    },
    credentials: true,
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private connectedClients = new Map<string, ConnectedClient>();

  constructor(private jwtService: JwtService) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  private isJwtPayload(value: unknown): value is JwtSocketPayload {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const payload = value as Partial<JwtSocketPayload>;
    return typeof payload.sub === 'string' && typeof payload.role === 'string';
  }

  private extractBearerToken(client: Socket): string | undefined {
    const handshakeAuth = client.handshake.auth as
      | Record<string, unknown>
      | undefined;
    const authToken = handshakeAuth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken;
    }

    const headerToken = client.handshake.headers.authorization;
    if (typeof headerToken === 'string' && headerToken.startsWith('Bearer ')) {
      return headerToken.slice(7);
    }

    return undefined;
  }

  private decodeToken(token: string): JwtSocketPayload | null {
    const decoded = this.jwtService.verify(token) as unknown;
    return this.isJwtPayload(decoded) ? decoded : null;
  }

  private areaRoom(area: string) {
    return `area_${area.replace(/\s+/g, '_')}`;
  }

  private registerConnectedClient(client: Socket, payload: JwtSocketPayload) {
    const clientInfo: ConnectedClient = {
      userId: payload.sub,
      role: payload.role,
      area: payload.area,
      socketId: client.id,
      connectedAt: new Date(),
    };

    this.connectedClients.set(client.id, clientInfo);
  }

  handleConnection(client: Socket) {
    const token = this.extractBearerToken(client);

    if (!token) {
      this.logger.log(`Guest connected: ${client.id}`);
      return;
    }

    try {
      const decoded = this.decodeToken(token);
      if (!decoded) {
        throw new Error('Invalid token payload');
      }

      this.registerConnectedClient(client, decoded);
      void client.join(decoded.sub);

      if (decoded.role === 'ADMIN') {
        void client.join('admin_room');
        this.logger.log(`Admin connected: ${decoded.sub}`);
      }

      if (decoded.area) {
        void client.join(this.areaRoom(decoded.area));
      }

      client.emit('connected', {
        userId: decoded.sub,
        role: decoded.role,
        rooms: [
          decoded.sub,
          decoded.role === 'ADMIN' ? 'admin_room' : null,
        ].filter((room): room is string => typeof room === 'string'),
      });

      this.logger.log(
        `Auth connected: ${decoded.sub} (${decoded.role}) - socket: ${client.id}`,
      );
    } catch {
      this.logger.warn(`Invalid token from socket: ${client.id}`);
      client.emit('auth_warning', {
        message: 'توكن غير صالح - اتصلت كضيف بدون صلاحيات',
      });
    }
  }

  handleDisconnect(client: Socket) {
    const info = this.connectedClients.get(client.id);
    if (info) {
      this.logger.log(`Disconnected: ${info.userId} (${info.role})`);
      this.connectedClients.delete(client.id);
      return;
    }

    this.logger.log(`Guest disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    if (!payload?.token) {
      client.emit('error', { message: 'مطلوب التوكن للانضمام لغرفة خاصة' });
      return;
    }

    try {
      const decoded = this.decodeToken(payload.token);
      if (!decoded) {
        throw new Error('Invalid token payload');
      }

      const targetRoom = payload.room || decoded.sub;

      if (targetRoom === 'admin_room' && decoded.role !== 'ADMIN') {
        client.emit('error', {
          message: 'غير مصرح لك بالدخول لغرفة الأدمن',
        });
        return;
      }

      if (targetRoom !== 'admin_room' && targetRoom !== decoded.sub) {
        client.emit('error', {
          message: 'مسموح لك تدخل غرفتك الخاصة فقط',
        });
        return;
      }

      void client.join(targetRoom);
      this.registerConnectedClient(client, decoded);

      if (decoded.area) {
        void client.join(this.areaRoom(decoded.area));
      }

      client.emit('room_joined', { room: targetRoom, userId: decoded.sub });
      this.logger.log(`${decoded.sub} joined room: ${targetRoom}`);
    } catch {
      client.emit('error', { message: 'التوكن غير صالح أو منتهي الصلاحية' });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  broadcastNewOffer(offer: WsNewOffer | Record<string, unknown>) {
    const offerTitle =
      'title' in offer && typeof offer.title === 'string' ? offer.title : 'N/A';

    this.server.emit('new_offer', {
      ...offer,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Broadcast new offer: ${offerTitle}`);
  }

  broadcastSocialProof(data: WsSocialProof) {
    this.server.emit('social_proof', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastToArea(area: string, event: string, data: Record<string, unknown>) {
    this.server.to(this.areaRoom(area)).emit(event, {
      ...data,
      area,
      timestamp: new Date().toISOString(),
    });
  }

  notifyAdmin(data: Omit<WsAdminNotification, 'timestamp'>) {
    this.server.to('admin_room').emit('admin_notification', {
      ...data,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Admin notified: ${data.type} - ${data.title}`);
  }

  notifyMerchant(
    merchantId: string,
    data: Omit<WsMerchantNotification, 'timestamp'>,
  ) {
    this.server.to(merchantId).emit('merchant_notification', {
      ...data,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Merchant ${merchantId} notified: ${data.type}`);
  }

  notifyCouponStatus(userId: string, data: WsCouponUpdate) {
    this.server.to(userId).emit('coupon_update', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  notifyUser(userId: string, event: string, data: Record<string, unknown>) {
    this.server.to(userId).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  getConnectedCount(): number {
    return this.connectedClients.size;
  }

  getConnectedClients(): ConnectedClient[] {
    return Array.from(this.connectedClients.values());
  }
}
