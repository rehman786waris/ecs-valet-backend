const mongoose = require('mongoose');
require('dotenv').config();

const connectToMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected via Mongoose');
  } catch (err) {
    console.error('Mongoose connection failed:', err);
    throw err;
  }
};

module.exports = { connectToMongo };