// Arquivo de configuração de busca no Google Places
// Edite este arquivo para ajustar a localização, palavra-chave, raio de busca e modo de execução

/**
 * Define se o projeto usará os dados de mock ou a API real do Google Places.
 * true  = usa os dados falsos para testes locais
 * false = consome a API real (requer chave em process.env.GOOGLE_API_KEY)
 */
const useMock = true;

/**
 * Parâmetros da busca no Google Maps
 */
const searchParams = {
  /**
   * Localização central da busca (latitude, longitude)
   * Exemplo: São Paulo = "-23.550521,-46.633308"
   */
  location: "-23.550521,-46.633308",

  /**
   * Raio da busca em metros (máximo permitido pela API é 50.000)
   */
  radius: 50000,

  /**
   * Palavra-chave usada para encontrar estabelecimentos
   * Exemplo: clínica estética, pet shop, academia
   */
  keyword: "clínica estética",
};

module.exports = {
  useMock,
  search: searchParams,
};
