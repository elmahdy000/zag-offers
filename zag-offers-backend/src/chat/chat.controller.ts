import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
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
    @Request() req: any
  ) {
    return this.chatService.sendMessage(body.conversationId, req.user.id, body.text);
  }

  @Post('start')
  @ApiOperation({ summary: 'بدء محادثة جديدة' })
  startConversation(
    @Body() body: { participantId: string; type: string },
    @Request() req: any
  ) {
    // Only Admin can start conversations for now, or users can start with admin
    // For simplicity, we assume one participant is Admin
    const adminId = req.user.role === 'ADMIN' ? req.user.id : 'ADMIN_ID_FIXED'; // Needs logic to find admin
    return this.chatService.startConversation(adminId, body.participantId, body.type);
  }
}
