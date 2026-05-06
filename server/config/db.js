const mongoose = require('mongoose');

let mongoServer = null;

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || '';
    const isPlaceholder = uri.includes('your_username') || uri.includes('your_password') || !uri;

    // In production, require a real MongoDB URI or use in-memory as fallback
    if (isPlaceholder && process.env.NODE_ENV === 'production') {
      console.log('⚠️  No MongoDB URI configured. Starting in-memory database for demo...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const memUri = mongoServer.getUri();
      await mongoose.connect(memUri);
      console.log(`MongoDB In-Memory Server started: ${memUri}`);
      console.log('ℹ️  Note: Data will be lost on restart. Set MONGO_URI for persistent storage.');
      return;
    }

    if (isPlaceholder) {
      console.log('⚠️  Placeholder MongoDB URI detected. Starting in-memory database...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const memUri = mongoServer.getUri();
      await mongoose.connect(memUri);
      console.log(`MongoDB In-Memory Server started: ${memUri}`);
      console.log('ℹ️  Data will be lost when the server restarts.');
      return;
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Fallback to in-memory server
    try {
      console.log('⚠️  Falling back to in-memory database...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const memUri = mongoServer.getUri();
      await mongoose.connect(memUri);
      console.log(`MongoDB In-Memory Server started: ${memUri}`);
      console.log('ℹ️  Data will be lost when the server restarts.');
    } catch (fallbackError) {
      console.error(`In-memory MongoDB failed: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
