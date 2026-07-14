import { Injectable, Logger, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../common/database/entities/user.entity';
import { EncryptionService } from '../common/encryption/encryption.service';

interface JwtPayload {
  sub: string;
  email: string;
  orgName: string;
}

interface RegisterDto {
  email: string;
  password: string;
  orgName: string;
}

interface LoginDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private encryptionService: EncryptionService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /**
   * Registers a new user
   */
  async register(dto: RegisterDto): Promise<{ user: User; accessToken: string }> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepo.findOne({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(dto.password, 10);

      // Create user
      const user = this.userRepo.create({
        email: dto.email,
        password_hash: passwordHash,
        orgName: dto.orgName,
        subscriptionTier: 'free',
        isActive: true,
        isVerified: false,
      });

      await this.userRepo.save(user);

      // Generate access token
      const accessToken = this.generateAccessToken(user);

      this.logger.log({
        message: 'User registered',
        userId: user.id,
        email: user.email,
        orgName: user.orgName,
      });

      return { user, accessToken };
    } catch (error) {
      this.logger.error({
        message: 'Registration failed',
        error: error.message,
        stack: error.stack,
        email: dto.email,
      });
      throw error;
    }
  }

  /**
   * Logs in a user
   */
  async login(dto: LoginDto): Promise<{ user: User; accessToken: string }> {
    try {
      // Find user
      const user = await this.userRepo.findOne({
        where: { email: dto.email },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Update last login
      await this.userRepo.update(user.id, {
        lastLogin: new Date(),
      });

      // Generate access token
      const accessToken = this.generateAccessToken(user);

      this.logger.log({
        message: 'User logged in',
        userId: user.id,
        email: user.email,
      });

      return { user, accessToken };
    } catch (error) {
      this.logger.error({
        message: 'Login failed',
        error: error.message,
        email: dto.email,
      });
      throw error;
    }
  }

  /**
   * Validates a user for local strategy
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.userRepo.findOne({
        where: { email },
      });

      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      this.logger.error({
        message: 'User validation failed',
        error: error.message,
        email,
      });
      return null;
    }
  }

  /**
   * Validates a user by ID
   */
  async validateUserById(userId: string): Promise<User | null> {
    try {
      return this.userRepo.findOne({
        where: { id: userId },
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to validate user by ID',
        error: error.message,
        userId,
      });
      return null;
    }
  }

  /**
   * Generates an access token for a user
   */
  private generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      orgName: user.orgName,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Generates a refresh token
   */
  generateRefreshToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      orgName: user.orgName,
    };

    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  /**
   * Refreshes access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.validateUserById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const accessToken = this.generateAccessToken(user);

      return { accessToken };
    } catch (error) {
      this.logger.error({
        message: 'Token refresh failed',
        error: error.message,
      });
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Changes user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    try {
      const user = await this.userRepo.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Verify current password
      const isCurrentValid = await bcrypt.compare(
        currentPassword,
        user.password_hash,
      );

      if (!isCurrentValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await this.userRepo.update(userId, {
        password_hash: newPasswordHash,
      });

      this.logger.log({
        message: 'Password changed',
        userId,
      });

      return true;
    } catch (error) {
      this.logger.error({
        message: 'Password change failed',
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Initiates password reset
   */
  async initiatePasswordReset(email: string): Promise<boolean> {
    try {
      const user = await this.userRepo.findOne({
        where: { email },
      });

      if (!user) {
        // Don't reveal that user doesn't exist
        return true;
      }

      // Generate reset token
      const resetToken = this.jwtService.sign(
        { sub: user.id, email: user.email },
        { expiresIn: '1h' },
      );

      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

      // Update user with reset token
      await this.userRepo.update(user.id, {
        resetToken,
        resetTokenExpires,
      });

      // In a real implementation, send email with reset link
      // For now, just log it
      this.logger.log({
        message: 'Password reset initiated',
        userId: user.id,
        email: user.email,
      });

      return true;
    } catch (error) {
      this.logger.error({
        message: 'Password reset initiation failed',
        error: error.message,
        email,
      });
      throw error;
    }
  }

  /**
   * Resets password using reset token
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<boolean> {
    try {
      // Verify token
      const payload = this.jwtService.verify(token);
      const user = await this.userRepo.findOne({
        where: { id: payload.sub, resetToken: token },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid or expired reset token');
      }

      // Check if token is expired
      if (user.resetTokenExpires && user.resetTokenExpires < new Date()) {
        throw new UnauthorizedException('Reset token has expired');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      await this.userRepo.update(user.id, {
        password_hash: newPasswordHash,
        resetToken: null,
        resetTokenExpires: null,
      });

      this.logger.log({
        message: 'Password reset',
        userId: user.id,
      });

      return true;
    } catch (error) {
      this.logger.error({
        message: 'Password reset failed',
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Updates user profile
   */
  async updateProfile(
    userId: string,
    dto: { orgName?: string; email?: string },
  ): Promise<User> {
    try {
      const user = await this.userRepo.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (dto.orgName) user.orgName = dto.orgName;
      if (dto.email) user.email = dto.email;

      await this.userRepo.save(user);

      this.logger.log({
        message: 'Profile updated',
        userId,
      });

      return user;
    } catch (error) {
      this.logger.error({
        message: 'Profile update failed',
        error: error.message,
        userId,
      });
      throw error;
    }
  }
}
