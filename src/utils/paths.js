const path = require("path");
const fs = require("fs");

function getOutputPaths(city) {
  const outputDir = path.join(__dirname, "..", "..", "planilhas", city);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return {
    outputDir,
    writerWithPath: path.join(outputDir, "com-site.csv"),
    writerWithoutPath: path.join(outputDir, "sem-site.csv"),
    writerWhatsappPath: path.join(outputDir, "com-whatsapp.csv"),
    writerInstagramPath: path.join(outputDir, "com-instagram.csv"),
  };
}

module.exports = { getOutputPaths };
