import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class TodoEntity {
  @PrimaryKey()
  id: number;
  @Property()
  name: string;
  @Property()
  description: string;
}
