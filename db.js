const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Conexão com MongoDB estabelecida');
  } catch (error) {
    console.error('Erro de conexão com MongoDB:', error);
    process.exit(1);
  }
}

module.exports = connectDB;