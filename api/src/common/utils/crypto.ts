import bcrypt from "bcrypt";

export async function hash(password: string) {
    return bcrypt.hash(password, 12);
}

export async function compare(plain: string, hashed: string) {
    return bcrypt.compare(plain, hashed);
}