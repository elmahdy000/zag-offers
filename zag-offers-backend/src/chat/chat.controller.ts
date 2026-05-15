import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('chat (المحادثات)')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'عرض كل المحادثات الخاصة بي' })
  getConversations(@Request() req: any) {
    return this.chatService.getConversations(req.user.id, req.user.role);
  }

  @Get('messages/:conversationId')
  @ApiOperation({ summary: 'عرض رسائل محادثة معينة' })
  getMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.getMessages(conversationId);
  }

  @Post('send')
  @ApiOperation({ summary: 'إرسال رسالة في محادثة' })
  sendMessage(
    @Body() body: { conversationId: string; text: string },
    @Request() req: any,
  ) {
    if (!body.conversationId || !body.text) {
      throw new HttpException(
        'conversationId and text are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.chatService.sendMessage(
      body.conversationId,
      req.user.id,
      body.text,
    );
  }

  @Post('start')
  @ApiOperation({ summary: 'بدء محادثة جديدة مع الأدمن' })
  async startConversation(
    @Body() body: { participantId?: string; type?: string },
    @Request() req: any,
  ) {
    // If caller is ADMIN, they provide participantId
    // If caller is MERCHANT/CUSTOMER, they start a conversation with the first admin
    if (req.user.role === 'ADMIN') {
      if (!body.participantId) {
        throw new HttpException(
          'participantId is required for admin',
          HttpStatus.BAD_REQUEST,
        );
      }
      return this.chatService.startConversation(
        req.user.id,
        body.participantId,
        body.type || 'MERCHANT_SUPPORT',
      );
    } else {
      // Non-admin: start/get conversation with the first admin in DB
      const conv = await this.chatService.startConversationWithAnyAdmin(
        req.user.id,
        body.type || 'MERCHANT_SUPPORT',
      );
      return conv;
    }
  }
}
