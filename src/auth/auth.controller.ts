import { Controller, Post, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from './decorators/get-user.decorator';
import type { AuthUser } from './types/auth-user.type';
import type { Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiOperation({ summary: 'Realiza o login de um usuário' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'teste@example.com' },
        password: { type: 'string', example: 'password123' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Login bem-sucedido, retorna o token JWT.',
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  login(
    @GetUser() user: AuthUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { access_token } = this.authService.login(user);

    response.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(Date.now() + 8 * 60 * 60 * 1000),
    });

    return { message: 'Login bem-sucedido' };
  }
}
