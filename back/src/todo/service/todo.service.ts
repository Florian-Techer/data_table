import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  EntityRepository,
  EntityManager,
  EntityMetadata,
} from '@mikro-orm/core';
import { TodoEntity } from '../entity/todo.entity';
import { TodoDto } from '../dto/todo.dto';
import { NotFoundException } from '@nestjs/common';
import { ColumnSearchObject } from 'src/interfaces/types';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(TodoEntity)
    private readonly todoRepository: EntityRepository<TodoEntity>,
    private readonly em: EntityManager,
  ) {}
  // GET ALL TODO
  async findAll(): Promise<TodoEntity[]> {
    return await this.todoRepository.findAll();
  }
  // GET ONE TODO BY ID
  async findOne(id: number): Promise<TodoEntity> {
    const todo = await this.todoRepository.findOne({ id });
    if (!todo) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
    return todo;
  }
  async createTodo(todoDto: TodoDto) {
    // Logique pour créer Todo
    const todo = new TodoEntity();

    todo.name = todoDto.name;
    todo.description = todoDto.description;
    await this.todoRepository.nativeInsert(todo);
    return todo;
  }

  async updateTodo(id: number, data: Partial<TodoDto>) {
    // Logique pour mettre à jour Todo
    const todo = await this.todoRepository.findOne({ id });
    if (!todo) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
    Object.assign(todo, data);
    await this.todoRepository.persistAndFlush(todo);
    return todo;
  }

  async deleteTodo(id: number) {
    // Logique pour supprimer Todo
    const todo = await this.todoRepository.findOne({ id });
    if (!todo) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
    await this.todoRepository.remove(todo).flush();
    return todo;
  }

  async getColumnNamesAndTypes(
    entityName: string,
  ): Promise<{ name: string; type: string }[]> {
    const metadata: EntityMetadata = this.em.getMetadata().get(entityName);
    const props = metadata.properties;

    const columnNamesAndTypes = Object.keys(props).map((columnName) => ({
      name: columnName,
      type: props[columnName].type,
    }));

    return columnNamesAndTypes;
  }

  async getDataTable(
    start: number,
    length: number,
    search: string,
    orderColumnIndex: number,
    orderDirection: string,
    columnSearch: Array<ColumnSearchObject>,
  ) {
    const totalQuery = this.todoRepository.count();

    const columnSearchArray = columnSearch || [];

    // Pushing column condition to columnSearchConditions when column is searchable and search value is set
    const columnSearchConditions = [];
    for (const column of columnSearchArray) {
      if (column.searchable && column.search && column.search.value !== '') {
        const condition = {
          [column.data]: { $like: `%${column.search.value}%` },
        };
        columnSearchConditions.push(condition);
      }
    }

    // Retrieving filtered data handling global search and column search conditions
    const filteredQuery = this.todoRepository.count({
      $or: [
        { name: { $like: '%' + search + '%' } },
        { description: { $like: '%' + search + '%' } },
      ],
      $and: columnSearchConditions,
    });

    const [recordsTotal, recordsFiltered] = await Promise.all([
      totalQuery,
      filteredQuery,
    ]);

    if (parseInt(`${orderColumnIndex}`) !== 0) {
      orderColumnIndex = parseInt(`${orderColumnIndex}`) - 1;
    }
    // Defining columns that can be ordered
    const orderColumn = ['id', 'name', 'description'][orderColumnIndex];

    // Retrieving data handling global search and column search conditions
    const data = await this.todoRepository.find(
      {
        $or: [
          { name: { $like: '%' + search + '%' } },
          { description: { $like: '%' + search + '%' } },
        ],
        $and: columnSearchConditions,
      },
      {
        limit: length,
        offset: start,
        orderBy: { [orderColumn]: orderDirection === 'asc' ? 'ASC' : 'DESC' },
      },
    );

    // Returning recordsTotal, recordsFiltered and data
    return {
      recordsTotal,
      recordsFiltered,
      data,
    };
  }
}
