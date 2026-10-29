const listeners = new Map();
export const EventBus = {
  $on(name, callback) {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(callback);
  },
  $off(name, callback) {
    listeners.get(name)?.delete(callback);
  },
  $emit(name, ...args) {
    listeners.get(name)?.forEach((callback) => callback(...args));
  },
};
