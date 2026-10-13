import mongoose from 'mongoose';
import dns from 'dns';

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/school_management';
  
  // Set DNS servers for mongodb+srv queries to avoid Windows querySrv ECONNREFUSED errors
  if (mongoUri.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    } catch (dnsErr) {
      console.warn('[MongoDB] Custom DNS set warning:', dnsErr.message);
    }
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
  } catch (error) {
    console.warn(`[MongoDB] Warning: Could not connect to MongoDB at ${mongoUri}`);
    console.warn(`[MongoDB] Reason: ${error.message}`);
    console.warn('[MongoDB] Backend will continue running in offline/readiness mode.');
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Connection lost. Attempting to reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[MongoDB] Connection re-established.');
  });
};

export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};
