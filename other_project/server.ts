import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3010;

  app.use(express.json());

  // Load mock data
  const dataPath = path.join(__dirname, "src", "data.json");
  const getMockData = () => JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  // API Routes
  app.get("/api/portfolio", (req, res) => {
    const data = getMockData();
    res.json(data.portfolio);
  });

  app.get("/api/leaderboard", (req, res) => {
    const data = getMockData();
    res.json(data.leaderboard);
  });

  app.get("/api/stats", (req, res) => {
    const data = getMockData();
    res.json({
      topStats: data.topStats,
      portfolioStats: data.portfolioStats,
      returnEstimates: data.returnEstimates,
      cashBalance: "$24,500.00",
      portfolioValue: "$142,850.42"
    });
  });

  app.get("/api/audit-log", (req, res) => {
    // Simulated full audit log
    const logs = [
      { id: 1, type: 'SELL', ticker: 'SMCI', price: 892.50, profit: '+4.99%', date: '2024-02-26 14:30', status: 'COMPLETED' },
      { id: 2, type: 'BUY', ticker: 'ARM', price: 131.45, amount: '$12,400', date: '2024-02-26 11:15', status: 'COMPLETED' },
      { id: 3, type: 'SELL', ticker: 'NVDA', price: 854.50, profit: '+5.02%', date: '2024-02-25 16:45', status: 'COMPLETED' },
      { id: 4, type: 'REINVEST', ticker: 'AMD', amount: '$15,200', date: '2024-02-25 09:20', status: 'COMPLETED' },
      { id: 5, type: 'LOSS', ticker: 'TSLA', price: 171.95, profit: '-11.86%', date: '2024-02-24 13:10', status: 'COMPLETED' },
      { id: 6, type: 'SELL', ticker: 'GOOGL', price: 148.95, profit: '+4.82%', date: '2024-02-23 10:05', status: 'COMPLETED' },
      { id: 7, type: 'BUY', ticker: 'MSFT', price: 412.45, amount: '$8,500', date: '2024-02-23 09:30', status: 'COMPLETED' },
      { id: 8, type: 'SELL', ticker: 'AAPL', price: 192.45, profit: '+3.91%', date: '2024-02-22 15:20', status: 'COMPLETED' },
      { id: 9, type: 'BUY', ticker: 'META', price: 502.10, amount: '$10,000', date: '2024-02-21 11:40', status: 'COMPLETED' },
      { id: 10, type: 'SELL', ticker: 'AMD', price: 178.45, profit: '+4.85%', date: '2024-02-20 14:15', status: 'COMPLETED' },
    ];
    res.json(logs);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
