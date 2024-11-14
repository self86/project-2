const apiKey = '0bcf63a830c57ae76805a8762f9e0950';
let unit = 'metric';

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const suggestions = document.getElementById('suggestions');
const currentWeather = document.getElementById('current-weather');
const forecast = document.getElementById('forecast');
const celsiusBtn = document.getElementById('celsius');
const fahrenheitBtn = document.getElementById('fahrenheit');
const locationDisplay = document.getElementById('location-display');
const clearButton = document.getElementById('clearButton');

let currentCity = '';

clearButton.addEventListener('click', () => {
    cityInput.value = '';
    suggestions.innerHTML = '';
});

cityInput.addEventListener('input', function () {
    const query = cityInput.value;
    if (query.length > 2) {
        fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`)
            .then(response => response.json())
            .then(data => {
                suggestions.innerHTML = '';
                data.forEach(city => {
                    const div = document.createElement('div');
                    div.textContent = `${city.name}, ${city.country}`;
                    div.addEventListener('click', () => {
                        cityInput.value = div.textContent;
                        suggestions.innerHTML = '';
                    });
                    suggestions.appendChild(div);
                });
            })
            .catch(error => console.error('Error fetching city suggestions:', error));
    } else {
        suggestions.innerHTML = '';
    }
});

searchBtn.addEventListener('click', () => {
    const query = cityInput.value;
    if (query) {
        fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${apiKey}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const city = data[0];
                    currentCity = city.name;
                    getWeatherData(city.lat, city.lon, city.name);
                } else {
                    alert('City not found. Please enter a valid city name.');
                }
            })
            .catch(error => console.error('Error fetching city coordinates:', error));
    } else {
        alert('Please enter a city name.');
    }
});

function getWeatherData(lat, lon, cityName) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            displayCurrentWeather(data, cityName);
            getForecastData(lat, lon);
        })
        .catch(error => console.error('Error fetching current weather data:', error));
}

function displayCurrentWeather(data, cityName) {
    locationDisplay.textContent = cityName || data.name;
    const weatherIcon = data.weather[0].icon;
    const highTemp = Math.round(data.main.temp_max);
    const lowTemp = Math.round(data.main.temp_min);
    const tempUnit = unit === 'metric' ? '°C' : '°F';
    currentWeather.innerHTML = `
        <img src="https://openweathermap.org/img/wn/${weatherIcon}@2x.png" alt="${data.weather[0].description}">
        <p>${data.weather[0].description}</p>
        <p>Temperature: ${Math.round(data.main.temp)}${tempUnit}</p>
        <p>High: ${highTemp}${tempUnit}, Low: ${lowTemp}${tempUnit}</p>
        <p>Humidity: ${data.main.humidity}%</p>
        <p>Wind Speed: ${data.wind.speed} ${unit === 'metric' ? 'm/s' : 'mph'}</p>
    `;
}

function getForecastData(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            displayForecast(data);
        })
        .catch(error => console.error('Error fetching forecast data:', error));
}

function displayForecast(data) {
    forecast.innerHTML = '';
    const forecastList = data.list.filter(item => item.dt_txt.includes('12:00:00'));
    forecastList.forEach(day => {
        const date = new Date(day.dt_txt);
        const weatherIcon = day.weather[0].icon;
        const tempUnit = unit === 'metric' ? '°C' : '°F';
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');
        dayDiv.innerHTML = `
            <h3>${date.toLocaleDateString()}</h3>
            <img src="https://openweathermap.org/img/wn/${weatherIcon}@2x.png" alt="${day.weather[0].description}">
            <p>${day.weather[0].description}</p>
            <p>Temp: ${Math.round(day.main.temp)}${tempUnit}</p>
            <p>High: ${Math.round(day.main.temp_max)}${tempUnit}</p>
            <p>Low: ${Math.round(day.main.temp_min)}${tempUnit}</p>
        `;
        forecast.appendChild(dayDiv);
    });
}

celsiusBtn.addEventListener('click', () => {
    if (unit !== 'metric') {
        unit = 'metric';
        celsiusBtn.disabled = true;
        fahrenheitBtn.disabled = false;
        updateWeather();
    }
});

fahrenheitBtn.addEventListener('click', () => {
    if (unit !== 'imperial') {
        unit = 'imperial';
        celsiusBtn.disabled = false;
        fahrenheitBtn.disabled = true;
        updateWeather();
    }
});

function updateWeather() {
    if (currentCity) {
        fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(currentCity)}&limit=1&appid=${apiKey}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    getWeatherData(data[0].lat, data[0].lon, data[0].name);
                } else {
                    alert('City not found. Please enter a valid city name.');
                }
            })
            .catch(error => console.error('Error updating weather data:', error));
    } else {
        getLocationWeather();
    }
}

function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&limit=1&appid=${apiKey}`)
                .then(response => response.json())
                .then(data => {
                    currentCity = data[0].name;
                    getWeatherData(position.coords.latitude, position.coords.longitude, currentCity);
                })
                .catch(error => console.error('Error fetching location name:', error));
        }, error => {
            alert('Error getting your location. Please allow location access or enter a city manually.');
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

window.onload = function () {
    getLocationWeather();
};
