import { UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('shares the production auth cookie across Zag Offers subdomains', async () => {
    process.env.NODE_ENV = 'production';
    const authService = {
      validateUser: jest.fn().mockResolvedValue({ id: 'admin' }),
      login: jest.fn().mockResolvedValue({ access_token: 'token', user: { role: 'ADMIN' } }),
    } as unknown as AuthService;
    const cookie = jest.fn();
    const controller = new AuthController(authService);

    await controller.login(
      { phone: '01000000000', password: 'password123' },
      { cookie } as unknown as Response,
    );

    expect(cookie).toHaveBeenCalledWith(
      'auth_token',
      'token',
      expect.objectContaining({
        domain: '.zagoffers.online',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      }),
    );
  });

  it('rejects invalid credentials without setting a cookie', async () => {
    const authService = {
      validateUser: jest.fn().mockResolvedValue(null),
    } as unknown as AuthService;
    const cookie = jest.fn();
    const controller = new AuthController(authService);

    await expect(
      controller.login(
        { phone: '01000000000', password: 'invalid' },
        { cookie } as unknown as Response,
      ),
    ).rejects.toThrow(UnauthorizedException);
    expect(cookie).not.toHaveBeenCalled();
  });
});
