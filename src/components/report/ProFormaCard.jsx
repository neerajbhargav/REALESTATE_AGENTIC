import React, { useState, useEffect } from "react";
import { Sparkles, DollarSign, Calculator, Percent, ArrowRight } from "lucide-react";
import { fmtNum, fmtMoney, fmtMoneyShort } from "../../lib/format";

export const ProFormaCard = ({ bsf, estimatedLandValue }) => {
  const buildableSf = bsf?.residential_bsf || 20000; // default fallback if data missing

  // Tabs: "rental" vs "condo"
  const [modelType, setModelType] = useState("rental");

  // Inputs
  const [landCost, setLandCost] = useState(estimatedLandValue || 5000000);
  const [hardCostPerSf, setHardCostPerSf] = useState(350); // Construction cost per SF
  const [softCostPct, setSoftCostPct] = useState(15);      // Architect, finance, permits, legal
  
  // Rental specific inputs
  const [rentPerSfYear, setRentPerSfYear] = useState(75);   // Average yearly rent/SF
  const [opexPct, setOpexPct] = useState(35);             // Operating expenses %
  const [exitCapRate, setExitCapRate] = useState(5.25);    // Exit cap rate %

  // Condo specific inputs
  const [condoSalePricePerSf, setCondoSalePricePerSf] = useState(1400); // average sale price per SF
  const [marketingPct, setMarketingPct] = useState(6);                 // broker commission, marketing, transfer taxes %

  // Whenever backend estimated value updates, set our default land cost
  useEffect(() => {
    if (estimatedLandValue) {
      setLandCost(estimatedLandValue);
    }
  }, [estimatedLandValue]);

  // Calculations
  const hardCosts = buildableSf * hardCostPerSf;
  const softCosts = hardCosts * (softCostPct / 100);
  const constructionCost = hardCosts + softCosts;
  const totalProjectCost = constructionCost + Number(landCost || 0);

  // efficiency: 85% rentable/saleable area
  const efficiencyFactor = 0.85;
  const netSellsSf = buildableSf * efficiencyFactor;

  // Rental model outputs
  const grossRentYear = netSellsSf * rentPerSfYear;
  const opexCostYear = grossRentYear * (opexPct / 100);
  const netOperatingIncome = grossRentYear - opexCostYear;
  const yieldOnCost = totalProjectCost > 0 ? (netOperatingIncome / totalProjectCost) * 100 : 0;
  const valuationExit = exitCapRate > 0 ? netOperatingIncome / (exitCapRate / 100) : 0;
  const developmentProfitRental = valuationExit - totalProjectCost;
  const developmentMarginRental = totalProjectCost > 0 ? (developmentProfitRental / totalProjectCost) * 100 : 0;

  // Condo model outputs
  const grossSellout = netSellsSf * condoSalePricePerSf;
  const marketingCosts = grossSellout * (marketingPct / 100);
  const netCondoProceeds = grossSellout - marketingCosts;
  const developmentProfitCondo = netCondoProceeds - totalProjectCost;
  const developmentMarginCondo = totalProjectCost > 0 ? (developmentProfitCondo / totalProjectCost) * 100 : 0;

  return (
    <div className="bg-white border border-zinc-200 rounded-sm p-6 overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-zinc-950" />
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-700 font-bold">
            Back-of-Envelope Pro Forma Model
          </h2>
        </div>
        <div className="flex bg-zinc-100 p-0.5 rounded-sm shrink-0">
          <button
            onClick={() => setModelType("rental")}
            className={`px-3 py-1 font-mono text-[10px] uppercase tracking-wider rounded-sm transition-all ${
              modelType === "rental"
                ? "bg-white text-zinc-950 font-bold shadow-sm"
                : "text-zinc-500 hover:text-zinc-950"
            }`}
          >
            Rental Development
          </button>
          <button
            onClick={() => setModelType("condo")}
            className={`px-3 py-1 font-mono text-[10px] uppercase tracking-wider rounded-sm transition-all ${
              modelType === "condo"
                ? "bg-white text-zinc-950 font-bold shadow-sm"
                : "text-zinc-500 hover:text-zinc-950"
            }`}
          >
            Condo Sellout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Assumptions */}
        <div className="space-y-5 border-r border-zinc-100 lg:pr-8">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
            Project Assumptions (Adjust Sliders)
          </h3>

          {/* Land Cost input */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="text-zinc-500">Land Acquisition Price ($)</label>
              <span className="font-mono font-bold text-zinc-900">{fmtMoney(landCost)}</span>
            </div>
            <input
              type="range"
              min={Math.round(buildableSf * 50)}
              max={Math.round(buildableSf * 800)}
              step={50000}
              value={landCost}
              onChange={(e) => setLandCost(Number(e.target.value))}
              className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-950"
            />
          </div>

          {/* Hard Cost per SF */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="text-zinc-500">Construction Hard Cost ($/SF)</label>
              <span className="font-mono font-bold text-zinc-900">{fmtMoney(hardCostPerSf)}/SF</span>
            </div>
            <input
              type="range"
              min="150"
              max="600"
              step="10"
              value={hardCostPerSf}
              onChange={(e) => setHardCostPerSf(Number(e.target.value))}
              className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-950"
            />
            <p className="text-[10px] text-zinc-400 font-mono">Includes foundations, superstructure, finishes.</p>
          </div>

          {/* Soft Cost % */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="text-zinc-500">Soft Costs (% of Hard Costs)</label>
              <span className="font-mono font-bold text-zinc-900">{softCostPct}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={softCostPct}
              onChange={(e) => setSoftCostPct(Number(e.target.value))}
              className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-950"
            />
            <p className="text-[10px] text-zinc-400 font-mono">Architect, engineering, permits, legal, financing fees.</p>
          </div>

          {/* Model specific inputs */}
          {modelType === "rental" ? (
            <>
              {/* Rent per SF */}
              <div className="space-y-1.5 border-t border-zinc-100 pt-4">
                <div className="flex justify-between text-xs">
                  <label className="text-zinc-500">Average Residential Rent ($/SF/Yr)</label>
                  <span className="font-mono font-bold text-zinc-900">{fmtMoney(rentPerSfYear)}/SF/yr</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="130"
                  step="5"
                  value={rentPerSfYear}
                  onChange={(e) => setRentPerSfYear(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-950"
                />
                <p className="text-[10px] text-zinc-400 font-mono">
                  Equivalent to ~{fmtMoney((rentPerSfYear * 850) / 12)}/mo for an 850 SF unit.
                </p>
              </div>

              {/* Operating Expenses */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label className="text-zinc-500">Operating Expenses (% of Rent)</label>
                  <span className="font-mono font-bold text-zinc-900">{opexPct}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="50"
                  step="1"
                  value={opexPct}
                  onChange={(e) => setOpexPct(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-950"
                />
                <p className="text-[10px] text-zinc-400 font-mono">Property taxes, maintenance, utilities, management.</p>
              </div>

              {/* Exit Cap Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label className="text-zinc-500">Target Exit Cap Rate</label>
                  <span className="font-mono font-bold text-zinc-900">{exitCapRate.toFixed(2)}%</span>
                </div>
                <input
                  type="range"
                  min="3.5"
                  max="8.0"
                  step="0.05"
                  value={exitCapRate}
                  onChange={(e) => setExitCapRate(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-950"
                />
                <p className="text-[10px] text-zinc-400 font-mono">Yield used by buyers to value properties at sale.</p>
              </div>
            </>
          ) : (
            <>
              {/* Condo Sale Price */}
              <div className="space-y-1.5 border-t border-zinc-100 pt-4">
                <div className="flex justify-between text-xs">
                  <label className="text-zinc-500">Condo Sellout Price ($/SF)</label>
                  <span className="font-mono font-bold text-zinc-900">{fmtMoney(condoSalePricePerSf)}/SF</span>
                </div>
                <input
                  type="range"
                  min="600"
                  max="2500"
                  step="50"
                  value={condoSalePricePerSf}
                  onChange={(e) => setCondoSalePricePerSf(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-950"
                />
                <p className="text-[10px] text-zinc-400 font-mono">
                  Target sales price for net rentable condo units.
                </p>
              </div>

              {/* Sales & Marketing */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label className="text-zinc-500">Marketing & Sales Commissions (%)</label>
                  <span className="font-mono font-bold text-zinc-900">{marketingPct}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="12"
                  step="0.5"
                  value={marketingPct}
                  onChange={(e) => setMarketingPct(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-950"
                />
                <p className="text-[10px] text-zinc-400 font-mono">Commissions, advertising, transfer taxes, sponsor legal.</p>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Calculations Outputs */}
        <div className="flex flex-col justify-between space-y-6 lg:pl-4">
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-4">
              Underwriting Projections
            </h3>

            {/* Headline Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {modelType === "rental" ? (
                <>
                  <div className="bg-zinc-50 border border-zinc-200/60 p-4 rounded-sm">
                    <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-500">Yield on Cost</span>
                    <span className="block text-2xl lg:text-3xl font-display font-black text-emerald-700 tracking-tight mt-1">
                      {yieldOnCost.toFixed(2)}%
                    </span>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Market average: ~5.0%</p>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-200/60 p-4 rounded-sm">
                    <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-500">Est. Profit Margin</span>
                    <span className={`block text-2xl lg:text-3xl font-display font-black tracking-tight mt-1 ${developmentProfitRental >= 0 ? "text-zinc-950" : "text-red-700"}`}>
                      {developmentMarginRental.toFixed(1)}%
                    </span>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Development margin</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-zinc-50 border border-zinc-200/60 p-4 rounded-sm">
                    <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-500">Development Margin</span>
                    <span className="block text-2xl lg:text-3xl font-display font-black text-emerald-700 tracking-tight mt-1">
                      {developmentMarginCondo.toFixed(1)}%
                    </span>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Goal is typically &gt; 15%</p>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-200/60 p-4 rounded-sm">
                    <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-500">Projected Profit</span>
                    <span className={`block text-2xl lg:text-3xl font-display font-black tracking-tight mt-1 ${developmentProfitCondo >= 0 ? "text-zinc-950" : "text-red-700"}`}>
                      {fmtMoneyShort(developmentProfitCondo)}
                    </span>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Net development profit</p>
                  </div>
                </>
              )}
            </div>

            {/* Calculations breakdown list */}
            <div className="divide-y divide-zinc-100 text-xs">
              <div className="flex justify-between py-2.5">
                <span className="text-zinc-500">Buildable Area (BSF)</span>
                <span className="font-mono text-zinc-900 font-semibold">{fmtNum(buildableSf)} SF</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-zinc-500">Net Usable Area (85% efficiency)</span>
                <span className="font-mono text-zinc-900">{fmtNum(netSellsSf)} SF</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-zinc-500">Hard Construction Costs</span>
                <span className="font-mono text-zinc-900">{fmtMoneyShort(hardCosts)}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-zinc-500">Soft Costs ({softCostPct}%)</span>
                <span className="font-mono text-zinc-900">{fmtMoneyShort(softCosts)}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-zinc-500">Land Purchase Price</span>
                <span className="font-mono text-zinc-900 font-semibold">{fmtMoneyShort(landCost)}</span>
              </div>
              <div className="flex justify-between py-2.5 font-semibold text-zinc-950 border-t border-zinc-200 bg-zinc-50/50 px-2 rounded-sm mt-1">
                <span>Total Project Capital Needed</span>
                <span className="font-mono text-emerald-700">{fmtMoneyShort(totalProjectCost)}</span>
              </div>

              {modelType === "rental" ? (
                <>
                  <div className="flex justify-between py-2.5 mt-3">
                    <span className="text-zinc-500">Gross Yearly Rental Revenue</span>
                    <span className="font-mono text-zinc-900">{fmtMoneyShort(grossRentYear)}/yr</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="text-zinc-500">Net Operating Income (NOI)</span>
                    <span className="font-mono text-zinc-900 font-semibold">{fmtMoneyShort(netOperatingIncome)}/yr</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="text-zinc-500">Projected Exit Value (@ {exitCapRate.toFixed(2)}% cap)</span>
                    <span className="font-mono text-zinc-900 font-bold">{fmtMoneyShort(valuationExit)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between py-2.5 mt-3">
                    <span className="text-zinc-500">Gross Condo Sellout (revenue)</span>
                    <span className="font-mono text-zinc-900">{fmtMoneyShort(grossSellout)}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="text-zinc-500">Marketing & Transaction Costs</span>
                    <span className="font-mono text-zinc-900">{fmtMoneyShort(marketingCosts)}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="text-zinc-500">Net Sales Proceeds</span>
                    <span className="font-mono text-zinc-900 font-bold">{fmtMoneyShort(netCondoProceeds)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-zinc-950 text-white font-sans text-xs p-4 rounded-sm border border-zinc-800 flex items-start gap-3 mt-4 shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-100">Broker Tip</p>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                Adjust sliders to simulate local market conditions. Underbuilt properties with a high BSF yield the best margins. This model provides an instant back-of-the-envelope feasibility check.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProFormaCard;
