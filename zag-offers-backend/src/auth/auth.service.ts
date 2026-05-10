import {
  ConflictException,
  InternalServerErrorException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import * as nodemailer from 'nodemailer';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';

type SanitizedUser = Omit<
  User,
  | 'password'
  | 'googleId'
  | 'facebookId'
  | 'fcmToken'
  | 'resetOtp'
  | 'resetOtpExpiry'
>;

type UserWithReset = User & {
  resetOtp?: string | null;
  resetOtpExpiry?: Date | null;
};

type LoginUser = Pick<
  User,
  'id' | 'name' | 'phone' | 'email' | 'role' | 'avatar'
>;

type SocialProvider = 'google' | 'facebook';

type SocialPayload = {
  sub?: string;
  id?: string;
  email?: string;
  name?: string;
  picture?: string;
};

type FacebookResponse = {
  id: string;
  email?: string;
  name?: string;
  picture?: { data?: { url?: string } };
};

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  private transporter: nodemailer.Transporter;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    // Configure nodemailer transporter with Gmail
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  private sanitizeUser(user: User): SanitizedUser {
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      area: user.area,
      points: user.points,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async validateUser(
    phone: string,
    pass: string,
  ): Promise<SanitizedUser | null> {
    const user = await this.usersService.findOne(phone);
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      return this.sanitizeUser(user);
    }

    return null;
  }

  login(user: LoginUser) {
    const payload = {
      sub: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  async register(data: RegisterDto) {
    const existing = await this.usersService.findOne(data.phone);
    if (existing) {
      throw new ConflictException(
        'الرقم ده مسجل عندنا قبل كدة، جرب تدخل بحسابك',
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.usersService.create({
      ...data,
      password: hashedPassword,
    });

    return this.sanitizeUser(user);
  }

  async googleLogin(idToken: string) {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new InternalServerErrorException(
          'Google login is not configured on the server',
        );
      }

      let payload: SocialPayload | undefined;

      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });
      const googlePayload = ticket.getPayload();
      if (googlePayload) {
        payload = {
          sub: googlePayload.sub,
          email: googlePayload.email,
          name: googlePayload.name,
          picture: googlePayload.picture,
        };
      }

      if (!payload?.sub) {
        throw new UnauthorizedException('فشل التحقق من حساب جوجل');
      }

      return this.handleSocialLogin(
        'google',
        payload.sub,
        payload.email,
        payload.name,
        payload.picture,
      );
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new UnauthorizedException('فشل تسجيل الدخول باستخدام جوجل');
    }
  }

  async facebookLogin(accessToken: string) {
    try {
      const response = await axios.get<FacebookResponse>(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`,
      );
      const data = response.data;

      if (!data?.id) {
        throw new UnauthorizedException('فشل التحقق من حساب فيسبوك');
      }

      return this.handleSocialLogin(
        'facebook',
        data.id,
        data.email,
        data.name,
        data.picture?.data?.url,
      );
    } catch {
      throw new UnauthorizedException('فشل تسجيل الدخول باستخدام فيسبوك');
    }
  }

  private async handleSocialLogin(
    provider: SocialProvider,
    providerId: string,
    email?: string,
    name?: string,
    avatar?: string,
  ) {
    const idField = provider === 'google' ? 'googleId' : 'facebookId';

    let user = await this.prismaFindUserByProviderId(provider, providerId);

    if (!user) {
      if (email) {
        user = await this.usersService.findByEmail(email);
      }

      if (user) {
        user = await this.usersService.update(user.id, {
          avatar: avatar || user.avatar,
          [idField]: providerId,
        });
      } else {
        user = await this.usersService.create({
          email,
          name: name || 'مستخدم جديد',
          avatar,
          role: 'CUSTOMER',
          [idField]: providerId,
        });
      }
    }

    return this.login(user);
  }

  private async prismaFindUserByProviderId(
    provider: SocialProvider,
    id: string,
  ) {
    if (provider === 'google') {
      return this.usersService.findByGoogleId(id);
    }

    return this.usersService.findByFacebookId(id);
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('المستخدم غير موجود');
    }

    return this.sanitizeUser(user);
  }

  async updateProfile(
    userId: string,
    data: { name?: string; area?: string; avatar?: string },
  ) {
    const user = await this.usersService.update(userId, data);
    return this.sanitizeUser(user);
  }

  async updateFcmToken(userId: string, token: string) {
    await this.usersService.update(userId, { fcmToken: token });
    return { success: true, message: 'تم تسجيل توكن الإشعارات بنجاح' };
  }

  async logout(userId: string) {
    // Clear the FCM token so the device stops receiving push notifications
    await this.usersService.update(userId, { fcmToken: null });
    return { success: true, message: 'تم تسجيل الخروج بنجاح' };
  }

  async updatePassword(
    userId: string,
    data: { currentPassword?: string; newPassword?: string },
  ) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.password) {
      throw new UnauthorizedException('المستخدم غير موجود أو لا يملك كلمة سر');
    }

    if (!data.currentPassword || !data.newPassword) {
      throw new ConflictException('يجب إدخال كلمة السر الحالية والجديدة');
    }

    const isMatch = await bcrypt.compare(data.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('كلمة السر الحالية غير صحيحة');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    await this.usersService.update(userId, { password: hashedPassword });

    return { success: true, message: 'تم تغيير كلمة السر بنجاح' };
  }

  async forgotPassword(email: string) {
    if (!email) throw new ConflictException('يجب إدخال البريد الإلكتروني');

    const user = (await this.usersService.findByEmail(email)) as UserWithReset;
    if (!user) {
      // Return success even if not found to prevent email enumeration
      return {
        success: true,
        message: 'إذا كان البريد مسجلاً، فسيصلك كود التحقق قريباً',
      };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 15); // 15 mins expiry

    // Save to DB
    await this.usersService.update(user.id, {
      resetOtp: hashedOtp,
      resetOtpExpiry: expiry,
    });

    // Send Email
    try {
      await this.transporter.sendMail({
        from: `"Zag Offers" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'كود استعادة كلمة المرور - Zag Offers',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; text-align: center; color: #333;">
            <h2 style="color: #FF6B00;">عروض الزقازيق</h2>
            <p>لقد طلبت استعادة كلمة المرور الخاصة بك.</p>
            <p>كود التحقق الخاص بك هو:</p>
            <h1 style="background: #eee; padding: 10px; letter-spacing: 5px;">${otp}</h1>
            <p>هذا الكود صالح لمدة 15 دقيقة فقط.</p>
            <p>إذا لم تطلب هذا الكود، يرجى تجاهل هذه الرسالة.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('Failed to send OTP email:', err);
      throw new InternalServerErrorException(
        'حدث خطأ أثناء إرسال البريد الإلكتروني',
      );
    }

    return {
      success: true,
      message: 'إذا كان البريد مسجلاً، فسيصلك كود التحقق قريباً',
    };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    if (!email || !otp || !newPassword) {
      throw new ConflictException(
        'الرجاء إدخال البريد الإلكتروني والكود وكلمة السر الجديدة',
      );
    }

    const user = (await this.usersService.findByEmail(email)) as UserWithReset;
    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      throw new UnauthorizedException('الكود غير صحيح أو منتهي الصلاحية');
    }

    if (new Date() > user.resetOtpExpiry) {
      throw new UnauthorizedException(
        'الكود منتهي الصلاحية، يرجى طلب كود جديد',
      );
    }

    const isMatch = await bcrypt.compare(otp, user.resetOtp);
    if (!isMatch) {
      throw new UnauthorizedException('الكود غير صحيح');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usersService.update(user.id, {
      password: hashedPassword,
      resetOtp: null,
      resetOtpExpiry: null,
    });

    return {
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح، يمكنك الآن تسجيل الدخول',
    };
  }
}
