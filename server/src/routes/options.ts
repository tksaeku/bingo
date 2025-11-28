import express, { Request, Response } from 'express';
import Option from '../models/Option';

const router = express.Router();

// Get all options
router.get('/', async (req: Request, res: Response) => {
  try {
    const options = await Option.find().sort({ createdAt: -1 });
    res.json(options);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch options' });
  }
});

// Add new option
router.post('/', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Option text is required' });
    }

    const option = new Option({ text: text.trim() });
    await option.save();
    res.status(201).json(option);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Option already exists' });
    }
    res.status(500).json({ error: 'Failed to create option' });
  }
});

// Delete option
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const option = await Option.findByIdAndDelete(id);
    
    if (!option) {
      return res.status(404).json({ error: 'Option not found' });
    }
    
    res.json({ message: 'Option deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete option' });
  }
});

export default router;
