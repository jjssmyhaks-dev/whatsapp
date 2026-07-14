import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'whatsapp_connections' })
export class WhatsAppConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'waba_id', nullable: true })
  wabaId: string;

  @Column({ name: 'phone_number_id', nullable: false })
  phoneNumberId: string;

  @Column({ name: 'business_phone_number', nullable: false })
  businessPhoneNumber: string;

  @Column({ name: 'access_token_encrypted', type: 'text', nullable: false })
  accessTokenEncrypted: string;

  @Column({ name: 'webhook_verify_token', nullable: true })
  webhookVerifyToken: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'active' | 'inactive' | 'error';

  @Column({ name: 'last_sync', type: 'timestamp', nullable: true })
  lastSync: Date;

  @Column({ name: 'webhook_url', nullable: true })
  webhookUrl: string;

  @Column({ name: 'meta_api_version', default: 'v18.0' })
  metaApiVersion: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
