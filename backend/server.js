// /var/www/academycg/backend/server.js
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
app.use(express.static('public'));

// MongoDB подключение
mongoose.connect('mongodb://localhost:27017/academycg', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Модели данных
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  telegramId: String,
  subscription: {
    active: { type: Boolean, default: false },
    plan: String,
    startDate: Date,
    endDate: Date,
  },
  createdAt: { type: Date, default: Date.now },
});

const PaymentSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  currency: String,
  status: String,
  paymentId: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
});

const LessonSchema = new mongoose.Schema({
  title: String,
  description: String,
  duration: String,
  videoUrl: String,
  available: { type: Boolean, default: true },
  order: Number,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);
const Payment = mongoose.model('Payment', PaymentSchema);
const Lesson = mongoose.model('Lesson', LessonSchema);

// Маршруты API

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

// Получение всех уроков
app.get('/api/lessons', async (req, res) => {
  try {
    const lessons = await Lesson.find().sort({ order: 1 });
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение данных пользователя
app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        telegramId: user.telegramId,
        subscription: user.subscription,
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Проверка существования пользователя
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const user = new User({
      name,
      email,
      password, // В реальном приложении нужно хэшировать пароль
    });
    
    await user.save();
    res.json({ 
      success: true, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email 
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Создание платежа (заглушка для тестирования)
app.post('/api/create-payment', async (req, res) => {
  try {
    const { amount, userId, plan } = req.body;
    
    // Создание тестового платежа
    const payment = new Payment({
      userId,
      amount,
      currency: 'RUB',
      status: 'pending',
      description: `Оплата подписки - ${plan}`,
    });
    
    await payment.save();
    
    res.json({ 
      success: true,
      paymentId: payment._id,
      redirectUrl: 'https://academycg.online/payment-success' 
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: 'Payment creation failed' });
  }
});

// Инициализация начальных данных
const initializeData = async () => {
  try {
    const lessonsCount = await Lesson.countDocuments();
    if (lessonsCount === 0) {
      const initialLessons = [
        {
          title: 'Введение в курс',
          description: 'Основные понятия компьютерной графики',
          duration: '15:30',
          videoUrl: 'https://example.com/video1.mp4',
          available: true,
          order: 1,
        },
        {
          title: 'Основы CG',
          description: 'Базовые принципы работы с графикой',
          duration: '22:15',
          videoUrl: 'https://example.com/video2.mp4',
          available: true,
          order: 2,
        },
        {
          title: 'Продвинутые техники',
          description: 'Сложные методы создания графики',
          duration: '30:45',
          videoUrl: 'https://example.com/video3.mp4',
          available: false,
          order: 3,
        },
        {
          title: 'Практические задания',
          description: 'Реальные проекты для практики',
          duration: '28:20',
          videoUrl: 'https://example.com/video4.mp4',
          available: false,
          order: 4,
        },
      ];

      await Lesson.insertMany(initialLessons);
      console.log('✅ Initial lessons created');
    }
    
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
};

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  initializeData();
});