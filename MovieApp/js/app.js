const apiKey = 'ccc8e2b829b5be8ba5f196c2360ae171';
const apiUrl = 'https://api.themoviedb.org/3';

let currentPage = 1;
let currentQuery = '';
let currentCategory = 'popular';
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

const moviesGrid = document.getElementById('movies-grid');
const loadMoreButton = document.getElementById('load-more-button');
const modal = document.getElementById('movie-modal');
const modalBody = document.getElementById('modal-body');
const closeButton = document.querySelector('.close-button');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const clearButton = document.getElementById('clear-button');
const suggestions = document.getElementById('suggestions');
const categoryButtons = document.querySelectorAll('.category-button');
const watchlistButton = document.getElementById('watchlist-button');

async function fetchMovies(query = '', page = 1, category = 'popular') {
    let url = '';
    if (query) {
        url = `${apiUrl}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}`;
    } else {
        url = `${apiUrl}/movie/${category}?api_key=${apiKey}&page=${page}`;
    }
    const response = await fetch(url);
    const data = await response.json();
    return data.results;
}

async function fetchMovieDetails(movieId) {
    const response = await fetch(`${apiUrl}/movie/${movieId}?api_key=${apiKey}&append_to_response=videos,credits`);
    const data = await response.json();
    return data;
}

function displayMovies(movies, isWatchlist = false) {
    movies.forEach((movie) => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        movieCard.dataset.id = movie.id;

        const posterPath = movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : 'placeholder.jpg';
        const img = document.createElement('img');
        img.src = posterPath;
        movieCard.appendChild(img);

        const title = document.createElement('h3');
        title.textContent = movie.title;
        movieCard.appendChild(title);

        if (isWatchlist) {
            const removeButton = document.createElement('button');
            removeButton.classList.add('remove-button');
            removeButton.textContent = 'Remove from list';
            removeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFromWatchlist(movie.id);
                movieCard.remove();
            });
            movieCard.appendChild(removeButton);
        }

        moviesGrid.appendChild(movieCard);
    });
}

function clearMovies() {
    moviesGrid.innerHTML = '';
}

function showModal(movie) {
    modalBody.innerHTML = '';

    const video = movie.videos.results.find(
        (vid) => vid.site === 'YouTube' && vid.type === 'Trailer'
    );

    if (video) {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${video.key}`;
        iframe.allowFullscreen = true;
        modalBody.appendChild(iframe);
    }

    const title = document.createElement('h2');
    title.textContent = movie.title;
    modalBody.appendChild(title);

    const overview = document.createElement('p');
    overview.textContent = movie.overview;
    modalBody.appendChild(overview);

    const rating = document.createElement('p');
    rating.textContent = `Rating: ${movie.vote_average}`;
    modalBody.appendChild(rating);

    const runtime = document.createElement('p');
    runtime.textContent = `Duration: ${movie.runtime} минут`;
    modalBody.appendChild(runtime);

    const genres = document.createElement('p');
    genres.textContent = `Genres: ${movie.genres.map((g) => g.name).join(', ')}`;
    modalBody.appendChild(genres);

    const actors = document.createElement('p');
    actors.textContent = `Actors: ${movie.credits.cast
        .slice(0, 5)
        .map((actor) => actor.name)
        .join(', ')}`;
    modalBody.appendChild(actors);

    const addToWatchlistButton = document.createElement('button');
    addToWatchlistButton.id = 'add-to-watchlist';

    if (watchlist.some((item) => item.id === movie.id)) {
        addToWatchlistButton.textContent = 'Added';
    } else {
        addToWatchlistButton.textContent = 'Add to watch list';
    }

    addToWatchlistButton.addEventListener('click', () => {
        if (watchlist.some((item) => item.id === movie.id)) {
            removeFromWatchlist(movie.id);
            addToWatchlistButton.textContent = 'Add to watch list';
        } else {
            addToWatchlist(movie);
            addToWatchlistButton.textContent = 'Added';
        }
    });

    modalBody.appendChild(addToWatchlistButton);

    modal.style.display = 'block';
}

searchButton.addEventListener('click', () => {
    currentQuery = searchInput.value;
    currentPage = 1;
    clearMovies();
    fetchAndDisplayMovies();
});

searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        currentQuery = searchInput.value;
        currentPage = 1;
        clearMovies();
        fetchAndDisplayMovies();
        suggestions.innerHTML = '';
    } else {
        showSuggestions(searchInput.value);
    }
});

clearButton.addEventListener('click', () => {
    searchInput.value = '';
    suggestions.innerHTML = '';
});

async function showSuggestions(query) {
    if (query.length < 2) {
        suggestions.innerHTML = '';
        return;
    }
    const movies = await fetchMovies(query);
    suggestions.innerHTML = '';
    movies.slice(0, 5).forEach((movie) => {
        const suggestion = document.createElement('div');
        suggestion.textContent = movie.title;
        suggestion.addEventListener('click', async () => {
            const movieDetails = await fetchMovieDetails(movie.id);
            showModal(movieDetails);
            suggestions.innerHTML = '';
            searchInput.value = '';
        });
        suggestions.appendChild(suggestion);
    });
}

moviesGrid.addEventListener('click', async (e) => {
    const movieCard = e.target.closest('.movie-card');
    if (movieCard) {
        const movieId = movieCard.dataset.id;
        const movieDetails = await fetchMovieDetails(movieId);
        showModal(movieDetails);
    }
});

closeButton.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

loadMoreButton.addEventListener('click', () => {
    currentPage++;
    fetchAndDisplayMovies();
});

function addToWatchlist(movie) {
    if (!watchlist.some((item) => item.id === movie.id)) {
        watchlist.push(movie);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        showNotification('The film has been added to the watch list!');
    } else {
        showNotification('The film is already on the watch list.');
    }
}

function removeFromWatchlist(movieId) {
    watchlist = watchlist.filter((movie) => movie.id !== movieId);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    showNotification('The film has been removed from the watch list.');
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
        currentCategory = button.dataset.category;
        currentQuery = '';
        currentPage = 1;
        clearMovies();
        fetchAndDisplayMovies();
    });
});

watchlistButton.addEventListener('click', () => {
    currentPage = 1;
    clearMovies();
    displayMovies(watchlist, true);
    loadMoreButton.style.display = 'none';
});

async function fetchAndDisplayMovies() {
    const movies = await fetchMovies(currentQuery, currentPage, currentCategory);
    displayMovies(movies);
    loadMoreButton.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayMovies();
});
