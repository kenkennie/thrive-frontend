/**
 * Global response helpers — fixes .find/.map/.filter not a function errors.
 *
 * The response chain is: axios.data → backend { data: [], meta: {} }
 * Use these instead of accessing .data.data manually everywhere.
 */

export function extractArray<T>(response: any): T[] {
  if (!response) return [];
  const inner = response?.data.data ?? response;
  const arr = inner?.data ?? inner;
  return Array.isArray(arr) ? arr : [];
}

export function extractItem<T>(response: any): T | null {
  if (!response) return null;
  const inner = response?.data.data ?? response;
  const item = inner?.data ?? inner;
  return item ?? null;
}

export function extractMeta(response: any) {
  const inner = response?.data ?? response;
  return inner?.meta ?? inner?.pagination ?? null;
}
