// ================================================================================================
// GENERIC DATABASE QUERIES - TRINITY PROTOCOL COMPLIANT
// ================================================================================================
// Generic query utilities untuk multiple database providers
// ================================================================================================

import CompatibilityLayer from '../compatibility/compatibility-mode';

export interface QueryBuilder {
  select(fields: string[]): QueryBuilder;
  from(table: string): QueryBuilder;
  where(condition: string, value?: any): QueryBuilder;
  orderBy(field: string, direction?: 'ASC' | 'DESC'): QueryBuilder;
  limit(count: number): QueryBuilder;
  build(): string;
}

export class GenericQueryBuilder implements QueryBuilder {
  private query = {
    select: [] as string[],
    from: '',
    where: [] as string[],
    orderBy: '',
    limit: 0
  };

  select(fields: string[]): QueryBuilder {
    this.query.select = fields;
    return this;
  }

  from(table: string): QueryBuilder {
    this.query.from = table;
    return this;
  }

  where(condition: string, value?: any): QueryBuilder {
    this.query.where.push(condition);
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder {
    this.query.orderBy = `${field} ${direction}`;
    return this;
  }

  limit(count: number): QueryBuilder {
    this.query.limit = count;
    return this;
  }

  build(): string {
    const selectClause = this.query.select.length > 0 ? this.query.select.join(', ') : '*';
    let sql = `SELECT ${selectClause} FROM ${this.query.from}`;
    
    if (this.query.where.length > 0) {
      sql += ` WHERE ${this.query.where.join(' AND ')}`;
    }
    
    if (this.query.orderBy) {
      sql += ` ORDER BY ${this.query.orderBy}`;
    }
    
    if (this.query.limit > 0) {
      sql += ` LIMIT ${this.query.limit}`;
    }
    
    return sql;
  }
}

export const createQueryBuilder = (): QueryBuilder => new GenericQueryBuilder();

export default { createQueryBuilder, GenericQueryBuilder };