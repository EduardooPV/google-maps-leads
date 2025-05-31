const axios = require("axios");
const path = require("path");
const fs = require("fs");
const PQueue = require("p-queue").default;
const config = require("../config/search-config");
require("dotenv").config();

const apiKey = process.env.GOOGLE_API_KEY;
const { useMock, search } = config;

async function searchPlaces(spinner) {
  if (useMock) return require("./mock").searchPlacesMock();

  return searchPlacesReal(spinner);
}

async function getPlaceDetails(placeId) {
  if (useMock) return require("./mock").getPlaceDetailsMock(placeId);

  return getPlaceDetailsReal(placeId);
}

async function searchPlacesReal(spinner) {
  const results = [];
  let pageToken = null;
  let page = 1;

  const queue = new PQueue({
    concurrency: 2,
    interval: 60000,
    intervalCap: 50,
  });

  do {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    );
    url.searchParams.set("location", search.location);
    url.searchParams.set("radius", search.radius);
    url.searchParams.set("keyword", search.keyword);
    url.searchParams.set("key", apiKey);
    if (pageToken) url.searchParams.set("pagetoken", pageToken);

    const { data } = await queue.add(() => axios.get(url.toString()));

    if (data.status !== "OK" && data.status !== "INVALID_REQUEST") {
      throw new Error(`Erro ao buscar página ${page}: ${data.status}`);
    }

    if (data.results) {
      results.push(...data.results);
      spinner.text = `🔄 Página ${page} carregada. Total acumulado: ${results.length}`;
    }

    pageToken = data.next_page_token;

    if (pageToken) {
      await new Promise((r) => setTimeout(r, 2000));
      page++;
    }
  } while (pageToken);

  return results;
}

async function getPlaceDetailsReal(placeId) {
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,website,rating&key=${apiKey}`;
  const { data } = await axios.get(detailsUrl);

  if (data.status !== "OK") {
    throw new Error(
      `API Error: ${data.status} - ${data.error_message || "sem mensagem"}`
    );
  }

  return data.result;
}

async function saveCoordinate(outputDir) {
  try {
    const filePath = path.join(outputDir, "coordenadas.json");

    fs.mkdirSync(outputDir, { recursive: true });

    let areas = [];
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, "utf-8");
        areas = JSON.parse(data);
      } catch {
        areas = [];
      }
    }

    const currentArea = {
      location: search.location,
      radius: search.radius,
      keyword: search.keyword,
      date: new Date().toISOString(),
    };

    areas.push(currentArea);
    fs.writeFileSync(filePath, JSON.stringify(areas, null, 2), "utf-8");

    console.log(`\n✔️  Arquivo de coordenadas salvo. \n \n`);
  } catch (error) {
    console.error("Erro ao salvar coordenadas:", error);
    throw error;
  }
}

module.exports = {
  searchPlaces,
  getPlaceDetails,
  saveCoordinate,
};
