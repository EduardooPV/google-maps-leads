require("dotenv").config();
const axios = require("axios");
const ora = require("ora").default;
const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const PQueue = require("p-queue").default;

const cidade = process.argv[2];

if (!cidade) {
  console.error("❌ Você precisa informar o nome da cidade. Exemplo:");
  console.error("   node index.js sao-paulo");
  process.exit(1);
}

const USE_MOCK = true;
const apiKey = process.env.GOOGLE_API_KEY;
const location = "-23.550521,-46.633308";
const radius = 50000;
const keyword = "clínica estética";

const outputDir = path.join(
  __dirname,
  "planilhas",
  cidade.toLowerCase().replace(/\s/g, "-")
);

const writerComPath = path.join(outputDir, "empresas_com_site.csv");
const writerSemPath = path.join(outputDir, "empresas_sem_site.csv");
const writerWhatsappPath = path.join(outputDir, "empresas_whatsapp.csv");

const queue = new PQueue({ concurrency: 2, interval: 60000, intervalCap: 50 });

async function searchPlacesReal() {
  const results = [];
  let pageToken = null;
  let page = 1;

  do {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    );
    url.searchParams.set("location", location);
    url.searchParams.set("radius", radius);
    url.searchParams.set("keyword", keyword);
    url.searchParams.set("key", apiKey);
    if (pageToken) url.searchParams.set("pagetoken", pageToken);

    const { data } = await axios.get(url.toString());

    if (data.status !== "OK" && data.status !== "INVALID_REQUEST") {
      throw new Error(`Erro ao buscar página ${page}: ${data.status}`);
    }

    if (data.results) {
      results.push(...data.results);
      console.log(
        `\n🔄 Página ${page} carregada. Total acumulado: ${results.length}`
      );
    }

    pageToken = data.next_page_token;

    if (pageToken) {
      await new Promise((r) => setTimeout(r, 2000)); // Espera obrigatória para ativar o next_page_token
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

const writeRecordsAppend = async (filePath, header, records) => {
  if (!records.length) return;

  const fileExists = fs.existsSync(filePath);
  const writeStream = fs.createWriteStream(filePath, {
    flags: fileExists ? "a" : "w",
  });

  if (!fileExists) {
    const headerLine = header.map((h) => h.title).join(",") + "\n";
    writeStream.write(headerLine);
  }

  for (const record of records) {
    const row =
      header
        .map(({ id }) => {
          const val = record[id] ?? "";
          return typeof val === "string" &&
            (val.includes(",") || val.includes('"'))
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        })
        .join(",") + "\n";
    writeStream.write(row);
  }

  writeStream.end();

  return new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });
};

async function searchPlacesMock() {
  return [
    { place_id: "1", name: "Estética Bella" },
    { place_id: "2", name: "Spa Relax" },
    { place_id: "3", name: "Clínica Nova Vida" },
    { place_id: "4", name: "Clínica ASDasd" },
  ];
}

async function getPlaceDetailsMock(placeId) {
  const mockData = {
    1: {
      name: "Estética Bella",
      formatted_phone_number: "1234-5678",
      website: null,
      rating: 4.5,
    },
    2: {
      name: "Spa Relax",
      formatted_phone_number: "2345-6789",
      website: "https://sparelax.com.br",
      rating: 4.0,
    },
    3: {
      name: "Clínica Nova Vida",
      formatted_phone_number: "3456-7890",
      website: null,
      rating: 3.8,
    },
    4: {
      name: "Clínica ASDasd",
      formatted_phone_number: "3456-7891",
      website: "https://wa.me/PHONE_NUMBER?text=YOUR_MESSAGE onde PHONE_NUMBER",
      rating: 3.7,
    },
  };

  return mockData[placeId];
}

const searchPlaces = USE_MOCK ? searchPlacesMock : searchPlacesReal;
const getPlaceDetails = USE_MOCK ? getPlaceDetailsMock : getPlaceDetailsReal;

async function saveCoordinate() {
  const coordenadasFile = path.join(outputDir, "coordenadas.json");

  fs.mkdirSync(outputDir, { recursive: true });

  let areas = [];
  if (fs.existsSync(coordenadasFile)) {
    try {
      const data = fs.readFileSync(coordenadasFile, "utf-8");
      areas = JSON.parse(data);
    } catch {
      areas = [];
    }
  }

  const currentArea = {
    location,
    radius,
    keyword,
    date: new Date().toISOString(),
  };

  areas.push(currentArea);
  fs.writeFileSync(coordenadasFile, JSON.stringify(areas, null, 2), "utf-8");
}

async function run() {
  const spinner = ora("Buscando empresas no Google Maps...").start();

  try {
    const results = await searchPlaces();
    spinner.text = `Total de empresas encontradas: ${results.length}`;

    const comSite = [];
    const semSite = [];
    const comWhatsapp = [];

    let processedCount = 0;
    const erros = [];

    function updateSpinner() {
      spinner.text =
        `Processando empresas: ${processedCount}/${results.length} | ` +
        `Com site: ${comSite.length} | Sem site: ${semSite.length}`;
    }

    const promises = results.map((place) =>
      queue.add(async () => {
        try {
          const details = await getPlaceDetails(place.place_id);

          const empresa = {
            name: details.name || place.name,
            phone: details.formatted_phone_number || "N/A",
            rating: details.rating || "N/A",
            website: details.website || "N/A",
          };

          if (details.website) {
            const site = details.website.toLowerCase();

            if (site.includes("wa.me") || site.includes("api.whatsapp.com")) {
              comWhatsapp.push(empresa);
            } else {
              comSite.push(empresa);
            }
          } else {
            semSite.push(empresa);
          }
        } catch (err) {
          const erroMsg = `\n❌ Erro ao buscar detalhes de "${place.name}" (ID: ${place.place_id}): ${err.message}`;
          console.warn(erroMsg);

          erros.push({
            tipo: "Detalhes da empresa",
            empresa: place.name,
            place_id: place.place_id,
            erro: err.message,
          });
        } finally {
          processedCount++;
          updateSpinner();
        }
      })
    );

    await Promise.all(promises);

    fs.mkdirSync(outputDir, { recursive: true });

    const header = [
      { id: "name", title: "Nome" },
      { id: "phone", title: "Telefone" },
      { id: "rating", title: "Classificação" },
      { id: "website", title: "Website" },
    ];

    try {
      spinner.text = "Salvando arquivos CSV: empresas com site...";
      await writeRecordsAppend(writerComPath, header, comSite);
      spinner.text = `Arquivo 'empresas_com_site.csv' salvo. Total: ${comSite.length}`;
    } catch (err) {
      erros.push({
        tipo: "Gravação CSV",
        arquivo: writerComPath,
        erro: err.message,
      });
      console.warn(`❌ Erro ao salvar CSV com site: ${err.message}`);
    }

    try {
      spinner.text = "Salvando arquivos CSV: empresas com WhatsApp...";
      await writeRecordsAppend(writerWhatsappPath, header, comWhatsapp);
      spinner.text = `Arquivo 'empresas_whatsapp.csv' salvo. Total: ${comWhatsapp.length}`;
    } catch (err) {
      erros.push({
        tipo: "Gravação CSV",
        arquivo: writerWhatsappPath,
        erro: err.message,
      });
      console.warn(`❌ Erro ao salvar CSV WhatsApp: ${err.message}`);
    }

    try {
      spinner.text = "Salvando arquivos CSV: empresas sem site...";
      await writeRecordsAppend(writerSemPath, header, semSite);
      spinner.text = `Arquivo 'empresas_sem_site.csv' salvo. Total: ${semSite.length}`;
    } catch (err) {
      erros.push({
        tipo: "Gravação CSV",
        arquivo: writerSemPath,
        erro: err.message,
      });
      console.warn(`❌ Erro ao salvar CSV sem site: ${err.message}`);
    }

    await saveCoordinate();

    spinner.succeed(`\nProcesso concluído!
      → Novas empresas com site: ${comSite.length}
      → Novas empresas com link WhatsApp: ${comWhatsapp.length}
      → Novas empresas sem site: ${semSite.length}`);

    if (erros.length > 0) {
      const logPath = path.join(outputDir, "log_erros.json");
      fs.writeFileSync(logPath, JSON.stringify(erros, null, 2), "utf-8");

      spinner.warn(
        `⚠️ Foram registrados ${erros.length} erro(s). Veja o arquivo 'log_erros.json' para detalhes.`
      );
    }
  } catch (error) {
    spinner.fail("Erro durante a execução:");
    console.error(error);
  }
}

run();
