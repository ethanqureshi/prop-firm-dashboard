import type { Firm } from "./firms";

export type EVInput = {
  totalTrades: number;
  wins: number;
  avgWin: number;
  avgLoss: number;
};

export type SimulationResult = {
  firm: string;
  passRate: number;
  ev: number;
  costToFunded: number;
  evalFee: number;
  activation: number;
  split: number;
};

export function runSimulation(input: EVInput, firms: Firm[]): SimulationResult[] {
  const winRate = input.wins / input.totalTrades;
  const results: SimulationResult[] = [];

  for (const firm of firms) {
    let passCount = 0;

    for (let run = 0; run < 1000; run++) {
      let runPnL = 0;
      let maxRunPnL = 0;
      let dayPnL = 0;
      let failed = false;

      for (let trade = 0; trade < input.totalTrades; trade++) {
        const isWin = Math.random() < winRate;
        const pnl = isWin ? input.avgWin : -input.avgLoss;

        runPnL += pnl;
        dayPnL += pnl;

        if (runPnL > maxRunPnL) maxRunPnL = runPnL;

        const currentDD = maxRunPnL - runPnL;
        if (currentDD > firm.maxDD) {
          failed = true;
          break;
        }

        if (firm.dailyLoss !== null && dayPnL < -firm.dailyLoss) {
          dayPnL = 0;
        }

        if (runPnL >= firm.profitTarget) break;
      }

      if (!failed && runPnL >= firm.profitTarget) passCount++;
    }

    const passRate = passCount / 1000;
    const ev =
      passRate * firm.profitTarget * firm.payoutSplit -
      (1 - passRate) * firm.evalFee -
      firm.activation;
    const costToFunded = firm.evalFee / (passRate || 0.01) + firm.activation;

    results.push({
      firm: firm.name,
      passRate: Math.round(passRate * 1000) / 10,
      ev: Math.round(ev),
      costToFunded: Math.round(costToFunded),
      evalFee: firm.evalFee,
      activation: firm.activation,
      split: firm.payoutSplit * 100,
    });
  }

  return results.sort((a, b) => b.ev - a.ev);
}
