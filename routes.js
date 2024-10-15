import express from "express";
import { INR_BALANCES, ORDERBOOK, STOCK_BALANCES } from "./models/models.js";
import { initializeOrderBook } from "./helperFunc.js";
export const routers = express.Router();

routers.post("/user/create/:userId", (req, res) => {
  const { userId } = req.params;
  if (INR_BALANCES[userId])
    return res.status(400).json({ message: "User already exists." });

  INR_BALANCES[userId] = { balance: 0, locked: 0 };
  STOCK_BALANCES[userId] = {};
  res.status(201).json({ message: `User ${userId} created.` });
});

routers.post("/symbol/create/:stockSymbol", (req, res) => {
  const { stockSymbol } = req.params;
  if (ORDERBOOK[stockSymbol])
    return res.status(400).json({ message: "Symbol already exists." });

  initializeOrderBook(stockSymbol);
  res.status(201).json({ message: `Symbol ${stockSymbol} created.` });
});
routers.get("/orderbook", (req, res) => {
  res.json(ORDERBOOK);
});

routers.get("/balances/inr", (req, res) => {
  res.json(INR_BALANCES);
});

routers.get("/balances/stock", (req, res) => {
  res.json(STOCK_BALANCES);
});

routers.get("/balance/inr/:userId", (req, res) => {
  const { userId } = req.params;
  const balance = INR_BALANCES[userId];
  if (!balance) return res.status(404).json({ message: "User chaina lah." });

  res.json(balance);
});

routers.post("/onramp/inr", (req, res) => {
  const { userId, amount } = req.body;
  if (!INR_BALANCES[userId])
    return res.status(404).json({ message: "User chaina lah." });

  INR_BALANCES[userId].balance += amount / 100;
  res.status(200).json({ message: `${amount / 100} INR added to ${userId}` });
});

routers.get("/balance/stock/:userId", (req, res) => {
  const { userId } = req.params;
  const stockBalance = STOCK_BALANCES[userId];
  if (!stockBalance)
    return res.status(404).json({ message: "User not found." });

  res.json(stockBalance);
});

routers.get("/orderbook/:stockSymbol", (req, res) => {
  const { stockSymbol } = req.params;
  const orderbook = ORDERBOOK[stockSymbol];
  if (!orderbook) return res.status(404).json({ message: "symbol not found." });

  res.json(orderbook);
});

routers.post("/order/buy", (req, res) => {
  const { userId, stockSymbol, quantity, price, stocktype } = req.body;

  if (!INR_BALANCES[userId])
    return res.status(404).json({ message: "User not found." });

  const totalCost = quantity * price;
  if (INR_BALANCES[userId].balance < totalCost) {
    return res.status(400).json({ message: "Insufficient INR balance." });
  }

  INR_BALANCES[userId].balance -= totalCost;
  INR_BALANCES[userId].locked += totalCost;

  if (!ORDERBOOK[stockSymbol]) initializeOrderBook(stockSymbol);

  if (!ORDERBOOK[stockSymbol].yes[price]) {
    ORDERBOOK[stockSymbol].yes[price] = { total: 0, orders: {} };
  }

  ORDERBOOK[stockSymbol].yes[price].total += quantity;
  ORDERBOOK[stockSymbol].yes[price].orders[userId] =
    (ORDERBOOK[stockSymbol].yes[price].orders[userId] || 0) + quantity;

  res.status(200).json({ message: "Buy order placed." });
});

routers.post("/order/sell", (req, res) => {
  const { userId, stockSymbol, quantity, price, stocktype } = req.body;
  if (stocktype === "yes") {
    if (
      !STOCK_BALANCES[userId] ||
      !STOCK_BALANCES[userId][stockSymbol] ||
      STOCK_BALANCES[userId][stockSymbol].yes.quantity < quantity
    ) {
      return res.status(400).json({ message: "Insufficient stock quantity." });
    }

    STOCK_BALANCES[userId][stockSymbol].yes.quantity -= quantity;
    STOCK_BALANCES[userId][stockSymbol].yes.locked += quantity;

    if (!ORDERBOOK[stockSymbol]) initializeOrderBook(stockSymbol);

    if (!ORDERBOOK[stockSymbol].yes[price]) {
      ORDERBOOK[stockSymbol].yes[price] = { total: 0, orders: {} };
    }

    ORDERBOOK[stockSymbol].yes[price].total += quantity;
    ORDERBOOK[stockSymbol].yes[price].orders[userId] =
      (ORDERBOOK[stockSymbol].yes[price].orders[userId] || 0) + quantity;
  } else {
    if (
      !STOCK_BALANCES[userId] ||
      !STOCK_BALANCES[userId][stockSymbol] ||
      STOCK_BALANCES[userId][stockSymbol].no.quantity < quantity
    ) {
      return res.status(400).json({ message: "Insufficient stock quantity." });
    }

    STOCK_BALANCES[userId][stockSymbol].no.quantity -= quantity;
    STOCK_BALANCES[userId][stockSymbol].no.locked += quantity;

    if (!ORDERBOOK[stockSymbol]) initializeOrderBook(stockSymbol);

    if (!ORDERBOOK[stockSymbol].no[price]) {
      ORDERBOOK[stockSymbol].no[price] = { total: 0, orders: {} };
    }

    ORDERBOOK[stockSymbol].no[price].total += quantity;
    ORDERBOOK[stockSymbol].no[price].orders[userId] =
      (ORDERBOOK[stockSymbol].no[price].orders[userId] || 0) + quantity;
  }

  res.status(200).json({ message: "Sell order placed." });
});

routers.get("/reset", (req, res) => {
  Object.assign((INR_BALANCES = {}));
  Object.assign((STOCK_BALANCES = {}));
  Object.assign((ORDERBOOK = {}));
});

routers.post("/trade/mint", (req, res) => {
  const { userId, stockSymbol, quantity } = req.body;
  if (!STOCK_BALANCES[userId]) STOCK_BALANCES[userId] = {};

  if (!STOCK_BALANCES[userId][stockSymbol]) {
    STOCK_BALANCES[userId][stockSymbol] = {
      yes: { quantity: 0, locked: 0 },
      no: { quantity: 0, locked: 0 },
    };
  }

  STOCK_BALANCES[userId][stockSymbol].yes.quantity += quantity;
  res.status(200).json({ message: "Tokens minted." });
});
