const { nextCoordinate, updateSearchConfig } = require("./coordinate-step");
const { search } = require("../config/search-config");

function parseLatLng(str) {
  const [lat, lng] = str.split(",").map(Number);
  return { latitude: lat, longitude: lng };
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Uso: node src/utils/next-coordinate.js <cidade> <direcao>");
  process.exit(1);
}

const city = args[0];
const direction = args[1];

const current = parseLatLng(search.location);
const next = nextCoordinate(current, direction);

updateSearchConfig(next.latitude, next.longitude);

console.log(
  `Nova coordenada para ${city} (${direction}): ${next.latitude},${next.longitude}`
);
console.log("Arquivo search-config.js atualizado!");
