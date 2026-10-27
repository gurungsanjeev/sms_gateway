import {
  calculateSmsParts,
  normalizeNepaliPhone,
} from "./src/utils/sms.utils.js";

console.log("PHONE TESTS");

for (const phone of [
  "9841234567",
  "+9779801122334",
  "9779761234567",
  "9612345678",
  "984123456",
]) {
  console.log(phone, "=>", normalizeNepaliPhone(phone));
}

console.log("\nSMS PART TESTS");

console.log(calculateSmsParts("A".repeat(200)));
console.log(calculateSmsParts("न".repeat(100)));
console.log(calculateSmsParts("Hello 😊"));
console.log(calculateSmsParts("^".repeat(81)));