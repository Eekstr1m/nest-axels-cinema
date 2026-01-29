import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Sessions, SessionsSchema } from './sessions.schema';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sessions.name, schema: SessionsSchema },
    ]),
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
