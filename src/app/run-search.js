const ora = require("ora").default;
const { searchFullCompany } = require("../services/company-service");
const { saveCSV } = require("../infra/csv-write");
const {
  saveCoordinate,
  alreadySearchedCoordinate,
} = require("../infra/google-api");
const { getOutputPaths } = require("../utils/paths");
require("dotenv").config();
const { search } = require("../config/search-config");
const {
  nextCoordinate,
  updateSearchConfig,
} = require("../utils/coordinate-step");

async function runSearch(city) {
  // Exemplo de uso:
  const atual = { latitude: -23.550521, longitude: -46.633308 };
  const proxima = nextCoordinate(atual, "norte"); // ou "sul", "leste", "oeste"
  updateSearchConfig(proxima.latitude, proxima.longitude);

  const { outputDir } = getOutputPaths(city);
  if (alreadySearchedCoordinate(outputDir, search)) {
    console.log("❌ Esta coordenada já foi processada. Abortando execução.");
    process.exit(1);
  }

  const spinner = ora("Iniciando busca de empresas...").start();
  const erros = [];

  try {
    const results = await searchFullCompany(spinner);
    const {
      writerWithPath,
      writerWithoutPath,
      writerWhatsappPath,
      writerInstagramPath,
      outputDir,
    } = getOutputPaths(city);

    try {
      await saveCSV(writerWithPath, results.withSite);
    } catch (err) {
      erros.push({
        tipo: "Gravação CSV",
        arquivo: writerWithPath,
        erro: err.message,
      });
      console.warn(`❌ Erro ao salvar CSV com site: ${err.message}`);
    }

    try {
      await saveCSV(writerWithoutPath, results.withoutSite);
    } catch (err) {
      erros.push({
        tipo: "Gravação CSV",
        arquivo: writerWithoutPath,
        erro: err.message,
      });
      console.warn(`❌ Erro ao salvar CSV sem site: ${err.message}`);
    }

    try {
      await saveCSV(writerWhatsappPath, results.withWhatsapp);
    } catch (err) {
      erros.push({
        tipo: "Gravação CSV",
        arquivo: writerWhatsappPath,
        erro: err.message,
      });
      console.warn(`❌ Erro ao salvar CSV WhatsApp: ${err.message}`);
    }

    try {
      await saveCSV(writerInstagramPath, results.withInstagram);
    } catch (err) {
      erros.push({
        tipo: "Gravação CSV",
        arquivo: writerInstagramPath,
        erro: err.message,
      });
      console.warn(`❌ Erro ao salvar CSV Instagram: ${err.message}`);
    }

    try {
      await saveCoordinate(outputDir);
    } catch (err) {
      erros.push({ tipo: "Salvar Coordenadas", erro: err.message });
      console.warn(`❌ Erro ao salvar coordenadas: ${err.message}`);
    }

    spinner.succeed(`Processo concluído!
         → Novas empresas com site: ${results.withSite.length}
         → Novas empresas sem site: ${results.withoutSite.length}
         → Novas empresas com link WhatsApp: ${results.withWhatsapp.length}
         → Novas empresas com link Instagram: ${results.withInstagram.length}
         `);

    console.log("Verifique nas pasta /planilhas/<cidade>");

    spinner.stop();

    if (erros.length > 0) {
      const logPath = path.join(outputDir, "log_erros.json");
      fs.writeFileSync(logPath, JSON.stringify(erros, null, 2), "utf-8");

      spinner.warn(
        `⚠️ Foram registrados ${erros.length} erro(s). Veja o arquivo 'log_erros.json' para detalhes.`
      );
    }
  } catch (err) {
    spinner.fail("Erro durante execução:");
    console.error(err);
  }
}

module.exports = { runSearch };
