import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'system_config' })
export class SystemConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  @Index()
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @Column({ name: 'config_type', default: 'string' })
  configType: 'string' | 'number' | 'boolean' | 'json';

  @Column({ name: 'is_sensitive', default: false })
  isSensitive: boolean;

  @Column({ name: 'description', nullable: true })
  description: string;

  @Column({ name: 'category', nullable: true })
  category: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
