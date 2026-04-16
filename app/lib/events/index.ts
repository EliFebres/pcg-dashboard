import { EventEmitter } from 'events';

// Single in-process emitter shared across all route handlers.
// Works because Next.js and DuckDB run in the same Node.js process.
// NOTE: This approach does not work in serverless/edge deployments.

declare global {
  // eslint-disable-next-line no-var
  var _engagementEmitter: EventEmitter | undefined;
  // eslint-disable-next-line no-var
  var _userEmitter: EventEmitter | undefined;
}

if (!global._engagementEmitter) {
  global._engagementEmitter = new EventEmitter();
  global._engagementEmitter.setMaxListeners(100);
}

if (!global._userEmitter) {
  global._userEmitter = new EventEmitter();
  global._userEmitter.setMaxListeners(100);
}

export const engagementEmitter = global._engagementEmitter;
export const userEmitter = global._userEmitter;

export type EngagementEventType = 'created' | 'updated' | 'deleted';
export type UserEventType = 'created' | 'deleted';

export function emitEngagementChange(type: EngagementEventType) {
  engagementEmitter.emit('change', type);
}

export function emitUserChange(type: UserEventType) {
  userEmitter.emit('change', type);
}
