import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://root:Pa55WWord@localhost:27017/ChatBot?authSource=admin';
  await mongoose.connect(uri);
  console.log('MongoDB connected:', uri);
};

export default connectDB;
