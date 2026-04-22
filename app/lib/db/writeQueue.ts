// Per-database serial write queue. Every callsite that mutates a DuckDB file
// should route through here so concurrent requests don't race on the single
// connection held by each DB instance. Reads don't need to be serialized and
// should NOT use this helper.
//
// Queues are stored on `global` so Next.js HMR doesn't reset them mid-session
// and leave in-flight writes orphaned.

const g = global as typeof globalThis & {
  _dbWriteQueues?: Map<string, Promise<unknown>>;
};

function getQueues(): Map<string, Promise<unknown>> {
  if (!g._dbWriteQueues) g._dbWriteQueues = new Map();
  return g._dbWriteQueues;
}

export function serializeWrite<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const queues = getQueues();
  const prev = queues.get(key) ?? Promise.resolve();
  const next = prev.then(fn);
  // Swallow errors on the chain so one failing write doesn't poison every
  // subsequent write behind it. The returned promise still rejects normally.
  queues.set(key, next.then(() => {}, () => {}));
  return next;
}
