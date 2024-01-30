import { Module } from '@nestjs/common';
import { TodoEntity } from './entity/todo.entity';
import { MikroOrmModule } from '@mikro-orm/nestjs/mikro-orm.module';
import { TodoService } from './service/todo.service';
import { TodoController } from './controller/todo.controller';

@Module({
  imports: [MikroOrmModule.forFeature([TodoEntity])],
  providers: [TodoService],
  controllers: [TodoController],
})
export class TodoModule {}
