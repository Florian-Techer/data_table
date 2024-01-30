import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { TodoService } from '../service/todo.service';
import { TodoEntity } from '../entity/todo.entity';

@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}
  @Get('/datatable/')
  async getDataTable(
    @Query('draw') draw: string,
    @Query('start') start: number,
    @Query('length') length: number,
    @Query('search') search: string,
    @Query('orderColumnIndex') orderColumnIndex: number,
    @Query('orderDirection') orderDirection: string,
    @Query('columns') columnSearch,
  ) {
    const res = await this.todoService.getDataTable(
      start,
      length,
      search,
      orderColumnIndex,
      orderDirection,
      columnSearch,
    );
    const drawNumber = parseInt(draw);
    return {
      draw: drawNumber,
      recordsTotal: res.recordsTotal,
      recordsFiltered: res.recordsFiltered,
      data: res.data,
    };
  }
  @Post('/action')
  async doAction(
    @Body()
    body: {
      method: string;
      ids?: number[];
      data?: { [key: string]: number | string };
      entityName?: string;
      id?: number;
      name?: string;
      description?: string;
    },
  ) {
    switch (body.method) {
      case 'GET_ALL':
        const todos = this.todoService.findAll();
        return todos;
        break;
      case 'GET_ONE':
        const todo = this.todoService.findOne(body.id);
        return todo;
        break;
      case 'CREATE':
        // Code pour créer une nouvelle entité Todo
        const createDto = { name: body.name, description: body.description };
        const createdTodo = await this.todoService.createTodo(createDto);
        return createdTodo;
        break;
      case 'UPDATE':
        // Code pour mettre à jour une entité Todo existante
        const updatedTodo = await this.todoService.updateTodo(
          body.id,
          body.data,
        );
        return updatedTodo;
        break;
      case 'DELETE':
        // Code pour supprimer une entité Todo
        const deletedTodo = await this.todoService.deleteTodo(body.id);
        return deletedTodo;
        break;
      case 'GET_COLUMNS_AND_TYPE':
        const cols = await this.todoService.getColumnNamesAndTypes(
          body.entityName,
        );
        return cols;
        break;
      default:
        // Action non prise en charge
        throw new Error('Action non prise en charge');
        break;
    }
  }
}
