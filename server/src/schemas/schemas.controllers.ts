import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/SessionGuard';
import { ROUTES } from '../../../src/common/constants';
import { DatabaseService } from '../database/database.service';
import { Schema } from '../../../src/common/models/schema';

@Controller(ROUTES.SCHEMAS)
@UseGuards(SessionGuard)
export class SchemasController {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {
  }

  @Post()
  /**
   * Creates a new schema in the DB
   * @async
   * @param {Schema} schema - the body of the request
   * @return {Promise<Schema>} result
   */
  async create(@Body() schema: Schema) {
    let newSchema: Schema;
    try {
      newSchema = new Schema(
        schema.name,
        schema.attributes,
        schema.registries,
        schema.formFeatures,
      );
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }

    const schemaFromDB = await this.databaseService.schemas.findOne(
      { name: newSchema.name },
    );
    if (schemaFromDB)
      throw new HttpException(
        `Schema with name ${newSchema.name} exists in the database`,
        HttpStatus.CONFLICT,
      );

    return await this.databaseService.schemas.insert(newSchema);
  }

  @Get()
  /**
   * Get the list of all schemas
   * @async
   * @return {Promise<Schema[]>} result
   */
  async get() {
    return await this.databaseService.schemas.find({});
  }

  @Get(':id')
  /**
   * Gets a specific schema from the DB
   * @param params - the request parameters
   * @async
   * @return {Promise<Schema>} result
   */
  async getById(@Param() params) {
    return await this.databaseService.schemas.findOne({
      _id: params.id,
    });
  }

  @Put(':id')
  /**
   * Update a schema by id, provided as a query parameter
   * @async
   * @param {any} params - the request parameters
   * @param {Schema} updateSchemaObject - the update object for the schema
   * @return {Promise<Schema>} result
   */
  async update(@Param() params, @Body() update: Schema) {

    const oldSchema = await this.databaseService.schemas.findOne({ _id: params.id });
    try {
      Schema.validateDiff(oldSchema, update);
      Schema.validate(update);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
    const { name, attributes, registries, formFeatures } = update;
    return await this.databaseService.schemas.updateById(
      params.id,
      {
        $set: {
          name,
          attributes,
          registries,
          formFeatures,
        },
      },
    );
  }

  @Delete(':id')
  /**
   * Archive a schema by id, provided as a query parameter
   * @async
   * @param {any} params - the request parameters
   * @return {Promise<Schema>} result
   */
  async archive(@Param() params) {
    return await this.databaseService.schemas.updateById(
      params.id,
      {
        $set: {
          archived: true,
        },
      }
      ,
    );
  }
}
