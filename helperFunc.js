import { ORDERBOOK } from "./models/models.js";

export const initializeOrderBook = (symbol) => {
  ORDERBOOK[symbol] = { yes: {}, no: {} };
};
