import mongoose, { Document, Schema } from 'mongoose';

export interface IOption extends Document {
  text: string;
  createdAt: Date;
}

const optionSchema = new Schema<IOption>({
  text: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IOption>('Option', optionSchema);
