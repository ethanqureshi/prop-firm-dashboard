export type Firm = {
  name: string;
  accountSize: number;
  evalFee: number;
  activation: number;
  profitTarget: number;
  maxDD: number;
  dailyLoss: number | null;
  payoutSplit: number;
  ddType: "intraday" | "eod";
};

export const FIRMS: Firm[] = [
  { name: "Apex Intraday", accountSize: 50000, evalFee: 32, activation: 79, profitTarget: 3000, maxDD: 2000, dailyLoss: null, payoutSplit: 1.00, ddType: "intraday" },
  { name: "Apex EOD", accountSize: 50000, evalFee: 32, activation: 79, profitTarget: 3000, maxDD: 2000, dailyLoss: 1000, payoutSplit: 1.00, ddType: "eod" },
  { name: "MFF Rapid", accountSize: 50000, evalFee: 80, activation: 0, profitTarget: 3000, maxDD: 2000, dailyLoss: null, payoutSplit: 0.90, ddType: "intraday" },
  { name: "TopStep Standard", accountSize: 50000, evalFee: 49, activation: 149, profitTarget: 3000, maxDD: 2000, dailyLoss: 1000, payoutSplit: 0.90, ddType: "eod" },
  { name: "TopStep Consistency", accountSize: 50000, evalFee: 49, activation: 149, profitTarget: 3000, maxDD: 2000, dailyLoss: 1000, payoutSplit: 0.90, ddType: "eod" },
  { name: "MFF Builder Add-On", accountSize: 50000, evalFee: 87, activation: 0, profitTarget: 3000, maxDD: 1500, dailyLoss: null, payoutSplit: 0.80, ddType: "eod" },
  { name: "Tradeify Growth", accountSize: 50000, evalFee: 87, activation: 0, profitTarget: 3000, maxDD: 2000, dailyLoss: null, payoutSplit: 0.90, ddType: "eod" },
  { name: "MFF Flex 50K", accountSize: 50000, evalFee: 92, activation: 0, profitTarget: 3000, maxDD: 2000, dailyLoss: null, payoutSplit: 0.80, ddType: "eod" },
  { name: "TopStep No-Fee", accountSize: 50000, evalFee: 95, activation: 0, profitTarget: 3000, maxDD: 2000, dailyLoss: 1000, payoutSplit: 0.90, ddType: "eod" },
  { name: "LucidFlex", accountSize: 50000, evalFee: 98, activation: 0, profitTarget: 3000, maxDD: 2000, dailyLoss: null, payoutSplit: 0.90, ddType: "eod" },
  { name: "Tradeify Select Daily", accountSize: 50000, evalFee: 99, activation: 0, profitTarget: 3000, maxDD: 2000, dailyLoss: null, payoutSplit: 0.90, ddType: "eod" },
  { name: "MFF Builder", accountSize: 50000, evalFee: 107, activation: 0, profitTarget: 3000, maxDD: 2000, dailyLoss: null, payoutSplit: 0.80, ddType: "eod" },
  { name: "LucidPro", accountSize: 50000, evalFee: 130, activation: 0, profitTarget: 3000, maxDD: 2000, dailyLoss: null, payoutSplit: 0.90, ddType: "eod" },
  { name: "MFF Pro", accountSize: 50000, evalFee: 165, activation: 0, profitTarget: 3000, maxDD: 2000, dailyLoss: null, payoutSplit: 0.80, ddType: "eod" },
];
