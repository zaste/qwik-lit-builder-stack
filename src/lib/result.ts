export type Result<T, E = string> = 
  | { success: true; data: T }
  | { success: false; error: E };

export type AsyncResult<T, E = string> = Promise<Result<T, E>>;

export const ResultHelpers = {
  ok<T>(data: T): Result<T> {
    return { success: true, data };
  },
  
  error<E = string>(error: E): Result<never, E> {
    return { success: false, error };
  },
  
  async wrap<T>(fn: () => Promise<T>): Promise<Result<T>> {
    try {
      const data = await fn();
      return ResultHelpers.ok(data);
    } catch (error) {
      return ResultHelpers.error(error instanceof Error ? error.message : String(error));
    }
  }
};
