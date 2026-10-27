
import { calculateSmsParts } from "./src/utils/sms.utils.js";

console.log("Short SMS:", calculateSmsParts("Hello world"));

console.log(
  "Long SMS:",
  calculateSmsParts("A".repeat(200))
);

console.log(
  "Nepali SMS:",
  calculateSmsParts("नमस्ते")
);

console.log(
  "Emoji SMS:",
  calculateSmsParts("Hello 😊")
);
