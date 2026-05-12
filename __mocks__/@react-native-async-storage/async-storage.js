// Official in-memory test helper for @react-native-async-storage/async-storage
const store = {};

const AsyncStorage = {
  setItem: jest.fn(async (key, value) => {
    store[key] = String(value);
  }),
  getItem: jest.fn(async (key) => store[key] ?? null),
  removeItem: jest.fn(async (key) => {
    delete store[key];
  }),
  multiGet: jest.fn(async (keys) => keys.map((k) => [k, store[k] ?? null])),
  multiSet: jest.fn(async (pairs) => {
    for (const [k, v] of pairs) store[k] = String(v);
  }),
  multiRemove: jest.fn(async (keys) => {
    for (const k of keys) delete store[k];
  }),
  clear: jest.fn(async () => {
    Object.keys(store).forEach((k) => delete store[k]);
  }),
  getAllKeys: jest.fn(async () => Object.keys(store)),
  _store: store,
};

module.exports = AsyncStorage;
module.exports.default = AsyncStorage;
