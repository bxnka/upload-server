const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Укажи сюда домен, с которого будет идти запрос (твой сайт)
const allowedOrigin = 'https://zonablitz.ru/biba'; // <-- замени на свой домен!

// Включаем CORS для фронтенда
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST'],
}));

// Гарантируем, что папка для загрузок существует
const uploadDir = path.join(__dirname, 'pending_uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка multer: сохраняем оригинальное имя + дата
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeOriginalName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${timestamp}_${safeOriginalName}`);
  }
});

app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send('Файл не найден');
    }
    res.download(filePath);

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

app.use(express.static('public'));
app.use(express.json());

// Страница формы
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'biba.html'));
});

// Обработка загрузки файла
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const { team, nickname, division } = req.body;

  if (!file) {
    return res.status(400).send('Файл не загружен');
  }

  console.log('--- Новый файл на модерацию ---');
  console.log('Оригинальное имя:', file.originalname);
  console.log('Сохранено как:', file.filename);
  console.log('Команда:', team);
  console.log('Ник:', nickname);
  console.log('Дивизион:', division);
  console.log('-------------------------------');

  res.status(200).send('Файл принят на модерацию');
});

// Вывод списка загруженных файлов (для отладки)
app.get('/files', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).send('Ошибка чтения папки');
    }
    res.json(files);
  });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
