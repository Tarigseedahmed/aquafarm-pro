import { DataSource, EntityTarget, QueryRunner } from 'typeorm';

/**
 * Acquire a pessimistic write lock on a single row by id using a dedicated query runner.
 * Ensures safe concurrent updates for sensitive counters (e.g., stock, counts).
 */
export async function withRowLock<T extends { id: string }>(
  dataSource: DataSource,
  entity: EntityTarget<T>,
  id: string,
  work: (entity: T, runner: QueryRunner) => Promise<T>,
): Promise<T> {
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();
  try {
    const repo = runner.manager.getRepository<T>(entity);
    const locked = await repo
      .createQueryBuilder('t')
      .setLock('pessimistic_write')
      .where('t.id = :id', { id })
      .getOne();
    if (!locked) {
      throw new Error('Row not found for locking');
    }
    const result = await work(locked, runner);
    await runner.commitTransaction();
    return result;
  } catch (err) {
    await runner.rollbackTransaction();
    throw err;
  } finally {
    await runner.release();
  }
}

/**
 * Helper for optimistic concurrency based on version column pattern.
 * Assumes the entity has an integer `version` column managed by the application.
 */
export async function withOptimisticRetry<T>(
  action: () => Promise<T>,
  options: { retries?: number; delayMs?: number } = {},
): Promise<T> {
  const max = options.retries ?? 3;
  const delay = options.delayMs ?? 50;
  let attempt = 0;
  // naive retry loop; callers should throw a specific error type on version conflict
  // and catch only that here in a real-world implementation
  // to keep this generic, we retry on any error up to max
  // improve as needed in services
  while (true) {
    try {
      return await action();
    } catch (e) {
      attempt++;
      if (attempt > max) throw e;
      await new Promise((r) => setTimeout(r, delay * attempt));
    }
  }
}


