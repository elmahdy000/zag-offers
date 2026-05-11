import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async getConversations(userId: string, role: string) {
    const where =
      role === 'ADMIN'
        ? { adminId: userId }
        : { participantId: userId };

    return this.prisma.conversation.findMany({
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
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(conversationId: string, senderId: string, text: string) {
    // Verify conversation exists
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const message = await this.prisma.message.create({
      data: {
        text,
        senderId,
        conversationId,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Notify the other participant via Socket.io
    const otherId =
      conversation.adminId === senderId
        ? conversation.participantId
        : conversation.adminId;

    this.eventsGateway.server.to(otherId).emit('new_message', {
      ...message,
      conversationId,
    });

    return message;
  }

  async startConversation(adminId: string, participantId: string, type: string) {
    // Find existing or create
    let conversation = await this.prisma.conversation.findFirst({
      where: { adminId, participantId, type },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { adminId, participantId, type },
      });
    }

    return conversation;
  }

  /**
   * For non-admin users: find or create a conversation with any admin in the system.
   */
  async startConversationWithAnyAdmin(participantId: string, type: string) {
    // First check if there's already a conversation for this participant
    const existing = await this.prisma.conversation.findFirst({
      where: { participantId, type },
      include: {
        admin: { select: { id: true, name: true, avatar: true } },
        participant: { select: { id: true, name: true, avatar: true, role: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (existing) return existing;

    // Find first admin user
    const admin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    if (!admin) {
      throw new NotFoundException('No admin found in the system');
    }

    const conversation = await this.prisma.conversation.create({
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

    return conversation;
  }
}
