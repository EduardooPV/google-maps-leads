class Company {
  constructor(nome, detalhes) {
    this.name = detalhes.name || nome;
    this.phone = detalhes.formatted_phone_number || "N/A";
    this.website = detalhes.website || "N/A";
    this.rating = detalhes.rating || "N/A";
  }

  hasWebsite() {
    return this.website !== "N/A";
  }

  isWhatsapp() {
    return this.website.includes("wa.me") || this.website.includes("whatsapp");
  }

  isInstagram() {
    return this.website.includes("instagram.com");
  }
}

module.exports = { Company };
