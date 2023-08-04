import { Entity, Column } from 'typeorm';

@Entity('tokens') // Replace 'tokens' with your desired collection name in MongoDB
export class TokenEntity {
  @Column({ type: 'varchar' })
  userId: number;

  @Column({ type: 'varchar' })
  token: string;

  @Column({ type: 'varchar' })
  tokenType: string;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date | null;

  @Column({ type: 'timestamp' })
  expiryDate: Date;
}
