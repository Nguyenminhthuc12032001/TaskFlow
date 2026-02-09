export function ok(data) {
    return {
        ok: true,
        data
    };
}
export function created(data) {
    return {
        ok: true,
        created: true,
        data
    };
}
export function fail(message, details) {
    return {
        ok: false,
        message: message,
        details
    };
}
