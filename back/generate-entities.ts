// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs').promises;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
const createSubFolders = async (rootFolder, subFolders) => {
  try {
    await fs.mkdir(rootFolder);
    console.log('Root folder created successfully');

    await Promise.all(
      subFolders.map(async (subFolder) => {
        const folderPath = path.join(rootFolder, subFolder);
        try {
          await fs.mkdir(folderPath);
          console.log(`${subFolder} folder created successfully`);
        } catch (subError) {
          console.error(`Error creating ${subFolder} folder:`, subError);
        }
      }),
    );
  } catch (rootError) {
    console.error('Error creating root folder:', rootError);
  }
};

const generateFileTree = async () => {
  const configPath = './entity-config.json';
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config = require(configPath);

  for (const entity of config.entities) {
    const rootFolder = `src/${entity.name.toLowerCase()}`;
    const subFolders = ['controller', 'service', 'dto', 'entity'];
    await createSubFolders(rootFolder, subFolders);
  }
};
const generateFiles = async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require('path');

  const configPath = './entity-config.json';

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config = require(configPath);

  for (const entity of config.entities) {
    const outputEntitiesDir = `src/${entity.name.toLowerCase()}/entity`;
    const outputControllerDir = `src/${entity.name.toLowerCase()}/controller`;
    const outputServiceDir = `src/${entity.name.toLowerCase()}/service`;
    const outputDtoDir = `src/${entity.name.toLowerCase()}/dto`;
    const outputModuleDir = `src/${entity.name.toLowerCase()}`;

    const entityContent = generateEntityContent(entity);
    const fileName = `${entity.name.toLowerCase()}.entity.ts`;
    const filePath = path.join(outputEntitiesDir, fileName);
    try {
      fs.writeFileSync(filePath, entityContent);
      // console.log('Données écrites dans le fichier avec succès.');
    } catch (error) {
      console.error("Une erreur s'est produite :", error);
    }

    const controllerContent = generateControllerContent(entity);
    const controllerName = `${entity.name.toLowerCase()}.controller.ts`;
    const controllerPath = path.join(outputControllerDir, controllerName);
    try {
      fs.writeFileSync(controllerPath, controllerContent);
      // console.log('Données écrites dans le fichier avec succès.');
    } catch (error) {
      console.error("Une erreur s'est produite :", error);
    }

    const serviceContent = generateServiceContent(entity);
    const serviceName = `${entity.name.toLowerCase()}.service.ts`;
    const servicePath = path.join(outputServiceDir, serviceName);
    try {
      fs.writeFileSync(servicePath, serviceContent);
      // console.log('Données écrites dans le fichier avec succès.');
    } catch (error) {
      console.error("Une erreur s'est produite :", error);
    }

    const dtoContent = generateDtoContent(entity);
    const dtoName = `${entity.name.toLowerCase()}.dto.ts`;
    const dtoPath = path.join(outputDtoDir, dtoName);
    try {
      fs.writeFileSync(dtoPath, dtoContent);
      // console.log('Données écrites dans le fichier avec succès.');
    } catch (error) {
      console.error("Une erreur s'est produite :", error);
    }

    const moduleContent = generateModuleContent(entity);
    const moduleName = `${entity.name.toLowerCase()}.module.ts`;
    const modulePath = path.join(outputModuleDir, moduleName);
    try {
      fs.writeFileSync(modulePath, moduleContent);
      // console.log('Données écrites dans le fichier avec succès.');
    } catch (error) {
      console.error("Une erreur s'est produite :", error);
    }

    console.log(
      `Generated ${fileName} and ${controllerName} and ${serviceName} and ${dtoName} and ${moduleName}`,
    );
  }

  const appModuleContent = generateAppModuleContent(config.entities);
  const appModuleName = `app.module.ts`;
  const appModulePath = path.join('src', appModuleName);
  try {
    fs.writeFileSync(appModulePath, appModuleContent);
    // console.log('Données écrites dans le fichier avec succès.');
  } catch (error) {
    console.error("Une erreur s'est produite :", error);
  }
};

// --------------------------------------------------------

function generateEntityContent(entity) {
  const attributes = entity.attributes
    .map((attr, index) => {
      if (index !== 0) {
        return `@Property()\n ${attr.name}: ${attr.type};`;
      } else {
        return `@PrimaryKey()\n ${attr.name}: ${attr.type};`;
      }
    })
    .join('\n  ');

  return `
    import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

    @Entity()
    export class ${entity.name}Entity {

      ${attributes}
    }
  `;
}

function generateControllerContent(entity) {
  const routes = generateRoutes(entity);

  return `
    import { Controller,
      Get,
      Post,
      Put,
      Delete,
      Body,
      Param,
      Query,
    } from '@nestjs/common';
    import { ${
      entity.name
    }Service } from '../service/${entity.name.toLowerCase()}.service';
    import { ${
      entity.name
    }Entity } from '../entity/${entity.name.toLowerCase()}.entity';

    @Controller('${entity.name.toLowerCase()}')
    export class ${entity.name}Controller {
      constructor(private readonly ${entity.name.toLowerCase()}Service: ${
    entity.name
  }Service) {}
      ${routes}
    }
  `;
}

function generateRoutes(entity) {
  const createDto = entity.attributes
    .map((attr) => {
      if (attr && attr.name !== 'id') {
        return `${attr.name}: body.${attr.name}`;
      }
    })
    .filter((item) => item !== undefined);
  createDto.join(', ');

  const bodyType = entity.attributes.map((attr) => {
    return `${attr.name}?: ${attr.type};`;
  });
  const commonElement = [
    'method: string;',
    'ids?: number[];',
    'data?: { [key: string]: number | string };',
    'entityName?: string;',
  ];
  bodyType.unshift(...commonElement);
  const joinedBodyType = bodyType.join('');
  const routes = [
    `@Get('/datatable/')
    async getDataTable(
      @Query('draw') draw: string,
      @Query('start') start: number,
      @Query('length') length: number,
      @Query('search') search: string,
      @Query('orderColumnIndex') orderColumnIndex: number,
      @Query('orderDirection') orderDirection: string,
      @Query('columns') columnSearch,
    ) {
      const res = await this.${entity.name.toLowerCase()}Service.getDataTable(
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
    }`,
    `@Post('/action')\n
      async doAction(@Body() body:{${joinedBodyType}}){
        switch (body.method) {
          case 'GET_ALL':
            const ${entity.name.toLowerCase()}s = this.${entity.name.toLowerCase()}Service.findAll();
            return ${entity.name.toLowerCase()}s;
            break;
          case 'GET_ONE':
            const ${entity.name.toLowerCase()} = this.${entity.name.toLowerCase()}Service.findOne(body.id);
            return ${entity.name.toLowerCase()};
            break;
          case 'CREATE':
            // Code pour créer une nouvelle entité ${entity.name}
            const createDto = {${createDto}}
            const created${
              entity.name
            } = await this.${entity.name.toLowerCase()}Service.create${
      entity.name
    }(createDto);
            return created${entity.name};
            break;
          case 'UPDATE':
            // Code pour mettre à jour une entité ${entity.name} existante
            const updated${
              entity.name
            } = await this.${entity.name.toLowerCase()}Service.update${
      entity.name
    }(body.id, body.data);
          return updated${entity.name};
            break;
          case 'DELETE':
            // Code pour supprimer une entité ${entity.name}
            const deleted${
              entity.name
            } = await this.${entity.name.toLowerCase()}Service.delete${
      entity.name
    }(body.id);
          return deleted${entity.name};
            break;
          case 'GET_COLUMNS_AND_TYPE':
            const cols = await this.${entity.name.toLowerCase()}Service.getColumnNamesAndTypes(body.entityName);
            return cols;
            break;
          default:
            // Action non prise en charge
            throw new Error('Action non prise en charge');
            break;
        }
      }`,
  ];

  return routes.join('\n  ');
}

function generateServiceContent(entity) {
  const create = entity.attributes
    .map((attr) => {
      if (attr.require && attr.name !== 'id') {
        return `${entity.name.toLowerCase()}.${
          attr.name
        } = ${entity.name.toLowerCase()}Dto.${attr.name};`;
      } else if (!attr.require && attr.name !== 'id') {
        if (attr.type === 'number' || attr.type === 'boolean') {
          return `
          if(${entity.name.toLowerCase()}Dto.${attr.name}){
            ${entity.name.toLowerCase()}.${
            attr.name
          } = ${entity.name.toLowerCase()}Dto.${attr.name};
          }else if(!${entity.name.toLowerCase()}Dto.${attr.name}){
            ${entity.name.toLowerCase()}.${attr.name} = ${attr.defaultValue};
          }

          `;
        } else if (attr.type === 'string') {
          return `
          if(${entity.name.toLowerCase()}Dto.${attr.name}){
            ${entity.name.toLowerCase()}.${
            attr.name
          } = ${entity.name.toLowerCase()}Dto.${attr.name};
          }else if(!${entity.name.toLowerCase()}Dto.${attr.name}){
            ${entity.name.toLowerCase()}.${attr.name} = '${attr.defaultValue}';
          }

          `;
        }
      }
    })
    .join('\n  ');

  const searchString = entity.attributes
    .filter((attr) => attr.type === 'string')
    .map((attr) => `{ ${attr.name}: { $like: '%' + search + '%' } }`)
    .join(',\n');

  const searchArrayString = '[' + searchString + ']';

  const orderColumns = entity.attributes.map((attr) => attr.name);
  const quotedOrderColumns = orderColumns.map((column) => `'${column}'`);
  const orderColumn = `[${quotedOrderColumns}]` + '[orderColumnIndex]';
  return (
    `
    import { Injectable } from '@nestjs/common';
    import { InjectRepository } from '@mikro-orm/nestjs';
    import { EntityRepository, EntityManager, EntityMetadata } from '@mikro-orm/core';
    import { ${
      entity.name
    }Entity } from '../entity/${entity.name.toLowerCase()}.entity';
    import { ${entity.name}Dto } from '../dto/${entity.name.toLowerCase()}.dto';
    import { NotFoundException } from '@nestjs/common';
    import { ColumnSearchObject } from 'src/interfaces/types';

    @Injectable()
    export class ${entity.name}Service {
      constructor(
        @InjectRepository(${entity.name}Entity)
        private readonly ${entity.name.toLowerCase()}Repository: EntityRepository<${
      entity.name
    }Entity>,
        private readonly em: EntityManager,
      ) {}
      // GET ALL ${entity.name.toUpperCase()}
    async findAll(): Promise<${entity.name}Entity[]> {
      return await this.${entity.name.toLowerCase()}Repository.findAll();
    }
    // GET ONE ${entity.name.toUpperCase()} BY ID
    async findOne(id: number): Promise<${entity.name}Entity> {
      const ${entity.name.toLowerCase()} = await this.${entity.name.toLowerCase()}Repository.findOne({ id });
      if (!${entity.name.toLowerCase()}) {
        throw new NotFoundException(` +
    '`' +
    entity.name +
    ' with id ${id} not found' +
    '`' +
    `);
      }
      return ${entity.name.toLowerCase()};
    }
      async create${entity.name}(${entity.name.toLowerCase()}Dto: ${
      entity.name
    }Dto) {
        // Logique pour créer ${entity.name}
        const ${entity.name.toLowerCase()} = new ${entity.name}Entity();
        ${create}
        await this.${entity.name.toLowerCase()}Repository.nativeInsert(${entity.name.toLowerCase()});
        return ${entity.name.toLowerCase()};
      }

      async update${entity.name}(id: number, data: Partial<${entity.name}Dto>) {
        // Logique pour mettre à jour ${entity.name}
        const ${entity.name.toLowerCase()} = await this.${entity.name.toLowerCase()}Repository.findOne({ id });
        if (!${entity.name.toLowerCase()}) {
          throw new NotFoundException(` +
    '`' +
    entity.name +
    ' with id ${id} not found' +
    '`' +
    `);
       }
        Object.assign(${entity.name.toLowerCase()}, data);
        await this.${entity.name.toLowerCase()}Repository.persistAndFlush(${entity.name.toLowerCase()});
        return ${entity.name.toLowerCase()};
      }

      async delete${entity.name}(id: number) {
        // Logique pour supprimer ${entity.name}
        const ${entity.name.toLowerCase()} = await this.${entity.name.toLowerCase()}Repository.findOne({ id });
        if (!${entity.name.toLowerCase()}) {
          throw new NotFoundException(` +
    '`' +
    entity.name +
    ' with id ${id} not found' +
    '`' +
    `);
        }
        await this.${entity.name.toLowerCase()}Repository.remove(${entity.name.toLowerCase()}).flush();
        return ${entity.name.toLowerCase()};
      }

      async getColumnNamesAndTypes(entityName: string): Promise<{ name: string; type: string }[]> {
        const metadata: EntityMetadata = this.em.getMetadata().get(entityName);
        const props = metadata.properties;
        
        const columnNamesAndTypes = Object.keys(props).map(columnName => ({
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
        const totalQuery = this.${entity.name.toLowerCase()}Repository.count();
    
        const columnSearchArray = columnSearch || [];
    
        // Pushing column condition to columnSearchConditions when column is searchable and search value is set
        const columnSearchConditions = [];
        for (const column of columnSearchArray) {
          if (column.searchable && column.search && column.search.value !== '') {
            const condition = {
              [column.data]: { $like: ` +
    '`' +
    '%${column.search.value}%' +
    '`' +
    ` },
            };
            columnSearchConditions.push(condition);
          }
        }
    
        // Retrieving filtered data handling global search and column search conditions
        const filteredQuery = this.${entity.name.toLowerCase()}Repository.count({
          $or: ${searchArrayString},
          $and: columnSearchConditions,
        });
    
        const [recordsTotal, recordsFiltered] = await Promise.all([
          totalQuery,
          filteredQuery,
        ]);
        
        if (parseInt(` +
    '`' +
    '${orderColumnIndex}' +
    '`' +
    `) !== 0) {
          orderColumnIndex = parseInt(` +
    '`' +
    '${orderColumnIndex}' +
    '`' +
    `) - 1;
        }
        // Defining columns that can be ordered
        const orderColumn = ${orderColumn}
    
        // Retrieving data handling global search and column search conditions
        const data = await this.${entity.name.toLowerCase()}Repository.find(
          {
            $or: ${searchArrayString},
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
  `
  );
}

function generateDtoContent(entity) {
  const dtoAttributes = entity.attributes
    .map((attr) => {
      if (attr.name !== 'id')
        return attr.require
          ? `  readonly ${attr.name}: ${attr.type};`
          : `  readonly ${attr.name}?: ${attr.type};`;
    })
    .join('\n');

  return `
    export class ${entity.name}Dto {
      ${dtoAttributes}
    }
  `;
}

function generateModuleContent(entity) {
  return `
      import { Module } from '@nestjs/common';
      import { ${
        entity.name
      }Entity } from './entity/${entity.name.toLowerCase()}.entity';
      import { MikroOrmModule } from '@mikro-orm/nestjs/mikro-orm.module';
      import { ${
        entity.name
      }Service } from './service/${entity.name.toLowerCase()}.service';
      import { ${
        entity.name
      }Controller } from './controller/${entity.name.toLowerCase()}.controller';

      @Module({
        imports: [MikroOrmModule.forFeature([${entity.name}Entity])],
        providers: [${entity.name}Service],
        controllers: [${entity.name}Controller],
      })
      export class ${entity.name}Module {}
  `;
}

function generateAppModuleContent(entities) {
  const modules = entities
    .map((entity) => {
      return `${entity.name}Module,`;
    })
    .join('\n ');

  const moduleImport = entities
    .map((entity) => {
      return `import { ${
        entity.name
      }Module } from './${entity.name.toLowerCase()}/${entity.name.toLowerCase()}.module'`;
    })
    .join('\n ');
  return `import { Module } from '@nestjs/common';
  import { AppController } from './app.controller';
  import { AppService } from './app.service';
  import { MikroOrmModule } from '@mikro-orm/nestjs';
  import { config } from 'dotenv';
  ${moduleImport}

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
      ${modules}
    ],
    controllers: [AppController],
    providers: [AppService],
  })
  export class AppModule {}
  `;
}

(async () => {
  await generateFileTree();
  await generateFiles();
})();
