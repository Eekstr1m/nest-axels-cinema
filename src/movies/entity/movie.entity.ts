import { Session } from 'src/sessions/entity/session.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Movies {
  @PrimaryGeneratedColumn()
  _id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ name: 'poster_url' })
  posterUrl: string;

  @Column()
  duration: number;

  @Column({ type: 'json' })
  genres: string[];

  @Column({ name: 'release_date', type: 'date' })
  releaseDate: Date;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToMany(() => Session, (session) => session.movie)
  sessions: Session[];
}
