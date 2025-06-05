const fs = require("fs");
const path = require("path");

function nextCoordinate(
  { latitude, longitude },
  direction,
  stepMeters = 50000
) {
  const earthRadius = 6378137;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  let newLat = latitude;
  let newLng = longitude;

  if (direction === "norte") {
    newLat = latitude + toDeg(stepMeters / earthRadius);
  } else if (direction === "sul") {
    newLat = latitude - toDeg(stepMeters / earthRadius);
  } else if (direction === "leste") {
    newLng =
      longitude + toDeg(stepMeters / (earthRadius * Math.cos(toRad(latitude))));
  } else if (direction === "oeste") {
    newLng =
      longitude - toDeg(stepMeters / (earthRadius * Math.cos(toRad(latitude))));
  } else {
    console.log("Direção inválida. Use: norte, sul, leste ou oeste.");
  }

  return { latitude: newLat, longitude: newLng };
}

function updateSearchConfig(newLat, newLng) {
  const configPath = path.join(__dirname, "../config/search-config.js");
  let content = fs.readFileSync(configPath, "utf-8");

  content = content.replace(
    /(location:\s*\")[^\"]+(\")/,
    `$1${newLat},${newLng}$2`
  );
  fs.writeFileSync(configPath, content, "utf-8");
}

module.exports = { nextCoordinate, updateSearchConfig };
