import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async getConversations(userId: string, role: string) {
    const where = role === 'ADMIN' 
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
    const message = await this.prisma.message.create({
      data: {
        text,
        sender: { connect: { id: senderId } },
        conversation: { connect: { id: conversationId } },
      },
      include: {
        conversation: true,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Notify the other participant via Socket.io
    const otherId = message.conversation.adminId === senderId 
      ? message.conversation.participantId 
      : message.conversation.adminId;

    this.eventsGateway.server.to(otherId).emit('new_message', message);

    return message;
  }

  async startConversation(adminId: string, participantId: string, type: string) {
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        adminId,
        participantId,
        type,
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          adminId,
          participantId,
          type,
        },
      });
    }

    return conversation;
  }
}
