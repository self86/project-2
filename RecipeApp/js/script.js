const apiKey = 'c65182a0d61049b2a93fc779ed80aae7'; 
const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const clearButton = document.getElementById('clearButton');
const suggestionsContainer = document.getElementById('suggestions');
const recipesContainer = document.getElementById('recipesContainer');
const recipeModal = document.getElementById('recipeModal');
const closeBtn = document.querySelector('.close-button');
const recipeDetails = document.getElementById('recipeDetails');
const favoritesButton = document.getElementById('favoritesButton');
const categoryButtons = document.querySelectorAll('.category-button');
const loadMoreButton = document.getElementById('loadMoreButton');
const logo = document.getElementById('logo');

let currentOffset = 0;
let currentQuery = '';
let currentCategory = '';
const recipesPerPage = 24;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let isFavoritesView = false;

window.onload = () => {
    loadRecipes();
};


logo.addEventListener('click', () => {
    isFavoritesView = false;
    currentOffset = 0;
    currentQuery = '';
    currentCategory = '';
    searchInput.value = '';
    recipesContainer.innerHTML = '';
    loadRecipes();
});

clearButton.addEventListener('click', () => {
    searchInput.value = '';
    suggestionsContainer.innerHTML = '';
});

searchButton.addEventListener('click', () => {
    isFavoritesView = false;
    const query = searchInput.value.trim();
    if (query) {
        currentQuery = query;
        currentCategory = '';
        currentOffset = 0;
        recipesContainer.innerHTML = '';
        loadRecipes();
    }
});

searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    if (query.length > 2) {
        getAutocompleteSuggestions(query);
    } else {
        suggestionsContainer.innerHTML = '';
    }
});

function getAutocompleteSuggestions(query) {
    fetch(`https://api.spoonacular.com/recipes/autocomplete?apiKey=${apiKey}&query=${encodeURIComponent(query)}&number=5`)
        .then(response => response.json())
        .then(data => showSuggestions(data))
        .catch(error => console.error('Error:', error));
}

function showSuggestions(suggestions) {
    suggestionsContainer.innerHTML = '';
    suggestions.forEach(suggestion => {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.textContent = suggestion.title;
        suggestionDiv.addEventListener('click', () => {
            searchInput.value = suggestion.title;
            suggestionsContainer.innerHTML = '';
            isFavoritesView = false;
            currentQuery = suggestion.title;
            currentCategory = '';
            currentOffset = 0;
            recipesContainer.innerHTML = '';
            loadRecipes();
        });
        suggestionsContainer.appendChild(suggestionDiv);
    });
}

categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        isFavoritesView = false;
        currentCategory = button.dataset.category;
        currentQuery = '';
        currentOffset = 0;
        recipesContainer.innerHTML = '';
        loadRecipes();
    });
});

function loadRecipes() {
    let url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${apiKey}&number=${recipesPerPage}&offset=${currentOffset}`;

    if (currentQuery) {
        url += `&query=${encodeURIComponent(currentQuery)}`;
    }

    if (currentCategory) {
        if (currentCategory === 'low-calorie') {
            url += '&maxCalories=500';
        } else if (currentCategory === 'meat') {
            url += '&includeIngredients=meat';
        } else if (currentCategory === 'vegan') {
            url += '&diet=vegan';
        }
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            displayRecipes(data.results);
            if (data.results.length < recipesPerPage) {
                loadMoreButton.style.display = 'none';
            } else {
                loadMoreButton.style.display = 'block';
            }
        })
        .catch(error => console.error('Error:', error));
}

loadMoreButton.addEventListener('click', () => {
    currentOffset += recipesPerPage;
    loadRecipes();
});

function displayRecipes(recipes) {
    if (recipes.length === 0 && currentOffset === 0) {
        recipesContainer.innerHTML = '<p>No recipes found.</p>';
        return;
    }
    recipes.forEach(recipe => {
        const recipeCard = document.createElement('div');
        recipeCard.classList.add('recipe-card');

        const isFavorited = favorites.some(fav => fav.id === recipe.id);

        recipeCard.innerHTML = `
            <img src="${recipe.image || 'https://via.placeholder.com/312x231'}" alt="${recipe.title}">
            <h3>${recipe.title}</h3>
            <button class="${isFavorited ? 'added-button' : 'favorite-button'}" onclick="toggleFavorite(event, ${recipe.id}, '${recipe.title}', '${recipe.image}')">
                ${isFavorited ? 'Added' : 'Add to Favorites'}
            </button>
        `;

        recipeCard.addEventListener('click', (e) => {
            if (!e.target.classList.contains('favorite-button') && !e.target.classList.contains('added-button')) {
                getRecipeDetails(recipe.id);
            }
        });

        recipesContainer.appendChild(recipeCard);
    });
}

function getRecipeDetails(id) {
    fetch(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${apiKey}&includeNutrition=true`)
        .then(response => response.json())
        .then(data => showRecipeModal(data))
        .catch(error => console.error('Error:', error));
}

function showRecipeModal(recipe) {
    const caloriesInfo = recipe.nutrition.nutrients.find(n => n.name === 'Calories');
    const calories = caloriesInfo ? caloriesInfo.amount : 'Unavailable';

    let instructions = '';
    if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
        instructions = recipe.analyzedInstructions[0].steps.map(step => `<p><strong>Step ${step.number}:</strong> ${step.step}</p>`).join('');
    } else if (recipe.instructions) {
        instructions = recipe.instructions.replace(/([A-Z])/g, '\n$1').split('\n').filter(s => s.trim()).map((step, index) => `<p><strong>Step ${index + 1}:</strong> ${step.trim()}</p>`).join('');
    } else {
        instructions = '<p>Instructions unavailable.</p>';
    }

    recipeDetails.innerHTML = `
        <h2>${recipe.title}</h2>
        <img src="${recipe.image}" alt="${recipe.title}">
        <h3>Ingredients:</h3>
        <ul>
            ${recipe.extendedIngredients.map(ingredient => `<li>${ingredient.original}</li>`).join('')}
        </ul>
        <h3>Instructions:</h3>
        ${instructions}
        <h3>Nutritional Information:</h3>
        <p>Calories: ${calories} kcal</p>
    `;
    recipeModal.style.display = 'block';
}

closeBtn.addEventListener('click', () => {
    recipeModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target == recipeModal) {
        recipeModal.style.display = 'none';
    }
});

function toggleFavorite(event, id, title, image) {
    event.stopPropagation();
    const button = event.target;
    const index = favorites.findIndex(fav => fav.id === id);
    if (index === -1) {
        favorites.push({ id, title, image });
        button.textContent = 'Added';
        button.classList.remove('favorite-button');
        button.classList.add('added-button');
    } else {
        favorites.splice(index, 1);
        button.textContent = 'Add to Favorites';
        button.classList.remove('added-button');
        button.classList.add('favorite-button');
        if (isFavoritesView) {
            const recipeCard = button.closest('.recipe-card');
            recipeCard.remove();
            if (favorites.length === 0) {
                recipesContainer.innerHTML = '<p>You have no favorite recipes.</p>';
            }
        }
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

favoritesButton.addEventListener('click', () => {
    isFavoritesView = true;
    displayFavorites();
});

function displayFavorites() {
    favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    recipesContainer.innerHTML = '';
    loadMoreButton.style.display = 'none';
    if (favorites.length === 0) {
        recipesContainer.innerHTML = '<p>You have no favorite recipes.</p>';
        return;
    }
    favorites.forEach(recipe => {
        const recipeCard = document.createElement('div');
        recipeCard.classList.add('recipe-card');

        recipeCard.innerHTML = `
            <img src="${recipe.image}" alt="${recipe.title}">
            <h3>${recipe.title}</h3>
            <button class="added-button" onclick="toggleFavorite(event, ${recipe.id}, '${recipe.title}', '${recipe.image}')">Added</button>
        `;

        recipeCard.addEventListener('click', (e) => {
            if (!e.target.classList.contains('added-button')) {
                getRecipeDetails(recipe.id);
            }
        });

        recipesContainer.appendChild(recipeCard);
    });
}

logo.addEventListener('click', () => {
    isFavoritesView = false;
    currentOffset = 0;
    currentQuery = '';
    currentCategory = '';
    searchInput.value = '';
    recipesContainer.innerHTML = '';
    loadRecipes();
});

categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        isFavoritesView = false;
        currentCategory = button.dataset.category;
        currentQuery = '';
        currentOffset = 0;
        recipesContainer.innerHTML = '';
        loadRecipes();
    });
});

searchButton.addEventListener('click', () => {
    isFavoritesView = false;
    const query = searchInput.value.trim();
    if (query) {
        currentQuery = query;
        currentCategory = '';
        currentOffset = 0;
        recipesContainer.innerHTML = '';
        loadRecipes();
    }
});
