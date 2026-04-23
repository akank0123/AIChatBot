import mongoose from 'mongoose';

const turnSchema = new mongoose.Schema(
  { human: { type: String, required: true }, ai: { type: String, required: true } },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    provider:  { type: String, default: 'gemini' },
    model:     { type: String },
    history:   { type: [turnSchema], default: [] },
  },
  { timestamps: true }
);

const Session = mongoose.model('Session', sessionSchema);
export default Session;
