"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
require("./services/firestore");
const Option_1 = __importDefault(require("./models/Option"));
dotenv_1.default.config();
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
        console.log('Initializing Firestore (using credentials from env)...');
        // Clear existing options
        await Option_1.default.deleteMany();
        console.log('Cleared existing options');
        // Insert sample options
        await Option_1.default.insertMany(sampleOptions.map(text => ({ text })));
        console.log(`Inserted ${sampleOptions.length} sample options`);
        console.log('Seed completed successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}
seed();
