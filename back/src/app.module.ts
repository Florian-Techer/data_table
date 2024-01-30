import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { config } from 'dotenv';
import { TodoModule } from './todo/todo.module';

config();

@Module({
  imports: [
    MikroOrmModule.forRoot({
      entities: ['dist/**/**.entity.js'],
      entitiesTs: ['./src/entities'],
      dbName: process.env.DB_NAME,
      type: 'mysql',
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
    }),
    TodoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
