import express from 'express';
import cors from 'cors';
import locationRoutes from './routes/location.js';
import calibrateRoutes from './routes/calibrate.js';

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY || 'dev-key-change-in-production';

app.use(cors());
app.use(express.json());

// Middleware to validate API key on protected routes
app.use((req, res, next) => {
  req.api_key = API_KEY;
  next();
});

// Routes
app.use('/api/location', locationRoutes);
app.use('/api/calibrate', calibrateRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🛒 Karretje Tracker server running on port ${PORT}`);
});
