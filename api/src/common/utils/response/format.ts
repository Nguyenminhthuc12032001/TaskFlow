export function ok<T>(data: T) {
    return {
        ok: true,
        data
    }
}

export function created<T>(data: T) {
    return {
        ok: true,
        created: true,
        data
    }
}

export function fail(message: string, details?: any) {
    return {
        ok: false,
        message: message,
        details
    }
}