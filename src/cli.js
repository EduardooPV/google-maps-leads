const { runSearch } = require("./app/run-search");

const city = process.argv[2];

if (!city) {
  console.error("Você deve passar o nome da cidade. Ex: npm start sao-paulo");
  process.exit(1);
}

runSearch(city);
