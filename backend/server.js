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

// Простой маршрут для тестирования
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!', timestamp: new Date() });
});

// Маршрут для получения уроков (заглушка)
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

// Инициализация ЮKassa
const YooKassa = require('yookassa');
const yookassa = new YooKassa({
  shopId: process.env.YOOKASSA_SHOP_ID,
  secretKey: process.env.YOOKASSA_SECRET_KEY,
});

// Создание тестового платежа через ЮKassa
app.post('/api/create-payment', async (req, res) => {
  try {
    const { amount, userId, plan, returnUrl } = req.body;

    // Для тестовой среды можно использовать тестовые карты
    const payment = await yookassa.createPayment({
      amount: {
        value: amount.toString(),
        currency: 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: returnUrl || 'https://academycg.online/payment-success',
      },
      description: `Тестовая оплата подписки AcademyCG - ${plan}`,
      meta: {
        userId: userId,
        plan: plan
      }
    });

    // Сохранение платежа в базе
    const newPayment = new Payment({
      userId,
      amount,
      currency: 'RUB',
      status: 'pending',
      paymentId: payment.id,
      description: `Тестовая оплата подписки - ${plan}`,
    });
    
    await newPayment.save();

    res.json({ 
      success: true,
      paymentId: payment.id,
      redirectUrl: payment.confirmation.confirmation_url,
      test: true // Флаг для фронтенда, что это тестовый платеж
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ 
      error: 'Payment creation failed', 
      message: error.message,
      test: true
    });
  }
});

// Webhook для обработки уведомлений от ЮKassa (тестовая среда)
app.post('/api/webhook/yookassa', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    // Для тестовой среды обрабатываем уведомления
    let event;
    if (typeof req.body === 'string') {
      event = JSON.parse(req.body);
    } else {
      event = req.body;
    }
    
    console.log('Webhook received:', event);
    
    if (event.event === 'payment.succeeded') {
      const paymentId = event.object.id;
      
      // Обновление статуса платежа
      await Payment.updateOne(
        { paymentId: paymentId },
        { status: 'succeeded' }
      );
      
      // Активация подписки пользователя
      const paymentRecord = await Payment.findOne({ paymentId: paymentId });
      if (paymentRecord) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // 30 дней подписки
        
        await User.updateOne(
          { _id: paymentRecord.userId },
          { 
            'subscription.active': true,
            'subscription.plan': 'Месячная',
            'subscription.startDate': new Date(),
            'subscription.endDate': endDate,
          }
        );
        
        // Отправка уведомления в Telegram (если привязан)
        const user = await User.findById(paymentRecord.userId);
        if (user && user.telegramId) {
          try {
            await sendTelegramNotification(user.telegramId, `✅ Тестовая оплата прошла успешно!\nВаша подписка активирована до ${endDate.toLocaleDateString('ru-RU')}`);
          } catch (error) {
            console.error('Telegram notification error:', error);
          }
        }
      }
    }
    
    res.status(200).send();
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send();
  }
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`Health check: http://0.0.0.0:${PORT}/api/health`);
});
