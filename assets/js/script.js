const BACKEND_URL = "http://localhost:3000/api";

const BASE_URL = "https://gateway.marvel.com/v1/public/characters";

const marvelCharacterImage = document.getElementById("marvelCharacterImage");
const marvelCharacterName = document.getElementById("marvelCharacterName");

const mainCharacterLoader = document.getElementById("mainCharacterLoader");
const mainCharacterContent = document.getElementById("mainCharacterContent");

const nextCharacterButton = document.getElementById("nextCharacterButton");
const characterSearchInput = document.getElementById("characterSearchInput");
const searchButton = document.getElementById("searchButton");
const searchResultsContainer = document.getElementById("searchResults");

const characterModal = document.getElementById("characterModal");
const closeButton = characterModal.querySelector(".close-button");
const modalCharacterName = document.getElementById("modalCharacterName");
const modalCharacterImage = document.getElementById("modalCharacterImage");
const modalCharacterDescription = document.getElementById(
  "modalCharacterDescription"
);
const modalComicsList = document.getElementById("modalComicsList");

let currentMainCharacterId = null;

function generateMarvelHash(ts, privateKey, publicKey) {
  const hashString = ts + privateKey + publicKey;
  return CryptoJS.MD5(hashString).toString();
}

function showMainCharacterLoader() {
  mainCharacterLoader.classList.add("active");
  mainCharacterContent.classList.add("hidden");
}

function hideMainCharacterLoader() {
  mainCharacterLoader.classList.remove("active");
  mainCharacterContent.classList.remove("hidden");
}

async function fetchRandomMarvelCharacter() {
  showMainCharacterLoader();

  const ts = new Date().getTime().toString();
  const hash = generateMarvelHash(ts, PRIVATE_KEY, PUBLIC_KEY);

  try {
    const paramsTotal = new URLSearchParams({
      ts: ts,
      apikey: PUBLIC_KEY,
      hash: hash,
      limit: 1,
    });

    const urlTotal = `${BASE_URL}?${paramsTotal.toString()}`;
    const responseTotal = await fetch(urlTotal);
    if (!responseTotal.ok) {
      throw new Error(
        `Erro HTTP ao buscar total: ${responseTotal.status} ${responseTotal.statusText}`
      );
    }
    const dataTotal = await responseTotal.json();
    const totalCharacters = dataTotal.data.total;

    if (totalCharacters === 0) {
      console.error("Nenhum personagem encontrado na API.");
      marvelCharacterName.textContent = "Nenhum personagem encontrado.";
      hideMainCharacterLoader();
      return;
    }

    const randomOffset = Math.floor(Math.random() * totalCharacters);

    const paramsRandom = new URLSearchParams({
      ts: ts,
      apikey: PUBLIC_KEY,
      hash: hash,
      offset: randomOffset,
      limit: 1,
    });

    const urlRandom = `${BASE_URL}?${paramsRandom.toString()}`;
    const responseRandom = await fetch(urlRandom);
    if (!responseRandom.ok) {
      throw new Error(
        `Erro HTTP ao buscar personagem: ${responseRandom.status} ${responseRandom.statusText}`
      );
    }
    const dataRandom = await responseRandom.json();

    if (dataRandom.data.results && dataRandom.data.results.length > 0) {
      const character = dataRandom.data.results[0];
      const characterName = character.name;
      const thumbnailUrl = character.thumbnail.path;
      const thumbnailExtension = character.thumbnail.extension;
      const imageUrl = `${thumbnailUrl}.${thumbnailExtension}`;

      marvelCharacterImage.src = imageUrl;
      marvelCharacterImage.alt = `Imagem de ${characterName}`;
      marvelCharacterName.textContent = characterName;
      currentMainCharacterId = character.id;
    } else {
      console.warn(
        "Nenhum personagem encontrado com o offset aleatório. Tentando novamente..."
      );
      fetchRandomMarvelCharacter();
    }
  } catch (error) {
    console.error("Ocorreu um erro ao buscar o personagem da Marvel:", error);
    marvelCharacterImage.src = "assets/images/error_placeholder.jpg";
    marvelCharacterName.textContent = "Erro ao carregar personagem.";
  } finally {
    hideMainCharacterLoader();
  }
}

async function searchMarvelCharacters(searchTerm) {
  searchResultsContainer.innerHTML =
    '<p style="color: white;">Carregando resultados...</p>';

  const ts = new Date().getTime().toString();
  const hash = generateMarvelHash(ts, PRIVATE_KEY, PUBLIC_KEY);

  try {
    const params = new URLSearchParams({
      ts: ts,
      apikey: PUBLIC_KEY,
      hash: hash,
      nameStartsWith: searchTerm,
      limit: 20,
    });

    const url = `${BASE_URL}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Erro HTTP ao buscar personagens: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const characters = data.data.results;

    searchResultsContainer.innerHTML = "";

    if (characters && characters.length > 0) {
      characters.forEach((character) => {
        const characterCard = document.createElement("div");
        characterCard.classList.add("character-card");
        characterCard.dataset.characterId = character.id;
        characterCard.addEventListener("click", () =>
          openCharacterModal(character.id)
        );

        const imageUrl = `${character.thumbnail.path}.${character.thumbnail.extension}`;
        const characterImage = document.createElement("img");
        characterImage.src = imageUrl;
        characterImage.alt = `Imagem de ${character.name}`;

        const characterName = document.createElement("p");
        characterName.textContent = character.name;

        characterCard.appendChild(characterImage);
        characterCard.appendChild(characterName);
        searchResultsContainer.appendChild(characterCard);
      });
    } else {
      searchResultsContainer.innerHTML =
        '<p style="color: white;">Nenhum personagem encontrado com este nome.</p>';
    }
  } catch (error) {
    console.error("Ocorreu um erro ao buscar personagens:", error);
    searchResultsContainer.innerHTML =
      '<p style="color: red;">Erro ao carregar resultados da busca.</p>';
  }
}

async function openCharacterModal(characterId) {
  characterModal.style.display = "flex";

  modalCharacterName.textContent = "Carregando...";
  modalCharacterImage.src = "";
  modalCharacterImage.alt = "Carregando...";
  modalCharacterDescription.textContent = "Carregando descrição...";
  modalComicsList.innerHTML = "";

  const ts = new Date().getTime().toString();
  const hash = generateMarvelHash(ts, PRIVATE_KEY, PUBLIC_KEY);

  try {
    const paramsCharacter = new URLSearchParams({
      ts: ts,
      apikey: PUBLIC_KEY,
      hash: hash,
    });
    const urlCharacter = `${BASE_URL}/${characterId}?${paramsCharacter.toString()}`;
    const responseCharacter = await fetch(urlCharacter);
    const dataCharacter = await responseCharacter.json();

    if (!responseCharacter.ok || !dataCharacter.data.results.length) {
      throw new Error(`Personagem com ID ${characterId} não encontrado.`);
    }

    const character = dataCharacter.data.results[0];
    modalCharacterName.textContent = character.name;
    modalCharacterImage.src = `${character.thumbnail.path}.${character.thumbnail.extension}`;
    modalCharacterImage.alt = `Imagem de ${character.name}`;
    modalCharacterDescription.textContent =
      character.description || "Nenhuma descrição disponível.";

    const paramsComics = new URLSearchParams({
      ts: ts,
      apikey: PUBLIC_KEY,
      hash: hash,
      limit: 10,
      orderBy: "-onsaleDate",
    });
    const urlComics = `${BASE_URL}/${characterId}/comics?${paramsComics.toString()}`;
    const responseComics = await fetch(urlComics);
    const dataComics = await responseComics.json();

    if (dataComics.data.results && dataComics.data.results.length > 0) {
      dataComics.data.results.forEach((comic) => {
        const listItem = document.createElement("li");
        listItem.textContent = comic.title;
        modalComicsList.appendChild(listItem);
      });
    } else {
      modalComicsList.innerHTML = "<li>Nenhum quadrinho encontrado.</li>";
    }
  } catch (error) {
    console.error("Erro ao carregar detalhes do personagem:", error);
    modalCharacterName.textContent = "Erro ao carregar!";
    modalCharacterDescription.textContent =
      "Não foi possível carregar os detalhes do personagem.";
    modalComicsList.innerHTML = "<li>Erro ao carregar quadrinhos.</li>";
  }
}

function closeCharacterModal() {
  characterModal.style.display = "none";
}

document.addEventListener("DOMContentLoaded", fetchRandomMarvelCharacter);

nextCharacterButton.addEventListener("click", fetchRandomMarvelCharacter);

searchButton.addEventListener("click", () => {
  const searchTerm = characterSearchInput.value.trim();
  if (searchTerm) {
    searchMarvelCharacters(searchTerm);
  } else {
    searchResultsContainer.innerHTML =
      '<p style="color: white;">Por favor, digite um nome para buscar.</p>';
  }
});

characterSearchInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    searchButton.click();
  }
});

marvelCharacterImage.addEventListener("click", () => {
  if (currentMainCharacterId) {
    openCharacterModal(currentMainCharacterId);
  }
});

closeButton.addEventListener("click", closeCharacterModal);

window.addEventListener("click", (event) => {
  if (event.target === characterModal) {
    closeCharacterModal();
  }
});
