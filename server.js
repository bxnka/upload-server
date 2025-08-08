const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

const KEYFILEPATH = path.join(__dirname, 'credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// ID папки на Google Диске (в которую грузить файлы)
const FOLDER_ID = 'ТВОЙ_GOOGLE_DRIVE_FOLDER_ID';

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const driveService = google.drive({ version: 'v3', auth });

// Настройка multer - временная папка для загрузки локально
const upload = multer({ dest: 'temp_uploads/' });

app.use(express.json());

// Загрузка файла на Google Диск
async function uploadFileToDrive(filePath, fileName) {
  const fileMetadata = {
    name: fileName,
    parents: [FOLDER_ID],
  };
  const media = {
    body: fs.createReadStream(filePath),
  };

  const response = await driveService.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id',
  });
  return response.data.id;
}

// Маршрут загрузки файла
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { team, nickname, division } = req.body;

    if (!file) {
      return res.status(400).send('Файл не загружен');
    }

    console.log('Получен файл:', file.originalname);
    console.log('Данные:', { team, nickname, division });

    // Загружаем файл на Google Диск
    const fileId = await uploadFileToDrive(file.path, file.originalname);

    // Удаляем локальный временный файл
    fs.unlinkSync(file.path);

    console.log('Файл загружен на Google Диск с ID:', fileId);

    res.status(200).send('Файл успешно загружен на Google Диск');
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    res.status(500).send('Ошибка при загрузке файла');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
