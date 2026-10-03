import mongoose from 'mongoose';

let isMongoConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_grocery';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quick check
    });
    isMongoConnected = true;
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[MongoDB] Local/remote MongoDB server not reachable (${err.message}).`);
    console.log(`[SmartStore] Activating auto-persistent Local Store mode so the system works flawlessly!`);
  }
};

export const getMongoStatus = () => isMongoConnected;
