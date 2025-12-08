
type Value = string | null

const memory = new Map<string, string>()

const storage = () => {
    try {
        return globalThis.localStorage
    } catch {
        return null
    }
}

const AsyncStorage = {
    async getItem(key: string): Promise<Value> {
        const s = storage()
        if (s) return s.getItem(key)
        return memory.get(key) ?? null
    },
    async setItem(key: string, value: string) {
        const s = storage()
        if (s) s.setItem(key, value)
        else memory.set(key, value)
    },
    async removeItem(key: string) {
        const s = storage()
        if (s) s.removeItem(key)
        else memory.delete(key)
    },
}

export default AsyncStorage
