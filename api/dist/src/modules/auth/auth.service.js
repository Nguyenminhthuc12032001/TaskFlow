import { loginResponseSchema, registerResponseSchema, } from "./auth.schemas.js";
import { authRepo } from "./auth.repo.js";
import { hash, compare } from "../../common/utils/crypto.js";
import { AppError } from "../../common/errors/AppError.js";
import { signAccessToken, signRefreshToken } from "../../common/utils/jwt.js";
import { validateResponse } from "../../common/utils/response/validate.js";
export const authService = {
    async register(data) {
        const existing = await authRepo.findUserByEmail(data.email);
        if (existing) {
            throw new AppError("Email already exists", 409);
        }
        const passwordHash = await hash(data.password);
        const user = await authRepo.createUser({
            email: data.email,
            name: data.name,
            passwordHash: passwordHash,
        });
        const accessTokenPayload = {
            id: user.id,
            email: user.email,
            name: user.name
        };
        const accessToken = signAccessToken(accessTokenPayload);
        const refreshTokenPayload = {
            id: user.id,
            version: 1
        };
        const refreshToken = signRefreshToken(refreshTokenPayload);
        await authRepo.saveRefreshToken(user.id, await hash(refreshToken), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        const safeUser = {
            id: user.id,
            name: user.name,
            email: user.email,
        };
        const registerResult = {
            user: safeUser,
            accessToken
        };
        const validateRegisterResult = validateResponse(registerResponseSchema);
        return validateRegisterResult(registerResult);
    },
    async login(data) {
        const match = await authRepo.findUserByEmail(data.email);
        if (!match) {
            throw new AppError("Invalid email or password", 401);
        }
        const isvalid = await compare(data.password, match.passwordHash);
        if (!isvalid) {
            throw new AppError("Invalid email or password", 401);
        }
        const accessTokenPayload = {
            id: match.id,
            email: match.email,
            name: match.name
        };
        const accessToken = signAccessToken(accessTokenPayload);
        const refreshTokenPayload = {
            id: match.id,
            version: 1
        };
        const refreshToken = signRefreshToken(refreshTokenPayload);
        await authRepo.saveRefreshToken(match.id, await hash(refreshToken), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        const safeUser = {
            id: match.id,
            name: match.name,
            email: match.email
        };
        const loginResult = {
            user: safeUser,
            accessToken,
        };
        const validateLoginResult = validateResponse(loginResponseSchema);
        return validateLoginResult(loginResult);
    },
    async logout(refreshToken) {
    },
    async refresh(refreshToken) {
    },
    async forgotPassword(data) {
    },
    async resetPassword(data) {
    },
    async changePassword(userId, data) {
    },
    async me(userId) {
    },
};
