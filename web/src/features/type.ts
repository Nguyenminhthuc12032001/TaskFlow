export type ActionError = {
    formErrors?: string[];
    fieldErrors?: {
        [key: string]: string[];
    };
    errorMessage?: string;
}