export function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function load(key: string) {
  const item = localStorage.getItem(key);
  if (!item) return null;

  try {
    return JSON.parse(item);
  } catch {
    console.warn(`Failed to parse localStorage item for key: ${key}`);
    return item;
  }
}

export function remove(key: string) {
  localStorage.removeItem(key);
}

export function clear() {
  localStorage.clear();
}
