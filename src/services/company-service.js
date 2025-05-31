const PQueue = require("p-queue").default;
const { searchPlaces, getPlaceDetails } = require("../infra/google-api");
const { Company } = require("../models/company");

const queue = new PQueue({ concurrency: 2, interval: 60000, intervalCap: 50 });

async function searchFullCompany(spinner) {
  const results = await searchPlaces(spinner);
  const withSite = [],
    withoutSite = [],
    withWhatsapp = [],
    withInstagram = [];
  erros = [];
  let processed = 0;

  const promises = results.map((place) =>
    queue.add(async () => {
      try {
        const details = await getPlaceDetails(place.place_id);
        const company = new Company(place.name, details);

        if (company.isWhatsapp()) withWhatsapp.push(company);
        else if (company.hasWebsite()) withSite.push(company);
        else if (company.isInstagram()) withInstagram.push(company);
        else withoutSite.push(company);
      } catch (err) {
        erros.push({ place_id: place.place_id, erro: err.message });
      } finally {
        spinner.text = `Emmpresas encontradas: ${processed + 2}/${
          results.length
        } \n`;
        processed++;
      }
    })
  );

  await Promise.all(promises);

  return { withSite, withoutSite, withWhatsapp, withInstagram, erros };
}

module.exports = { searchFullCompany };
