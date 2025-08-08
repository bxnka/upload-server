const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const open = require('open');

const app = express();
const PORT = process.env.PORT || 3000;

// Загружаем OAuth данные из env переменных
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || `https://zonablitz.ru/biba`;

// Хранение токенов (для простоты — в памяти, в продакшене — БД или файл)
let oauth2Client;
let oauthTokens;

app.use(express.json());
const upload = multer({ dest: 'temp_uploads/' });

// Создаем OAuth2 клиент
function createOAuthClient() {
  oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );
}

// Генерируем URL для авторизации пользователя
function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file'],
    prompt: 'consent',
  });
}

// Роут для старта авторизации (можно вручную открыть браузер и перейти сюда)
app.get('/auth', (req, res) => {
  const url = getAuthUrl();
  res.send(`<h1>Авторизация Google Drive</h1><a href="${url}">Нажмите чтобы авторизоваться</a>`);
});

// Callback после авторизации
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Код авторизации не найден');

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauthTokens = tokens;
    oauth2Client.setCredentials(tokens);

    res.send('Авторизация успешна! Можно загружать файлы.');
  } catch (err) {
    console.error('Ошибка при получении токена:', err);
    res.status(500).send('Ошибка при авторизации');
  }
});

// Загрузка файла на Google Диск
async function uploadFileToDrive(filePath, fileName) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const fileMetadata = {
    name: fileName,
  };
  const media = {
    body: fs.createReadStream(filePath),
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id',
  });
  return response.data.id;
}

// Маршрут для загрузки файла
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!oauthTokens) {
    return res.status(401).send('Сначала авторизуйтесь: перейдите на /auth');
  }

  try {
    oauth2Client.setCredentials(oauthTokens);

    const file = req.file;
    const { team, nickname, division } = req.body;

    if (!file) {
      return res.status(400).send('Файл не загружен');
    }

    console.log('Получен файл:', file.originalname);
    console.log('Данные:', { team, nickname, division });

    const fileId = await uploadFileToDrive(file.path, file.originalname);

    fs.unlinkSync(file.path);

    console.log('Файл загружен на Google Диск с ID:', fileId);

    res.status(200).send('Файл успешно загружен на Google Диск');
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    res.status(500).send('Ошибка при загрузке файла');
  }
});

app.listen(PORT, () => {
  createOAuthClient();
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Перейдите в браузере http://localhost:${PORT}/auth для авторизации`);
});
