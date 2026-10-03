import express from 'express';
import { parseVoiceCommand, executeVoiceAction } from '../controllers/voiceController.js';

const router = express.Router();

router.post('/parse', parseVoiceCommand);
router.post('/command', parseVoiceCommand); // Alias for compatibility with prompt specs
router.post('/execute', executeVoiceAction);

export default router;
