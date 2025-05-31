const ora = require("ora").default;
const { searchFullCompany } = require("../services/company-service");
const { saveCSV } = require("../infra/csv-write");
const { saveCoordinate } = require("../infra/google-api");
const { getOutputPaths } = require("../utils/paths");

async function runSearch(city) {
  const spinner = ora("Iniciando busca de empresas... \n").start();
  const erros = [];

  try {
    const results = await searchFullCompany(city, spinner);
    const { writerWithPath, writerWithoutPath, writerWhatsappPath, outputDir } =
      getOutputPaths(city);

    try {
      spinner.text = "Salvando CSV com site...";
      await saveCSV(writerWithPath, results.withSite);
      spinner.text = `Arquivo 'empresas_com_site.csv' salvo. Total: ${results.withSite.length}`;
    } catch (err) {
      erros.push({
        tipo: "Gravação CSV",
        arquivo: writerWithPath,
        erro: err.message,
      });
      console.warn(`❌ Erro ao salvar CSV com site: ${err.message}`);
    }

    try {
      spinner.text = "Salvando CSV sem site...";
      await saveCSV(writerWithoutPath, results.withoutSite);
      spinner.text = `Arquivo 'empresas_sem_site.csv' salvo. Total: ${results.withoutSite.length}`;
    } catch (err) {
      erros.push({
        tipo: "Gravação CSV",
        arquivo: writerWithoutPath,
        erro: err.message,
      });
      console.warn(`❌ Erro ao salvar CSV sem site: ${err.message}`);
    }

    try {
      spinner.text = "Salvando CSV com WhatsApp...";
      await saveCSV(writerWhatsappPath, results.withWhatsapp);
      spinner.text = `Arquivo 'empresas_whatsapp.csv' salvo. Total: ${results.withWhatsapp.length}`;
    } catch (err) {
      erros.push({
        tipo: "Gravação CSV",
        arquivo: writerWhatsappPath,
        erro: err.message,
      });
      console.warn(`❌ Erro ao salvar CSV WhatsApp: ${err.message}`);
    }

    try {
      await saveCoordinate(outputDir);
    } catch (err) {
      erros.push({ tipo: "Salvar Coordenadas", erro: err.message });
      console.warn(`❌ Erro ao salvar coordenadas: ${err.message}`);
    }

    spinner.succeed(`Processo concluído!
         → Novas empresas com site: ${results.withSite.length}
         → Novas empresas com link WhatsApp: ${results.withWhatsapp.length}
         → Novas empresas sem site: ${results.withoutSite.length}`);

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
