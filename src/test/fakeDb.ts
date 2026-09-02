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

  type FakeDb = {
    select: () => ReturnType<typeof thenable>;
    insert: () => ReturnType<typeof insertable>;
    delete: () => { where: () => Promise<undefined> };
    execute: () => Promise<undefined>;
    transaction: <T>(fn: (tx: FakeDb) => Promise<T>) => Promise<T>;
  };

  const api: FakeDb = {
    select: () => thenable(),
    insert: () => insertable(),
    delete: () => ({
      where: async () => undefined,
    }),
    execute: async () => undefined,
    transaction: async (fn) => fn(api),
  };

  return api;
}
