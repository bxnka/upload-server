// server.js
const cors = require('cors');
app.use(cors({
  origin: 'https://zonablitz.ru', // сюда подставь адрес сайта с хостинга
  methods: ['GET', 'POST'],


const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

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

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

app.use(express.static('public')); // отдаёт HTML и JS из public/
app.use(express.json());

// Получение формы (если зайдёшь на /)
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


// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
