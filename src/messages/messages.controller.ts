import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageService } from './messages.service';

@Controller('api/messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
  private readonly logger = new Logger(MessageController.name);
  constructor(private readonly messageService: MessageService) {}

  @Post()
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messageService.createMessage(createMessageDto);
  }

  @Get('conversation/:conversationId')
  findMessagesForConversation(@Param('conversationId') conversationId: string) {
    return this.messageService.findMessagesForConversation(+conversationId);
  }

  @Put(':id/read')
  update(@Param('id') id: string, @Request() req) {
    return this.messageService.markAsRead(+id, req.user.userId);
  }

  @Get('unread-count')
  getUnreadCount(@Request() req) {
    return this.messageService.getUnreadCount(req.user.userId);
  }
  @Get('recent')
  async getRecentMessages(@Request() req) {
    this.logger.debug(
      `getRecentMessages: ${JSON.stringify(this.messageService.getRecentMessagesForUser(req.user.userId))}`,
    );
    return this.messageService.getRecentMessagesForUser(req.user.userId);
  }
}
