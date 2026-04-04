import { clearAuth, setAuthState, type AuthState } from "./auth.store";
import { http } from "../../lib/http-interceptors";
import { createdEnvelopeSchema, okEnvelopeSchema } from "../../lib/response.schemas";
import { validate } from "../../lib/validate";
import { changePasswordBodySchema, forgotPasswordBodySchema, loginBodySchema, loginResponseSchema, registerBodySchema, registerResponseSchema, resetPasswordBodySchema, type ForgotPasswordBody, type LoginBody, type RegisterBody } from "./auth.schemas";

export const authApi = {
    register: async (data: unknown) => {
        const validatedData: RegisterBody = validate(registerBodySchema)(data);

        const response = await http.post('/auth/register', validatedData);

        if (response.status !== 201) {
            throw new Error(`Registration failed with status ${response.status}`);
            //Need to handle this error properly in the UI, maybe by showing a toast notification or an error message
        }

        const envelope = response.data;
        const envelopeSchema = createdEnvelopeSchema(registerResponseSchema);
        const validatedEnvelope = validate(envelopeSchema)(envelope);

        const result = validatedEnvelope.data;

        const authState: AuthState = {
            status: "authenticated",
            accessToken: result.accessToken,
            user: result.user
        };

        setAuthState(authState);
    },

    login: async (data: unknown) => {
        const validatedData: LoginBody = validate(loginBodySchema)(data);

        const response = await http.post('/auth/login', validatedData);

        if (response.status !== 200) {
            throw new Error(`Login failed with status ${response.status}`);
            //Need to handle this error properly in the UI, maybe by showing a toast notification or an error message
        }

        const envelope = response.data;
        const envelopeSchema = okEnvelopeSchema(loginResponseSchema);
        const validatedEnvelope = validate(envelopeSchema)(envelope);

        const result = validatedEnvelope.data;

        const authState: AuthState = {
            status: "authenticated",
            accessToken: result.accessToken,
            user: result.user
        }

        setAuthState(authState);
    },

    logout: async () => {
        const csrfToken = await http.get('/csurf-token').then(res => res.data.csrfToken);   

        const response = await http.post('/auth/logout', {}, {  
            headers: {
                'x-csrf-token': csrfToken,
            }
        });

        if (response.status !== 204) {
            throw new Error(`Logout failed with status ${response.status}`);
            //Need to handle this error properly in the UI, maybe by showing a toast notification or an error message
        }

        clearAuth();
    },

    forgotPassword: async (data: unknown) => {
        const validatedData: ForgotPasswordBody = validate(forgotPasswordBodySchema)(data);

        const response = await http.post('/auth/forgot-password', validatedData);

        if (response.status !== 204) {
            throw new Error(`Forgot password request failed with status ${response.status}`);
            //Need to handle this error properly in the UI, maybe by showing a toast notification or an error message
        }
    },

    resetPassword: async (data: unknown) => {
        const validatedData = validate(resetPasswordBodySchema)(data);

        const response = await http.post('/auth/reset-password', validatedData);

        if (response.status !== 204) {
            throw new Error(`Reset password request failed with status ${response.status}`);
            //Need to handle this error properly in the UI, maybe by showing a toast notification or an error message
        }

        clearAuth();
    },

    changePassword: async (data: unknown) => {
        const validatedData = validate(changePasswordBodySchema)(data);

        const response = await http.patch('/auth/change-password', validatedData);

        if (response.status !== 204) {
            throw new Error(`Change password request failed with status ${response.status}`);
            //Need to handle this error properly in the UI, maybe by showing a toast notification or an error message
        }

        clearAuth();
    }
}
