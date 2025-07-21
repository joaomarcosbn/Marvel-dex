const BACKEND_URL = "http://localhost:3000/api"; // Altere para a URL do seu servidor em produção

const BASE_URL = "https://gateway.marvel.com/v1/public/characters"; // Ainda pode ser útil para referência, mas as chamadas serão via backend

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

// A função generateMarvelHash não é mais necessária no frontend, pois o backend fará isso.
// function generateMarvelHash(ts, privateKey, publicKey) {
//   const hashString = ts + privateKey + publicKey;
//   return CryptoJS.MD5(hashString).toString();
// }

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

  try {
    // Chama a nova rota no seu backend
    const response = await fetch(`${BACKEND_URL}/random-character`);
    if (!response.ok) {
      throw new Error(
        `Erro HTTP ao buscar personagem aleatório: ${response.status} ${response.statusText}`
      );
    }
    const character = await response.json();

    if (character) {
      const characterName = character.name;
      const thumbnailUrl = character.thumbnail.path;
      const thumbnailExtension = character.thumbnail.extension;
      const imageUrl = `${thumbnailUrl}.${thumbnailExtension}`;

      marvelCharacterImage.src = imageUrl;
      marvelCharacterImage.alt = `Imagem de ${characterName}`;
      marvelCharacterName.textContent = characterName;
      currentMainCharacterId = character.id;
    } else {
      console.warn("Nenhum personagem encontrado pelo backend.");
      marvelCharacterName.textContent = "Nenhum personagem encontrado.";
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

  try {
    // Chama a nova rota de busca no seu backend
    const response = await fetch(
      `${BACKEND_URL}/characters/search?searchTerm=${encodeURIComponent(
        searchTerm
      )}`
    );

    if (!response.ok) {
      throw new Error(
        `Erro HTTP ao buscar personagens: ${response.status} ${response.statusText}`
      );
    }

    const characters = await response.json();

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

  try {
    // Chama a nova rota para detalhes do personagem no seu backend
    const response = await fetch(`${BACKEND_URL}/character/${characterId}`);
    const data = await response.json();

    if (!response.ok || !data.character) {
      throw new Error(`Personagem com ID ${characterId} não encontrado.`);
    }

    const { character, comics } = data;

    modalCharacterName.textContent = character.name;
    modalCharacterImage.src = `${character.thumbnail.path}.${character.thumbnail.extension}`;
    modalCharacterImage.alt = `Imagem de ${character.name}`;
    modalCharacterDescription.textContent =
      character.description || "Nenhuma descrição disponível.";

    if (comics && comics.length > 0) {
      comics.forEach((comic) => {
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
