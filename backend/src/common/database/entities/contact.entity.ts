import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'contacts' })
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'phone_number', nullable: false })
  @Index()
  phoneNumber: string;

  @Column({ name: 'display_name', nullable: true })
  displayName: string;

  @Column({ name: 'whatsapp_name', nullable: true })
  whatsappName: string;

  @Column({ name: 'is_vip', default: false })
  isVip: boolean;

  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  @Column({ name: 'profile_image_url', nullable: true })
  profileImageUrl: string;

  @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
  lastMessageAt: Date;

  @Column({ name: 'message_count', default: 0 })
  messageCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
