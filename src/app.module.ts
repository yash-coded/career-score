import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResumeModule } from './resume/resume.module';

@Module({
  imports: [ResumeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
