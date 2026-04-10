import { clearAuth, setAuthState, type AuthState } from "./auth.store";
import { http } from "../../app/shared/lib/http-interceptors";
import { createdEnvelopeSchema, okEnvelopeSchema } from "../../app/shared/lib/response.schemas";
import { validate } from "../../app/shared/lib/validate";
import { changePasswordBodySchema, forgotPasswordBodySchema, loginBodySchema, loginResponseSchema, registerBodySchema, registerResponseSchema, resetPasswordBodySchema, type ForgotPasswordBody, type LoginBody, type RegisterBody } from "./auth.schemas";

export const authApi = {
    register: async (data: unknown) => {
        const validatedData: RegisterBody = validate(registerBodySchema)(data);

        const response = await http.post('/auth/register', validatedData);

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

        await http.post('/auth/logout', {}, {  
            headers: {
                'x-csrf-token': csrfToken,
            }
        });

        clearAuth();
    },

    forgotPassword: async (data: unknown) => {
        const validatedData: ForgotPasswordBody = validate(forgotPasswordBodySchema)(data);

        await http.post('/auth/forgot-password', validatedData);
    },

    resetPassword: async (data: unknown) => {
        const validatedData = validate(resetPasswordBodySchema)(data);

        await http.post('/auth/reset-password', validatedData);

        clearAuth();
    },

    changePassword: async (data: unknown) => {
        const validatedData = validate(changePasswordBodySchema)(data);

        await http.patch('/auth/change-password', validatedData);

        clearAuth();
    }
}
