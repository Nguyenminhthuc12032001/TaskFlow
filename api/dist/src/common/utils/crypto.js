import bcrypt from "bcrypt";
export async function hashValue(plaintext) {
    return bcrypt.hash(plaintext, 12);
}
export async function verifyHash(plain, hashed) {
    return bcrypt.compare(plain, hashed);
}
