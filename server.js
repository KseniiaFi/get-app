const express = require('express');
const path = require('path'); // Для работы с путями / Polkujen käsittelyyn
const sqlite3 = require('sqlite3').verbose(); // Для работы с SQLite / SQLite-tietokannan käsittelyyn
const bcrypt = require('bcrypt'); // Для хеширования паролей / Salasanojen hashaamiseen
const jwt = require('jsonwebtoken'); // Для создания токенов / Tokenien luomiseen
const app = express();

// Открытие базы данных SQLite / SQLite-tietokannan avaaminen
const db = new sqlite3.Database('./budget_app.db', (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message); // Ошибка подключения / Yhteysvirhe tietokantaan
    } else {
        console.log('Подключено к базе данных SQLite'); // Подключение успешно / Yhteys SQLite-tietokantaan onnistui
    }
});

// Создание таблицы пользователей, если она не существует / Käyttäjätaulun luominen, jos sitä ei ole
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    );
`);

// Создание таблицы транзакций, если она не существует / Tapahtumataulun luominen, jos sitä ei ole
db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL,
        category TEXT,
        date TEXT,
        user_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
`);

// Настройка Express для работы с JSON / Expressin konfigurointi JSONin käsittelyyn
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Статические файлы / Staattiset tiedostot

// Секрет для JWT / JWT-salaisuus
const JWT_SECRET = 'secret_key'; 

// Регистрация пользователя / Käyttäjän rekisteröinti
app.post('/register', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' }); // Если email или пароль пустые / Jos sähköposti tai salasana puuttuu
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Ошибка хеширования пароля:', err);
            return res.status(500).json({ error: 'Ошибка сервера' }); // Ошибка сервера / Palvelimen virhe
        }

        const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
        stmt.run(email, hashedPassword, function (err) {
            if (err) {
                console.error('Ошибка регистрации:', err.message);
                return res.status(500).json({ error: 'Ошибка регистрации' }); // Ошибка регистрации / Rekisteröintivirhe
            }
            res.status(201).json({ message: 'Пользователь зарегистрирован' }); // Успешная регистрация / Rekisteröinti onnistui
        });
    });
});

// Вход пользователя / Käyttäjän kirjautuminen
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' }); // Если email или пароль пустые / Jos sähköposti tai salasana puuttuu
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
            console.error('Ошибка поиска пользователя:', err.message);
            return res.status(500).json({ error: 'Ошибка сервера' }); // Ошибка сервера / Palvelimen virhe
        }

        if (!user) {
            return res.status(400).json({ error: 'Пользователь не найден' }); // Если пользователь не найден / Jos käyttäjää ei löydy
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Ошибка при сравнении пароля:', err);
                return res.status(500).json({ error: 'Ошибка сервера' }); // Ошибка сервера / Palvelimen virhe
            }

            if (!isMatch) {
                return res.status(400).json({ error: 'Неверный пароль' }); // Неверный пароль / Väärä salasana
            }

            // Создаем JWT токен / Luodaan JWT-tunnus
            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        });
    });
});

// Проверка авторизации / Todentaminen
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Получаем токен из заголовка / Saamme tunnuksen otsikosta

    if (!token) {
        return res.status(401).json({ error: 'Не авторизован' }); // Если токен не найден / Jos tunnusta ei löydy
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Неверный токен' }); // Неверный токен / Väärä tunnus
        }
        req.user = user; // Добавляем информацию о пользователе в запрос / Lisätään käyttäjän tiedot pyyntöön
        next(); // Переход к следующему обработчику / Siirrytään seuraavaan käsittelijään
    });
};

// Страница с бюджетом / Budjetti-sivu
app.get('/budget', authenticateJWT, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Возвращаем файл index.html / Palautetaan index.html-tiedosto
});

// Страница по умолчанию / Oletussivu
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Даем доступ к главной странице / Annetaan pääsyoikeus etusivulle
});

// Запуск сервера / Palvelimen käynnistäminen
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
