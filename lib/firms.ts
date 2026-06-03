export type Firm = {
  name: string;
  evalFee: number;
  activation: number;
  profitTarget: number;
  maxDD: number;
  dailyLoss: number | null;
  payoutSplit: number;
};

export const FIRMS: Firm[] = [
  {
    name: "Apex Trader Funding",
    evalFee: 167,
    activation: 85,
    profitTarget: 6000,
    maxDD: 2000,
    dailyLoss: null,
    payoutSplit: 0.9,
  },
  {
    name: "Topstep",
    evalFee: 149,
    activation: 0,
    profitTarget: 5000,
    maxDD: 2000,
    dailyLoss: 1000,
    payoutSplit: 0.9,
  },
  {
    name: "FTMO",
    evalFee: 155,
    activation: 0,
    profitTarget: 10000,
    maxDD: 10000,
    dailyLoss: 5000,
    payoutSplit: 0.8,
  },
  {
    name: "My Forex Funds",
    evalFee: 97,
    activation: 0,
    profitTarget: 8000,
    maxDD: 8000,
    dailyLoss: 4000,
    payoutSplit: 0.75,
  },
  {
    name: "The Funded Trader",
    evalFee: 129,
    activation: 0,
    profitTarget: 10000,
    maxDD: 10000,
    dailyLoss: 5000,
    payoutSplit: 0.85,
  },
  {
    name: "TradeDay",
    evalFee: 99,
    activation: 75,
    profitTarget: 3000,
    maxDD: 1500,
    dailyLoss: null,
    payoutSplit: 0.9,
  },
  {
    name: "Earn2Trade",
    evalFee: 150,
    activation: 0,
    profitTarget: 6000,
    maxDD: 3000,
    dailyLoss: 2000,
    payoutSplit: 0.8,
  },
  {
    name: "Bulenox",
    evalFee: 125,
    activation: 0,
    profitTarget: 3000,
    maxDD: 1500,
    dailyLoss: null,
    payoutSplit: 0.9,
  },
];
