import mongoose from 'mongoose';

export async function connectMongo() {
  const url = process.env.MONGO_URL || 'mongodb://localhost:27017/translation';
  await mongoose.connect(url);
  console.log('MongoDB connected');
}
