const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run auth:hash -- "your new password"');
  process.exit(1);
}

const crypto = require("crypto");
const hash = crypto.createHash("sha256").update(password, "utf8").digest("hex");

console.log(hash);
