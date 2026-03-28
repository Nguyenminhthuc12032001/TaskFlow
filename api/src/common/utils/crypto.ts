import bcrypt from 'bcrypt';

export async function hashValue(plaintext: string) {
  return bcrypt.hash(plaintext, 12);
}

export async function verifyHash(plain: string, hashed: string) {
  return bcrypt.compare(plain, hashed);
}
