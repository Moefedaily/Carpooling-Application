import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  private logger = new Logger(MessagesController.name);
  constructor(private readonly messagesService: MessagesService) {}

  @Post('trip/:tripId')
  async createMessage(
    @Request() req,
    @Param('tripId') tripId: string,
    @Body('content') content: string,
    @Body('receiverId') receiverId?: number,
  ) {
    this.logger.debug('Request user: ' + JSON.stringify(req.user));
    this.logger.debug(
      `Creating message - senderId: ${req.user.userId}, tripId: ${tripId}, content: ${content}, receiverId: ${receiverId}`,
    );

    const result = await this.messagesService.createMessage(
      req.user.userId,
      +tripId,
      content,
      receiverId,
    );

    this.logger.debug(`Message created: ${JSON.stringify(result)}`);

    return result;
  }

  @Get('trip/:tripId')
  async getMessagesForTrip(@Request() req, @Param('tripId') tripId: string) {
    return this.messagesService.findMessagesForTrip(+tripId, req.user.userId);
  }

  @Post(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    return this.messagesService.markAsRead(+id, req.user.userId);
  }
}
