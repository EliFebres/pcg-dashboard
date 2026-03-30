import { EventEmitter } from 'events';

// Single in-process emitter shared across all route handlers.
// Works because Next.js and DuckDB run in the same Node.js process.
// NOTE: This approach does not work in serverless/edge deployments.

declare global {
  // eslint-disable-next-line no-var
  var _engagementEmitter: EventEmitter | undefined;
}

if (!global._engagementEmitter) {
  global._engagementEmitter = new EventEmitter();
  global._engagementEmitter.setMaxListeners(100);
}

export const engagementEmitter = global._engagementEmitter;

export type EngagementEventType = 'created' | 'updated' | 'deleted';

export function emitEngagementChange(type: EngagementEventType) {
  engagementEmitter.emit('change', type);
}
