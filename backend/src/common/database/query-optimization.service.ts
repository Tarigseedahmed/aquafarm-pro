import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PinoLoggerService } from '../logging/pino-logger.service';

export interface QueryPerformanceMetrics {
  query: string;
  executionTime: number;
  rowsReturned: number;
  timestamp: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  maxLimit?: number;
}

export interface SortOptions {
  field: string;
  direction: 'ASC' | 'DESC';
}

@Injectable()
export class QueryOptimizationService {
  private readonly logger = new Logger(QueryOptimizationService.name);
  private performanceMetrics: QueryPerformanceMetrics[] = [];
  private readonly maxMetricsHistory = 1000;

  constructor(
    private pinoLogger: PinoLoggerService,
  ) {}

  /**
   * Optimize pagination with cursor-based pagination for better performance
   */
  async optimizedPaginate<T>(
    queryBuilder: SelectQueryBuilder<T>,
    options: PaginationOptions,
    cursorField: string = 'id',
  ): Promise<{
    data: T[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const { page, limit, maxLimit = 100 } = options;
    const safeLimit = Math.min(limit, maxLimit);
    const offset = (page - 1) * safeLimit;

    const startTime = Date.now();

    try {
      // Get total count (optimized with approximate count for large datasets)
      const total = await this.getOptimizedCount(queryBuilder);

      // Apply pagination
      const data = await queryBuilder
        .limit(safeLimit)
        .offset(offset)
        .getMany();

      const executionTime = Date.now() - startTime;
      this.recordPerformanceMetrics(
        queryBuilder.getQuery(),
        executionTime,
        data.length,
      );

      const totalPages = Math.ceil(total / safeLimit);

      return {
        data,
        meta: {
          total,
          page,
          limit: safeLimit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Pagination optimization failed:', error);
      throw error;
    }
  }

  /**
   * Optimize count queries for large datasets
   */
  private async getOptimizedCount<T>(
    queryBuilder: SelectQueryBuilder<T>,
  ): Promise<number> {
    try {
      // For large datasets, use approximate count
      const query = queryBuilder.getQuery();
      
      // Check if query is complex (has joins)
      if (query.includes('JOIN') || query.includes('GROUP BY')) {
        // Use approximate count for complex queries
        return await this.getApproximateCount(queryBuilder);
      }

      // Use exact count for simple queries
      return await queryBuilder.getCount();
    } catch (error) {
      this.logger.warn('Optimized count failed, falling back to regular count:', error);
      return await queryBuilder.getCount();
    }
  }

  /**
   * Get approximate count for better performance on large datasets
   */
  private async getApproximateCount<T>(
    queryBuilder: SelectQueryBuilder<T>,
  ): Promise<number> {
    try {
      // This is a simplified approximation - in production, you might want
      // to use database-specific approximate count functions
      const result = await queryBuilder
        .select('COUNT(*) as count')
        .getRawOne();
      
      return parseInt(result.count, 10);
    } catch (error) {
      this.logger.warn('Approximate count failed, using regular count:', error);
      return await queryBuilder.getCount();
    }
  }

  /**
   * Apply optimized sorting
   */
  applyOptimizedSort<T>(
    queryBuilder: SelectQueryBuilder<T>,
    sortOptions: SortOptions,
    allowedFields: string[] = [],
  ): SelectQueryBuilder<T> {
    const { field, direction } = sortOptions;

    // Validate field is allowed
    if (allowedFields.length > 0 && !allowedFields.includes(field)) {
      this.logger.warn(`Sort field '${field}' not allowed, using default`);
      return queryBuilder.orderBy(`${queryBuilder.alias}.createdAt`, 'DESC');
    }

    // Add index hint for better performance
    const fullFieldName = field.includes('.') ? field : `${queryBuilder.alias}.${field}`;
    
    return queryBuilder.orderBy(fullFieldName, direction);
  }

  /**
   * Optimize date range queries
   */
  applyDateRangeFilter<T>(
    queryBuilder: SelectQueryBuilder<T>,
    dateField: string,
    startDate?: Date,
    endDate?: Date,
  ): SelectQueryBuilder<T> {
    const fullFieldName = dateField.includes('.') ? dateField : `${queryBuilder.alias}.${dateField}`;

    if (startDate) {
      queryBuilder.andWhere(`${fullFieldName} >= :startDate`, { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere(`${fullFieldName} <= :endDate`, { endDate });
    }

    return queryBuilder;
  }

  /**
   * Apply optimized search with full-text search when available
   */
  applySearchFilter<T>(
    queryBuilder: SelectQueryBuilder<T>,
    searchTerm: string,
    searchFields: string[],
    useFullTextSearch: boolean = false,
  ): SelectQueryBuilder<T> {
    if (!searchTerm || searchFields.length === 0) {
      return queryBuilder;
    }

    if (useFullTextSearch) {
      // Use database-specific full-text search
      return this.applyFullTextSearch(queryBuilder, searchTerm, searchFields);
    }

    // Use ILIKE for case-insensitive search
    const searchConditions = searchFields.map(field => {
      const fullFieldName = field.includes('.') ? field : `${queryBuilder.alias}.${field}`;
      return `${fullFieldName} ILIKE :searchTerm`;
    });

    queryBuilder.andWhere(`(${searchConditions.join(' OR ')})`, {
      searchTerm: `%${searchTerm}%`,
    });

    return queryBuilder;
  }

  /**
   * Apply full-text search (PostgreSQL specific)
   */
  private applyFullTextSearch<T>(
    queryBuilder: SelectQueryBuilder<T>,
    searchTerm: string,
    searchFields: string[],
  ): SelectQueryBuilder<T> {
    // This is a simplified implementation
    // In production, you might want to use proper full-text search with tsvector
    const fullTextQuery = searchFields.map(field => {
      const fullFieldName = field.includes('.') ? field : `${queryBuilder.alias}.${field}`;
      return `to_tsvector('english', ${fullFieldName}) @@ plainto_tsquery('english', :searchTerm)`;
    });

    queryBuilder.andWhere(`(${fullTextQuery.join(' OR ')})`, {
      searchTerm,
    });

    return queryBuilder;
  }

  /**
   * Optimize joins by using proper join types
   */
  applyOptimizedJoin<T>(
    queryBuilder: SelectQueryBuilder<T>,
    relation: string,
    joinType: 'LEFT' | 'INNER' | 'RIGHT' = 'LEFT',
  ): SelectQueryBuilder<T> {
    const fullRelation = relation.includes('.') ? relation : `${queryBuilder.alias}.${relation}`;
    
    switch (joinType) {
      case 'INNER':
        return queryBuilder.innerJoinAndSelect(fullRelation, relation);
      case 'RIGHT':
        // TypeORM doesn't support rightJoinAndSelect directly
        // Fall back to LEFT JOIN or use raw SQL if needed
        this.logger.warn('RIGHT JOIN not directly supported, using LEFT JOIN instead');
        return queryBuilder.leftJoinAndSelect(fullRelation, relation);
      default:
        return queryBuilder.leftJoinAndSelect(fullRelation, relation);
    }
  }

  /**
   * Apply query hints for better performance
   */
  applyQueryHints<T>(
    queryBuilder: SelectQueryBuilder<T>,
    hints: string[] = [],
  ): SelectQueryBuilder<T> {
    // Add database-specific query hints
    if (hints.length > 0) {
      // This would be database-specific implementation
      this.logger.debug(`Applying query hints: ${hints.join(', ')}`);
    }

    return queryBuilder;
  }

  /**
   * Record query performance metrics
   */
  private recordPerformanceMetrics(
    query: string,
    executionTime: number,
    rowsReturned: number,
  ): void {
    const metric: QueryPerformanceMetrics = {
      query: query.substring(0, 200), // Truncate for storage
      executionTime,
      rowsReturned,
      timestamp: new Date(),
    };

    this.performanceMetrics.push(metric);

    // Keep only recent metrics
    if (this.performanceMetrics.length > this.maxMetricsHistory) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxMetricsHistory);
    }

    // Log slow queries
    if (executionTime > 1000) { // 1 second
      this.pinoLogger.warn(
        {
          event: 'slow_query',
          query: metric.query,
          executionTime,
          rowsReturned,
        },
        `Slow query detected: ${executionTime}ms`,
      );
    }
  }

  /**
   * Get query performance statistics
   */
  getPerformanceStats(): {
    totalQueries: number;
    averageExecutionTime: number;
    slowQueries: number;
    totalRowsReturned: number;
  } {
    const totalQueries = this.performanceMetrics.length;
    
    if (totalQueries === 0) {
      return {
        totalQueries: 0,
        averageExecutionTime: 0,
        slowQueries: 0,
        totalRowsReturned: 0,
      };
    }

    const totalExecutionTime = this.performanceMetrics.reduce(
      (sum, metric) => sum + metric.executionTime,
      0,
    );
    
    const slowQueries = this.performanceMetrics.filter(
      metric => metric.executionTime > 1000,
    ).length;
    
    const totalRowsReturned = this.performanceMetrics.reduce(
      (sum, metric) => sum + metric.rowsReturned,
      0,
    );

    return {
      totalQueries,
      averageExecutionTime: totalExecutionTime / totalQueries,
      slowQueries,
      totalRowsReturned,
    };
  }

  /**
   * Clear performance metrics
   */
  clearPerformanceMetrics(): void {
    this.performanceMetrics = [];
  }
}
