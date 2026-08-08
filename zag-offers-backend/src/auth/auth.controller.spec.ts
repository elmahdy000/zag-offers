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
    const clearCookie = jest.fn();
    const controller = new AuthController(authService);

    await controller.login(
      { phone: '01000000000', password: 'password123' },
      { cookie, clearCookie } as unknown as Response,
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
    expect(clearCookie).toHaveBeenCalledWith(
      'auth_token',
      expect.not.objectContaining({ domain: expect.anything() }),
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

  it('clears both legacy host and shared-domain cookies on logout', async () => {
    process.env.AUTH_COOKIE_DOMAIN = '.zagoffers.online';
    const authService = {
      logout: jest.fn().mockResolvedValue({ success: true }),
    } as unknown as AuthService;
    const clearCookie = jest.fn();
    const controller = new AuthController(authService);

    await controller.logout(
      { user: { id: 'admin' } },
      { clearCookie } as unknown as Response,
    );

    expect(clearCookie).toHaveBeenCalledTimes(2);
    expect(clearCookie).toHaveBeenNthCalledWith(
      1,
      'auth_token',
      expect.not.objectContaining({ domain: expect.anything() }),
    );
    expect(clearCookie).toHaveBeenNthCalledWith(
      2,
      'auth_token',
      expect.objectContaining({ domain: '.zagoffers.online' }),
    );
  });
});
