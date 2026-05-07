export function getQueryFromSearchParams(
    searchParams: URLSearchParams,
    keys: readonly string[],
) {
    const query: Record<string, string> = {};

    keys.forEach((key) => {
        const value = searchParams.get(key);

        if (value !== null) {
            query[key] = value;
        }
    });

    return query;
}

export function getQueryLink(
    searchParams: URLSearchParams,
    next: Record<string, string | number | null | undefined>,
) {
    const params = new URLSearchParams(searchParams);

    Object.entries(next).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
            params.delete(key);
            return;
        }

        params.set(key, String(value));
    });

    const queryString = params.toString();

    return queryString ? `?${queryString}` : ".";
}
