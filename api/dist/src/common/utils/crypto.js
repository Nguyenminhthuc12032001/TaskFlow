import bcrypt from "bcrypt";
export async function hash(password) {
    return bcrypt.hash(password, 12);
}
export async function compare(plain, hashed) {
    return bcrypt.compare(plain, hashed);
}
