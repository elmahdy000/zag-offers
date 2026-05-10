import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('auth (نظام الدخول والتسجيل)')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ strict: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'تسجيل حساب جديد' })
  @ApiResponse({ status: 201, description: 'تم التسجيل بنجاح' })
  @ApiResponse({ status: 409, description: 'رقم الموبايل مسجل مسبقاً' })
  @ApiResponse({ status: 429, description: 'تجاوزت الحد المسموح من محاولات التسجيل' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Throttle({ short: { limit: 5, ttl: 1000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تسجيل الدخول بالهاتف' })
  @ApiResponse({ status: 200, description: 'تم الدخول بنجاح ويرجع التوكن' })
  @ApiResponse({ status: 401, description: 'البيانات غير صحيحة' })
  @ApiResponse({ status: 429, description: 'تجاوزت الحد المسموح من محاولات الدخول' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.phone,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException(
        'رقم الموبايل أو كلمة السر غلط، يا ريت تتأكد منهم',
      );
    }
    return this.authService.login(user);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تسجيل الدخول باستخدام جوجل' })
  @ApiBody({
    schema: {
      properties: {
        idToken: { type: 'string', example: 'google_id_token_here' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'تم الدخول بنجاح' })
  async googleLogin(@Body('idToken') idToken: string) {
    return this.authService.googleLogin(idToken);
  }

  @Post('facebook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تسجيل الدخول باستخدام فيسبوك' })
  @ApiBody({
    schema: {
      properties: {
        accessToken: { type: 'string', example: 'facebook_access_token_here' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'تم الدخول بنجاح' })
  async facebookLogin(@Body('accessToken') accessToken: string) {
    return this.authService.facebookLogin(accessToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الحصول على بيانات المستخدم الحالي' })
  @ApiResponse({ status: 200, description: 'ترجع بيانات المستخدم' })
  getMe(@Request() req: { user: { id: string } }) {
    return this.authService.getMe(req.user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'تحديث بيانات الملف الشخصي (الاسم، المنطقة، الصورة)',
  })
  @ApiBody({
    schema: {
      properties: {
        name: { type: 'string', example: 'أحمد محمد' },
        area: { type: 'string', example: 'القومية' },
        avatar: { type: 'string', example: 'https://...' },
      },
    },
  })
  updateProfile(
    @Request() req: { user: { id: string } },
    @Body() body: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.id, body);
  }

  @Post('fcm-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تسجيل توكن الإشعارات (FCM Token)' })
  @ApiBody({
    schema: {
      properties: {
        fcmToken: { type: 'string', example: 'fcm_device_token_here' },
      },
    },
  })
  registerFcmToken(
    @Request() req: { user: { id: string } },
    @Body('fcmToken') fcmToken: string,
  ) {
    return this.authService.updateFcmToken(req.user.id, fcmToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تسجيل الخروج (مسح FCM Token)' })
  @ApiResponse({ status: 200, description: 'تم تسجيل الخروج بنجاح' })
  logout(@Request() req: { user: { id: string } }) {
    return this.authService.logout(req.user.id);
  }

  @Post('password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تغيير كلمة السر' })
  @ApiBody({
    schema: {
      properties: {
        currentPassword: { type: 'string' },
        newPassword: { type: 'string' },
      },
    },
  })
  updatePassword(
    @Request() req: { user: { id: string } },
    @Body() body: { currentPassword?: string; newPassword?: string },
  ) {
    return this.authService.updatePassword(req.user.id, body);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'إرسال كود استعادة كلمة المرور عبر البريد' })
  @ApiBody({
    schema: {
      properties: {
        email: { type: 'string', example: 'user@example.com' },
      },
    },
  })
  forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'إعادة تعيين كلمة المرور باستخدام الكود' })
  @ApiBody({
    schema: {
      properties: {
        email: { type: 'string' },
        otp: { type: 'string' },
        newPassword: { type: 'string' },
      },
    },
  })
  resetPassword(
    @Body() body: { email: string; otp: string; newPassword: string },
  ) {
    return this.authService.resetPassword(body.email, body.otp, body.newPassword);
  }
}
