const PQueue = require("p-queue").default;
const { searchPlaces, getPlaceDetails } = require("../infra/google-api");
const { Company } = require("../models/company");

const queue = new PQueue({ concurrency: 2, interval: 60000, intervalCap: 50 });

async function searchFullCompany(cidade, spinner) {
  const results = await searchPlaces();
  const withSite = [],
    withoutSite = [],
    withWhatsapp = [],
    erros = [];
  let processed = 0;

  const promises = results.map((place) =>
    queue.add(async () => {
      try {
        const details = await getPlaceDetails(place.place_id);
        const company = new Company(place.name, details);

        if (company.isWhatsapp()) withWhatsapp.push(company);
        else if (company.hasWebsite()) withSite.push(company);
        else withoutSite.push(company);
      } catch (err) {
        erros.push({ place_id: place.place_id, erro: err.message });
      } finally {
        processed++;
        spinner.text = `Processados: ${processed}/${results.length}`;
      }
    })
  );

  await Promise.all(promises);

  return { withSite, withoutSite, withWhatsapp, erros };
}

module.exports = { searchFullCompany };
