const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB подключение (пока заглушка)
console.log('MongoDB connection: not implemented yet');

// Маршруты API
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

app.get('/api/lessons', (req, res) => {
  const mockLessons = [
    {
      id: 1,
      title: 'Введение в курс',
      description: 'Основные понятия компьютерной графики',
      duration: '15:30',
      available: true,
      order: 1
    },
    {
      id: 2,
      title: 'Основы CG',
      description: 'Базовые принципы работы с графикой',
      duration: '22:15',
      available: true,
      order: 2
    }
  ];
  res.json(mockLessons);
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});