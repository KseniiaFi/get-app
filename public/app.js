// Получаем элементы из HTML / Saamme elementit HTML:stä
const registerForm = document.getElementById('register'); // Форма регистрации / Rekisteröintilomake
const loginForm = document.getElementById('login'); // Форма входа / Kirjautumislomake
const budgetSection = document.getElementById('budgeting-section'); // Раздел бюджета / Budjetin osio
const registerEmail = document.getElementById('register-email'); // Поле email для регистрации / Sähköpostikenttä rekisteröintiin
const registerPassword = document.getElementById('register-password'); // Поле пароля для регистрации / Salasanakenttä rekisteröintiin
const loginEmail = document.getElementById('login-email'); // Поле email для входа / Sähköpostikenttä kirjautumiseen
const loginPassword = document.getElementById('login-password'); // Поле пароля для входа / Salasanakenttä kirjautumiseen

// Функция регистрации пользователя / Käyttäjän rekisteröintifunktio
registerForm.addEventListener('submit', async function (event) {
    event.preventDefault(); // Предотвращаем перезагрузку страницы / Estämme sivun uudelleenlatauksen

    const email = registerEmail.value;
    const password = registerPassword.value;

    const response = await fetch('http://localhost:4000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    if (response.ok) {
        alert('Rekisteröinti onnistui!');
    } else {
        alert('Virhe: ' + result.error);
    }
});

// Функция входа пользователя / Käyttäjän kirjautumistoiminto
loginForm.addEventListener('submit', async function (event) {
    event.preventDefault(); // Предотвращаем перезагрузку страницы / Estämme sivun uudelleenlatauksen

    const email = loginEmail.value;
    const password = loginPassword.value;

    const response = await fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    if (response.ok) {
        localStorage.setItem('token', result.token);
        alert('Kirjautuminen onnistui!');
        window.location.href = '/budget'; // Перенаправляем на страницу бюджета / Siirrytään budjettiin
    } else {
        alert('Virhe: ' + result.error);
    }
});

// Проверка авторизации / Todentaminen
function checkAuthorization() {
    const token = localStorage.getItem('token'); // Получаем токен / Saamme tunnuksen
    if (token) {
        budgetSection.style.display = 'block'; // Показываем бюджет / Näytämme budjetin
        loginForm.style.display = 'none'; // Прячем форму входа / Piilotamme kirjautumislomakkeen
        registerForm.style.display = 'none'; // Прячем форму регистрации / Piilotamme rekisteröintilomakkeen
    } else {
        loginForm.style.display = 'block'; // Показываем форму входа / Näytämme kirjautumislomakkeen
        registerForm.style.display = 'block'; // Показываем форму регистрации / Näytämme rekisteröintilomakkeen
    }
}

checkAuthorization(); // Проверяем авторизацию / Tarkistamme todentamisen
