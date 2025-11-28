"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("./services/firestore");
const dotenv_1 = __importDefault(require("dotenv"));
const options_1 = __importDefault(require("./routes/options"));
const leaderboard_1 = __importDefault(require("./routes/leaderboard"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5174;
// Middleware
app.options('*', (0, cors_1.default)()); // Enable pre-flight requests for all routes
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/options', options_1.default);
app.use('/api/leaderboard', leaderboard_1.default);
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Firestore initialized in services; start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
