export const initializeOrderBook = (symbol) => {
  ORDERBOOK[symbol] = { yes: {}, no: {} };
};
