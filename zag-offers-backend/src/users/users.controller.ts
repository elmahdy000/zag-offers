import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('users (الملف الشخصي)')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'عرض بيانات الملف الشخصي' })
  @ApiResponse({ status: 200, description: 'ترجع بيانات المستخدم الحالية' })
  getProfile(@Request() req: { user: { id: string } }) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'تحديث بيانات الملف الشخصي' })
  updateProfile(
    @Request() req: { user: { id: string } },
    @Body() updateData: UpdateProfileDto,
  ) {
    return this.usersService.update(req.user.id, updateData);
  }
}
