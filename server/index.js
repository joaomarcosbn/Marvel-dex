// server/index.js
require("dotenv").config(); // Carrega as variáveis de ambiente do arquivo .env
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // Ou use o fetch nativo se seu Node.js suportar
const crypto = require("crypto"); // Para gerar o hash MD5

const app = express();
const PORT = process.env.PORT || 3000; // Porta do seu servidor

// Chaves da API Marvel - SEGURAS no servidor!
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BASE_URL = "https://gateway.marvel.com/v1/public";

// Middleware para permitir requisições de diferentes origens (seu frontend)
app.use(cors());
// Middleware para parsear JSON no corpo das requisições (se necessário, mas não para este caso)
app.use(express.json());

// Função para gerar o hash MD5 da Marvel
function generateMarvelHash(ts, privateKey, publicKey) {
  const hashString = ts + privateKey + publicKey;
  return crypto.createHash("md5").update(hashString).digest("hex");
}

// Rota para buscar um personagem aleatório
app.get("/api/random-character", async (req, res) => {
  try {
    const ts = new Date().getTime().toString();
    const hash = generateMarvelHash(ts, PRIVATE_KEY, PUBLIC_KEY);

    // Primeiro, obtenha o total de personagens para calcular um offset aleatório
    const paramsTotal = new URLSearchParams({
      ts: ts,
      apikey: PUBLIC_KEY,
      hash: hash,
      limit: 1,
    });
    const urlTotal = `${BASE_URL}/characters?${paramsTotal.toString()}`;
    const responseTotal = await fetch(urlTotal);
    const dataTotal = await responseTotal.json();
    const totalCharacters = dataTotal.data.total;

    if (totalCharacters === 0) {
      return res.status(404).json({ error: "Nenhum personagem encontrado." });
    }

    const randomOffset = Math.floor(Math.random() * totalCharacters);

    // Em seguida, obtenha um personagem aleatório com o offset calculado
    const paramsRandom = new URLSearchParams({
      ts: ts,
      apikey: PUBLIC_KEY,
      hash: hash,
      offset: randomOffset,
      limit: 1,
    });
    const urlRandom = `${BASE_URL}/characters?${paramsRandom.toString()}`;
    const responseRandom = await fetch(urlRandom);
    const dataRandom = await responseRandom.json();

    if (dataRandom.data.results && dataRandom.data.results.length > 0) {
      res.json(dataRandom.data.results[0]);
    } else {
      res
        .status(404)
        .json({ error: "Personagem não encontrado com o offset aleatório." });
    }
  } catch (error) {
    console.error("Erro ao buscar personagem aleatório:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

// Rota para buscar personagens por nome
app.get("/api/characters/search", async (req, res) => {
  const { searchTerm } = req.query; // Pega o termo de busca dos parâmetros da URL

  if (!searchTerm) {
    return res
      .status(400)
      .json({ error: "Por favor, forneça um termo de busca." });
  }

  try {
    const ts = new Date().getTime().toString();
    const hash = generateMarvelHash(ts, PRIVATE_KEY, PUBLIC_KEY);

    const params = new URLSearchParams({
      ts: ts,
      apikey: PUBLIC_KEY,
      hash: hash,
      nameStartsWith: searchTerm,
      limit: 20,
    });

    const url = `${BASE_URL}/characters?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    res.json(data.data.results || []); // Retorna os resultados ou um array vazio
  } catch (error) {
    console.error("Erro ao buscar personagens:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

// Rota para buscar detalhes de um personagem específico e seus quadrinhos
app.get("/api/character/:id", async (req, res) => {
  const characterId = req.params.id;

  try {
    const ts = new Date().getTime().toString();
    const hash = generateMarvelHash(ts, PRIVATE_KEY, PUBLIC_KEY);

    // Busca detalhes do personagem
    const paramsCharacter = new URLSearchParams({
      ts: ts,
      apikey: PUBLIC_KEY,
      hash: hash,
    });
    const urlCharacter = `${BASE_URL}/characters/${characterId}?${paramsCharacter.toString()}`;
    const responseCharacter = await fetch(urlCharacter);
    const dataCharacter = await responseCharacter.json();

    if (!responseCharacter.ok || !dataCharacter.data.results.length) {
      return res.status(404).json({ error: "Personagem não encontrado." });
    }
    const character = dataCharacter.data.results[0];

    // Busca quadrinhos do personagem
    const paramsComics = new URLSearchParams({
      ts: ts,
      apikey: PUBLIC_KEY,
      hash: hash,
      limit: 10,
      orderBy: "-onsaleDate",
    });
    const urlComics = `${BASE_URL}/characters/${characterId}/comics?${paramsComics.toString()}`;
    const responseComics = await fetch(urlComics);
    const dataComics = await responseComics.json();

    const comics = dataComics.data.results || [];

    res.json({ character, comics });
  } catch (error) {
    console.error("Erro ao buscar detalhes do personagem:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});
