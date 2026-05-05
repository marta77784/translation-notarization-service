import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }, // хранится в виде bcrypt хэша
  name: { type: String, required: true },
  role: { type: String, enum: ['user', 'notary'], default: 'user' },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
