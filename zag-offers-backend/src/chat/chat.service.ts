import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  private get conversation() {
    return (this.prisma as any).conversation;
  }

  private get message() {
    return (this.prisma as any).message;
  }

  async getConversations(userId: string, role: string) {
    const where =
      role === 'ADMIN'
        ? { adminId: userId }
        : { participantId: userId };

    return this.conversation.findMany({
      where,
      include: {
        admin: { select: { id: true, name: true, avatar: true } },
        participant: { select: { id: true, name: true, avatar: true, role: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getMessages(conversationId: string) {
    return this.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(conversationId: string, senderId: string, text: string) {
    // Verify conversation exists
    const conv = await this.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) {
      throw new NotFoundException('Conversation not found');
    }

    const msg = await this.message.create({
      data: {
        text,
        senderId,
        conversationId,
      },
    });

    await this.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Notify the other participant via EventsGateway
    const otherId = conv.adminId === senderId ? conv.participantId : conv.adminId;

    this.eventsGateway.notifyUser(otherId, 'new_message', {
      ...msg,
      conversationId,
    });

    return msg;
  }

  async startConversation(adminId: string, participantId: string, type: string) {
    let conv = await this.conversation.findFirst({
      where: { adminId, participantId, type },
    });

    if (!conv) {
      conv = await this.conversation.create({
        data: { adminId, participantId, type },
      });
    }

    return conv;
  }

  async startConversationWithAnyAdmin(participantId: string, type: string) {
    const existing = await this.conversation.findFirst({
      where: { participantId, type },
      include: {
        admin: { select: { id: true, name: true, avatar: true } },
        participant: { select: { id: true, name: true, avatar: true, role: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (existing) return existing;

    const admin = await (this.prisma as any).user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    if (!admin) {
      throw new NotFoundException('No admin found');
    }

    const conv = await this.conversation.create({
      data: {
        adminId: admin.id,
        participantId,
        type,
      },
      include: {
        admin: { select: { id: true, name: true, avatar: true } },
        participant: { select: { id: true, name: true, avatar: true, role: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    return conv;
  }
}
