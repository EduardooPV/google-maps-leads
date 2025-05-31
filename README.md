# Google Maps Leads

Este projeto automatiza a busca de empresas no Google Maps, filtrando e salvando resultados em arquivos CSV separados por empresas com site, sem site e com WhatsApp. Ideal para geração de leads segmentados por cidade e palavra-chave.

## Como funciona

- Realiza buscas no Google Maps Places API por empresas de um segmento (ex: "clínica estética") em uma cidade.
- Para cada empresa encontrada, busca detalhes (telefone, site, avaliação).
  - O `queue` é configurado para permitir no máximo 50 requisições por minuto (intervalCap: 50, interval: 60000), respeitando o limite gratuito da API.
  - Ao buscar tem um delay automático de 2 segundos para ativar o `next_page_token`, conforme exigido pela documentação do Google.
- Classifica empresas em quatro grupos: com site, sem site, com WhatsApp e com Instagram.
- Salva os resultados em arquivos CSV na pasta `planilhas/<cidade>/`.
- Salva também as coordenadas e parâmetros de busca em `coordenadas.json`.

## Como rodar

1. **Instale as dependências:**
   ```sh
   npm install
   ```
2. **Configure a chave da API:**

   Crie um arquivo `.env` na raiz com:

   ```
   GOOGLE_API_KEY=SEU_TOKEN_AQUI
   ```

3. **Execute o script:**
   ```sh
   npm start <nome-da-cidade>
   # Exemplo:
   npm start sao-paulo
   ```
   Os arquivos CSV serão gerados em `planilhas/<cidade>/`.

## Onde alterar variáveis de busca

**Palavra-chave, localização e raio:**

Edite o arquivo `search-config.js`:

- location: latitude e longitude central da busca
- radius: raio da busca em metros
- keyword: segmento/termo pesquisado
- useMock: defina como false para usar a API real (requer chave no .env)

## Parâmetros e arquivos gerados

- Parâmetro obrigatório: nome da cidade (ex: `sao-paulo`).
- Gera os arquivos:
  - `com-site.csv` — empresas com site
  - `sem-site.csv` — empresas sem site
  - `com-whatsapp.csv` — empresas com link WhatsApp
  - `com-instagram.csv` — empresas com link Instagram
  - `coordenadas.json` — histórico dos parâmetros de busca
  - `log_erros.json` — erros ocorridos na execução

## Observações

- O script respeita limites de requisição da API do Google.
- Para outros segmentos, altere a variável `keyword`.
- Para rodar em produção, lembre-se de definir `USE_MOCK = false`.
