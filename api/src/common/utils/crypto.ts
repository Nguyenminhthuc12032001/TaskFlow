import bcrypt from "bcrypt";

export async function hash(plaintext: string) {
    return bcrypt.hash(plaintext, 12);
}

export async function compare(plain: string, hashed: string) {
    return bcrypt.compare(plain, hashed);
}