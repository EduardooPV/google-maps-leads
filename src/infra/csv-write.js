const fs = require("fs");

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

const saveCSV = async (filePath, records) => {
  const header = [
    { id: "name", title: "Nome" },
    { id: "phone", title: "Telefone" },
    { id: "rating", title: "Classificação" },
    { id: "website", title: "Website" },
  ];

  await writeRecordsAppend(filePath, header, records);
};

module.exports = { saveCSV, writeRecordsAppend };
