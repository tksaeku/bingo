import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Option from './models/Option';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo';

const sampleOptions = [
  'Dead faced lead',
  'Robert says "yeah yeah yeah"',
  'Follow winks to the audience',
  'Someone is on mute',
  'Animal print',
  'Two song routine',
  'Unhappy walk off',
  'Velvet costume',
  'Costume with a dress',
  'Hair dye on theme',
  'Starting pose on stage',
  'Same gender couple',
  'Red costumes',
  'Robert Says "OUR NEXT COUPLE"',
  'Robert needs pronunciation',
  'Both lip synching',
  'Tech difficulties',
  'Couple kisses before the routine starts',
  'Slow blues song',
  'Robert reminisces',
  'Costume piece lost',
  'Movie theme song',
  'Gold costume',
  'Perfectly matched shoes (not black)',
  'Sparkles in hair',
  'Guyliner'
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing options
    await Option.deleteMany({});
    console.log('Cleared existing options');

    // Insert sample options
    await Option.insertMany(sampleOptions.map(text => ({ text })));
    console.log(`Inserted ${sampleOptions.length} sample options`);

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
