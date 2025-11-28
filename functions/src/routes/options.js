"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Option_1 = __importDefault(require("../models/Option"));
const router = express_1.default.Router();
// Get all options
router.get('/', async (req, res) => {
    try {
        const options = await Option_1.default.find().sort({ createdAt: -1 });
        res.json(options);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch options' });
    }
});
// Add new option
router.post('/', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim() === '') {
            return res.status(400).json({ error: 'Option text is required' });
        }
        const trimmed = text.trim();
        const existing = await Option_1.default.findOne({ text: trimmed });
        if (existing) {
            return res.status(400).json({ error: 'Option already exists' });
        }
        const option = new Option_1.default({ text: trimmed });
        await option.save();
        res.status(201).json(option);
    }
    catch (error) {
        console.error('Create option error:', error);
        res.status(500).json({ error: 'Failed to create option' });
    }
});
// Delete option
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const option = await Option_1.default.findByIdAndDelete(id);
        if (!option) {
            return res.status(404).json({ error: 'Option not found' });
        }
        res.json({ message: 'Option deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete option' });
    }
});
exports.default = router;
