#!/usr/bin/env node
/**
 * Script tạo hash mật khẩu admin
 * Cách dùng: node scripts/generate-hash.js <mật-khẩu> <salt>
 * Ví dụ:     node scripts/generate-hash.js MyPassword123 my-random-salt
 */

const crypto = require("crypto");

const password = process.argv[2];
const salt = process.argv[3] || "default-salt";

if (!password) {
  console.error("❌ Thiếu mật khẩu!");
  console.error(
    "Cách dùng: node scripts/generate-hash.js <mật-khẩu> <salt>"
  );
  console.error("Ví dụ:     node scripts/generate-hash.js MyPass123 my-salt");
  process.exit(1);
}

const hash = crypto
  .createHash("sha256")
  .update(password + salt)
  .digest("hex");

console.log("\n=== HASH MẬT KHẨU ADMIN ===");
console.log("Mật khẩu:", password);
console.log("Salt:     ", salt);
console.log("Hash:     ", hash);
console.log("\nThêm các dòng sau vào .env.local hoặc Vercel Environment Variables:");
console.log(`\nADMIN_PASSWORD_HASH=${hash}`);
console.log(`PASSWORD_SALT=${salt}`);
console.log(
  "\n⚠️  Giữ bí mật các giá trị này. Không commit .env.local vào git!\n"
);
