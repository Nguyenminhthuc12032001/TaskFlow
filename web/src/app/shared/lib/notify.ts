import { toast } from "sonner";

export type notifyOptions = {
    id?: string;
    description?: string;
    duration?: number;
}

export const notify = {
    success(message: string, options?: notifyOptions) {
        toast.success(message, {
            id: options?.id,
            description: options?.description,
            duration: options?.duration ?? 2000
        });
    },

    error(message: string, options?: notifyOptions) {
        toast.error(message, {
            id: options?.id,
            description: options?.description,
            duration: options?.duration ?? 4000
        });
    },

    info(message: string, options?: notifyOptions) {
        toast(message, {
            id: options?.id,
            description: options?.description,
            duration: options?.duration ?? 3000
        });
    },

    warning(message: string, options?: notifyOptions) {
        toast(message, {
            id: options?.id,
            description: options?.description,
            duration: options?.duration ?? 4000
        });
    },

    loading(message: string, options?: notifyOptions) {
        toast.loading(message, {
            id: options?.id,
            description: options?.description
        });
    },

    dismiss(id?: string) {
        toast.dismiss(id);
    },

    promise<T>(
        promise: Promise<T>,
        message: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((error: unknown) => string);
        },
        options?: notifyOptions
    ) {
        return toast.promise(promise, {
            loading: message.loading,
            success: (data) => {
                if (typeof message.success === "function") {
                    return message.success(data);
                }
                return message.success;
            },
            error: (error) => {
                if (typeof message.error === "function") {
                    return message.error(error);
                }
                return message.error;
            },
            id: options?.id,
            description: options?.description
        })
    }
}