import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  @Index()
  email: string;

  @Column({ nullable: false })
  password_hash: string;

  @Column({ name: 'org_name', nullable: false })
  orgName: string;

  @Column({ name: 'subscription_tier', default: 'free' })
  subscriptionTier: string;

  @Column({ default: false })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verificationToken: string;

  @Column({ name: 'verification_token_expires', type: 'timestamp', nullable: true })
  verificationTokenExpires: Date;

  @Column({ nullable: true, type: 'varchar' })
  resetToken: string | null;

  @Column({ name: 'reset_token_expires', type: 'timestamp', nullable: true })
  resetTokenExpires: Date | null;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
