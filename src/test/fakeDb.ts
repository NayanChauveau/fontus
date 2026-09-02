export function createFakeDb(options: {
  selectResults?: unknown[][];
} = {}) {
  const queue = [...(options.selectResults ?? [])];

  function nextSelect(): unknown[] {
    return (queue.shift() ?? []) as unknown[];
  }

  function thenable(result: unknown[] = nextSelect()) {
    const promise = Promise.resolve(result);
    const builder = {
      from: () => builder,
      where: () => builder,
      limit: async () => result,
      innerJoin: () => builder,
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally.bind(promise),
    };
    return builder;
  }

  function insertable() {
    const done = Promise.resolve();
    return {
      values: () => ({
        onConflictDoNothing: async () => undefined,
        onConflictDoUpdate: async () => undefined,
        then: done.then.bind(done),
      }),
    };
  }

  return {
    select: () => thenable(),
    insert: () => insertable(),
    delete: () => ({
      where: async () => undefined,
    }),
  };
}
