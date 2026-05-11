const fs = require("fs");

let content = fs.readFileSync("src/App.tsx", "utf-8");
let injection = fs.readFileSync("/diet-tab.txt", "utf-8");
// remove export const
injection = injection.replace("export const dietTabRenderer = `", "").slice(0, -2); // remove backtick

const startIndex = content.indexOf('{activeTab === "diet" && (');
const endIndex = content.indexOf('{activeTab === "training" && (');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + injection + "\n            " + content.substring(endIndex);
  fs.writeFileSync("src/App.tsx", content);
  console.log("App.tsx updated!");
} else {
  console.log("Could not find boundaries.");
}
