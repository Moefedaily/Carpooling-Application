import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/conversations')
@UseGuards(JwtAuthGuard)
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  create(@Body() createConversationDto: CreateConversationDto) {
    return this.conversationService.createConversation(
      createConversationDto.tripId,
      createConversationDto.passengerId,
    );
  }

  @Get('user')
  findConversationsForUser(@Request() req) {
    return this.conversationService.findConversationsForUser(req.user.userId);
  }

  @Get('trip/:tripId/passenger/:passengerId')
  findConversation(
    @Param('tripId') tripId: string,
    @Param('passengerId') passengerId: string,
  ) {
    return this.conversationService.findConversation(+tripId, +passengerId);
  }
}
