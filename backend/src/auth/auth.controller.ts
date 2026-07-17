import { Controller, Post, Body, UseGuards, Request, Get, Put, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User as UserEntity } from '../common/database/entities/user.entity';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   */
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account.',
  })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(
    @Body() dto: { email: string; password: string; orgName: string },
  ) {
    return this.authService.register(dto);
  }

  /**
   * Login user
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticates a user and returns an access token.',
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: { email: string; password: string }) {
    return this.authService.login(dto);
  }

  /**
   * Get current user profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Returns the profile of the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: { user: UserEntity }) {
    return req.user;
  }

  /**
   * Update user profile
   */
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Updates the profile of the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @Request() req: { user: UserEntity },
    @Body() dto: { orgName?: string; email?: string },
  ) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  /**
   * Change password
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change password',
    description: 'Changes the password of the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'Password changed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @Request() req: { user: UserEntity },
    @Body() dto: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  /**
   * Initiate password reset
   */
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Initiate password reset',
    description: 'Initiates the password reset process by sending a reset link to the email.',
  })
  @ApiResponse({ status: 200, description: 'Reset link sent' })
  async forgotPassword(@Body() dto: { email: string }) {
    return this.authService.initiatePasswordReset(dto.email);
  }

  /**
   * Reset password
   */
  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password',
    description: 'Resets the password using a reset token.',
  })
  @ApiResponse({ status: 200, description: 'Password reset' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async resetPassword(
    @Body() dto: { token: string; newPassword: string },
  ) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  /**
   * Refresh access token
   */
  @Post('refresh')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Refreshes the access token using a refresh token.',
  })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() dto: { refreshToken: string }) {
    return this.authService.refreshToken(dto.refreshToken);
  }
}
