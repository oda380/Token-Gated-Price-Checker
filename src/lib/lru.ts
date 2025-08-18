// /lib/lru.ts
// Minimal LRU cache with TTL (good enough for quote caching 15–60s)

type Entry<V> = { value: V; ts: number };

export class LRU<K, V> {
  private map = new Map<K, Entry<V>>();
  constructor(private max = 200, private ttlMs = 30_000) {}

  get(key: K): V | undefined {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (Date.now() - hit.ts > this.ttlMs) {
      this.map.delete(key);
      return undefined;
    }
    // refresh recency
    this.map.delete(key);
    this.map.set(key, { value: hit.value, ts: Date.now() });
    return hit.value;
  }

  set(key: K, value: V) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, ts: Date.now() });
    if (this.map.size > this.max) {
        const it = this.map.keys().next();
        if (!it.done) {
          const firstKey = it.value as K; // value is K when !done
          this.map.delete(firstKey);
        }
  }
}
}