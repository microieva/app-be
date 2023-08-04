import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
// export enum UserRole {
//   ADMIN = "administrator",
//   SUPPORT = "support",
//   STANDARD = "standard",
//   ASSISTANT= "assistant"
// }
export type UserRoleType =
  | 'administrator'
  | 'support'
  | 'standard'
  | 'assistant';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  firstname: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  lastname: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  salt?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password?: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  username: string;

  @Column({
    type: 'enum',
    enum: ['administrator', 'support', 'standard', 'assistant'],
  })
  roles: UserRoleType[];

  @Column({ type: 'date', nullable: true })
  dob?: Date;

  @Column({ type: 'enum', enum: ['male', 'female', 'other'], nullable: true })
  gender?: 'male' | 'female' | 'other';

  @Column({ type: 'varchar', length: 255, nullable: true })
  street_address?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  state?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  zip?: string;

  @Column({ type: 'boolean', default: false })
  consent_flag?: boolean;

  @Column({ type: 'date', nullable: true })
  consent_date?: Date;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  public created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  public updated_at: Date;

  @Column({ type: 'date', nullable: true })
  last_login_at?: Date;

  @Column({ type: 'date', nullable: true })
  blocked_till?: Date;

  @Column({ type: 'boolean', nullable: true })
  is_over_13?: boolean;

  @Column({ type: 'boolean', nullable: true })
  accept_terms?: boolean;

  @Column({ type: 'boolean', default: true })
  is_active?: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted?: boolean;

  @Column('simple-array', { nullable: true })
  school_name: string[];
}
