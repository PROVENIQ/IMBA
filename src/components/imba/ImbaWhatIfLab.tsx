'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  CircleDollarSign,
  Clock3,
  Gauge,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Sparkles,
  Target,
} from 'lucide-react';

type PresetKey = 'program' | 'partnership' | 'equipment' | 'staffing';

interface ScenarioInputs {
  name: string;
  oneTimeCost: number;
  annualRevenue: number;
  annualOperatingCost: number;
  fte: number;
  loadedCostPerFte: number;
  designatedFunding: number;
  startDelayMonths: number;
  collectionDelayDays: number;
  confidence: number;
  startingCash: number;
  cashFloor: number;
}

interface ScenarioResult {
  name: string;
  net12: number;
  net24: number;
  minCash: number;
  endingCash: number;
  breakEvenMonth: number | null;
  revenueToBreakEven: number;
  floorGap: number;
  series: number[];
}

const presets: Record<PresetKey, ScenarioInputs> = {
  program: {
    name: 'New national program',
    oneTimeCost: 180_000,
    annualRevenue: 420_000,
    annualOperatingCost: 160_000,
    fte: 1.5,
    loadedCostPerFte: 92_000,
    designatedFunding: 100_000,
    startDelayMonths: 2,
    collectionDelayDays: 45,
    confidence: 70,
    startingCash: 1_740_000,
    cashFloor: 1_250_000,
  },
  partnership: {
    name: 'Healthcare / wellness partnership',
    oneTimeCost: 95_000,
    annualRevenue: 300_000,
    annualOperatingCost: 90_000,
    fte: 0.8,
    loadedCostPerFte: 96_000,
    designatedFunding: 75_000,
    startDelayMonths: 1,
    collectionDelayDays: 30,
    confidence: 78,
    startingCash: 1_740_000,
    cashFloor: 1_250_000,
  },
  equipment: {
    name: 'Equipment commitment',
    oneTimeCost: 360_000,
    annualRevenue: 540_000,
    annualOperatingCost: 140_000,
    fte: 0.4,
    loadedCostPerFte: 98_000,
    designatedFunding: 0,
    startDelayMonths: 2,
    collectionDelayDays: 45,
    confidence: 65,
    startingCash: 1_740_000,
    cashFloor: 1_250_000,
  },
  staffing: {
    name: 'Delivery-team expansion',
    oneTimeCost: 45_000,
    annualRevenue: 610_000,
    annualOperatingCost: 85_000,
    fte: 2.4,
    loadedCostPerFte: 105_000,
    designatedFunding: 0,
    startDelayMonths: 1,
    collectionDelayDays: 30,
    confidence: 72,
    startingCash: 1_740_000,
    cashFloor: 1_250_000,
  },
};

function money(value: number): string {
  const sign = value < 0 ? '-' : '';
  const absolute = Math.abs(value);
  const trim = (amount: number) => amount.toFixed(1).replace(/\.0$/, '');
  if (absolute >= 1_000_000) return `${sign}$${trim(absolute / 1_000_000)}M`;
  if (absolute >= 1_000) return `${sign}$${trim(absolute / 1_000)}K`;
  return `${sign}$${Math.round(absolute)}`;
}

function calculateScenario(inputs: ScenarioInputs): ScenarioResult {
  const confidence = inputs.confidence / 100;
  const collectionLagMonths = Math.ceil(inputs.collectionDelayDays / 30);
  const revenueStartMonth = inputs.startDelayMonths + collectionLagMonths + 1;
  const monthlyRevenue = (inputs.annualRevenue * confidence) / 12;
  const monthlyCost = (inputs.annualOperatingCost + inputs.fte * inputs.loadedCostPerFte) / 12;
  const netInitialInvestment = Math.max(0, inputs.oneTimeCost - inputs.designatedFunding);
  const series: number[] = [inputs.startingCash - netInitialInvestment];
  let cumulativeEffect = -netInitialInvestment;
  let breakEvenMonth: number | null = cumulativeEffect >= 0 ? 0 : null;
  let net12 = cumulativeEffect;

  for (let month = 1; month <= 24; month += 1) {
    const inflow = month >= revenueStartMonth ? monthlyRevenue : 0;
    const monthEffect = inflow - monthlyCost;
    cumulativeEffect += monthEffect;
    series.push(series[series.length - 1] + monthEffect);
    if (breakEvenMonth === null && cumulativeEffect >= 0) breakEvenMonth = month;
    if (month === 12) net12 = cumulativeEffect;
  }

  const activeRevenueMonths = Math.max(1, 24 - revenueStartMonth + 1);
  const requiredRecognizedRevenue = netInitialInvestment + monthlyCost * 24;
  const revenueToBreakEven = (requiredRecognizedRevenue / activeRevenueMonths) * 12 / Math.max(confidence, 0.01);
  const minCash = Math.min(...series);

  return {
    name: inputs.name,
    net12,
    net24: cumulativeEffect,
    minCash,
    endingCash: series[series.length - 1],
    breakEvenMonth,
    revenueToBreakEven,
    floorGap: Math.max(0, inputs.cashFloor - minCash),
    series,
  };
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <label className="block rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5">
      <span className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold text-[#9bafa9]">{label}</span>
        <span className="font-mono text-xs font-semibold text-white">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/[0.08] accent-[#b7e35b]"
        style={{ background: `linear-gradient(to right, #b7e35b 0%, #b7e35b ${percent}%, rgba(255,255,255,.08) ${percent}%, rgba(255,255,255,.08) 100%)` }}
      />
      <span className="mt-2 flex justify-between font-mono text-[8px] text-[#526a63]"><span>{min}</span><span>{max}</span></span>
    </label>
  );
}

function ScenarioLineChart({ result, floor }: { result: ScenarioResult; floor: number }) {
  const width = 760;
  const height = 230;
  const pad = 24;
  const min = Math.min(...result.series, floor) - 100_000;
  const max = Math.max(...result.series, floor) + 100_000;
  const point = (value: number, index: number) => {
    const x = pad + (index / (result.series.length - 1)) * (width - pad * 2);
    const y = pad + ((max - value) / (max - min)) * (height - pad * 2);
    return [x, y] as const;
  };
  const points = result.series.map(point);
  const line = points.map(([x, y], index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' ');
  const area = `${line} L ${points[points.length - 1][0]} ${height - pad} L ${points[0][0]} ${height - pad} Z`;
  const floorY = point(floor, 0)[1];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[220px] w-full" role="img" aria-label="Twenty-four month scenario cash forecast">
        <defs>
          <linearGradient id="whatIfArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b7e35b" stopOpacity=".2" /><stop offset="1" stopColor="#b7e35b" stopOpacity="0" /></linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((position) => <line key={position} x1={pad} x2={width - pad} y1={pad + position * (height - pad * 2)} y2={pad + position * (height - pad * 2)} stroke="rgba(255,255,255,.06)" strokeDasharray="4 7" />)}
        <line x1={pad} x2={width - pad} y1={floorY} y2={floorY} stroke="#f6c453" strokeDasharray="5 6" opacity=".75" />
        <text x={width - pad} y={floorY - 7} textAnchor="end" fill="#f6c453" fontSize="10">cash floor</text>
        <path d={area} fill="url(#whatIfArea)" />
        <path d={line} fill="none" stroke={result.floorGap > 0 ? '#f4a6a6' : '#b7e35b'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.filter((_, index) => index % 3 === 0).map(([x, y], index) => <circle key={index} cx={x} cy={y} r="2.5" fill="#dff7a8" />)}
      </svg>
      <div className="flex justify-between px-6 text-[9px] font-bold uppercase tracking-wider text-[#617971]"><span>Decision</span><span>Month 12</span><span>Month 24</span></div>
    </div>
  );
}

export function ImbaWhatIfLab() {
  const [presetKey, setPresetKey] = useState<PresetKey>('program');
  const [inputs, setInputs] = useState<ScenarioInputs>(presets.program);
  const [saved, setSaved] = useState<ScenarioResult[]>([]);
  const result = useMemo(() => calculateScenario(inputs), [inputs]);

  const update = <K extends keyof ScenarioInputs>(key: K, value: ScenarioInputs[K]) => {
    setInputs((current) => ({ ...current, [key]: value }));
  };

  const choosePreset = (key: PresetKey) => {
    setPresetKey(key);
    setInputs(presets[key]);
  };

  const saveScenario = () => {
    setSaved((current) => [result, ...current.filter((item) => item.name !== result.name)].slice(0, 4));
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[22px] border border-[#b7e35b]/18 bg-[linear-gradient(120deg,rgba(183,227,91,.09),rgba(104,185,170,.04))] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex max-w-3xl items-start gap-3">
            <div className="rounded-2xl border border-[#b7e35b]/20 bg-[#b7e35b]/10 p-2.5 text-[#dff7a8]"><SlidersHorizontal className="h-5 w-5" /></div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9cb85f]">Kent&apos;s instrument panel</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">WHAT_IF Scenario Lab</h2>
              <p className="mt-2 text-xs leading-5 text-[#93a8a1]">Price an idea before committing: full cost, 12–24 month cash effect, break-even conditions, and the milestones that determine whether to accelerate, adjust, or pause.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => choosePreset(presetKey)} className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.035] px-3 py-2 text-[10px] font-bold text-white hover:bg-white/[0.07]"><RotateCcw className="h-3.5 w-3.5" /> Reset</button>
            <button type="button" onClick={saveScenario} className="inline-flex items-center gap-2 rounded-xl bg-[#b7e35b] px-3 py-2 text-[10px] font-black text-[#102016] hover:bg-[#c9ef79]"><Save className="h-3.5 w-3.5" /> Save comparison</button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <section className="rounded-[22px] border border-white/[0.08] bg-[#111b1a]/90 xl:col-span-5">
          <div className="border-b border-white/[0.07] p-5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#728981]">01 · Choose the idea</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(Object.keys(presets) as PresetKey[]).map((key) => (
                <button key={key} type="button" onClick={() => choosePreset(key)} className={`rounded-xl border px-3 py-2.5 text-left text-[10px] font-semibold transition ${presetKey === key ? 'border-[#b7e35b]/30 bg-[#b7e35b]/10 text-white' : 'border-white/[0.07] bg-white/[0.02] text-[#8da19a] hover:bg-white/[0.05]'}`}>{presets[key].name}</button>
              ))}
            </div>
            <label className="mt-3 block"><span className="text-[9px] font-black uppercase tracking-wider text-[#6d847c]">Scenario name</span><input value={inputs.name} onChange={(event) => update('name', event.target.value)} className="mt-2 w-full rounded-xl border border-white/[0.09] bg-[#0b1513] px-3 py-2.5 text-xs text-white outline-none focus:border-[#b7e35b]/40" /></label>
          </div>
          <div className="p-5">
            <p className="mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#728981]">02 · Move the assumptions</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <RangeField label="One-time commitment" value={inputs.oneTimeCost} min={0} max={750_000} step={5_000} display={money(inputs.oneTimeCost)} onChange={(value) => update('oneTimeCost', value)} />
              <RangeField label="Designated funding" value={inputs.designatedFunding} min={0} max={500_000} step={5_000} display={money(inputs.designatedFunding)} onChange={(value) => update('designatedFunding', value)} />
              <RangeField label="Annual earned / raised revenue" value={inputs.annualRevenue} min={0} max={1_500_000} step={10_000} display={money(inputs.annualRevenue)} onChange={(value) => update('annualRevenue', value)} />
              <RangeField label="Annual non-labor cost" value={inputs.annualOperatingCost} min={0} max={600_000} step={5_000} display={money(inputs.annualOperatingCost)} onChange={(value) => update('annualOperatingCost', value)} />
              <RangeField label="Added team capacity" value={inputs.fte} min={0} max={6} step={0.1} display={`${inputs.fte.toFixed(1)} FTE`} onChange={(value) => update('fte', value)} />
              <RangeField label="Loaded cost per FTE" value={inputs.loadedCostPerFte} min={60_000} max={160_000} step={2_000} display={money(inputs.loadedCostPerFte)} onChange={(value) => update('loadedCostPerFte', value)} />
              <RangeField label="Revenue confidence" value={inputs.confidence} min={25} max={100} step={1} display={`${inputs.confidence}%`} onChange={(value) => update('confidence', value)} />
              <RangeField label="Launch delay" value={inputs.startDelayMonths} min={0} max={9} step={1} display={`${inputs.startDelayMonths} mo`} onChange={(value) => update('startDelayMonths', value)} />
              <RangeField label="Collection delay" value={inputs.collectionDelayDays} min={0} max={120} step={15} display={`${inputs.collectionDelayDays} days`} onChange={(value) => update('collectionDelayDays', value)} />
              <RangeField label="Minimum cash floor" value={inputs.cashFloor} min={750_000} max={2_000_000} step={25_000} display={money(inputs.cashFloor)} onChange={(value) => update('cashFloor', value)} />
            </div>
          </div>
        </section>

        <div className="space-y-5 xl:col-span-7">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/[0.08] bg-[#142321] p-4"><div className="flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-wider text-[#70877f]">12-month effect</span>{result.net12 >= 0 ? <ArrowUpRight className="h-4 w-4 text-[#b7e35b]" /> : <ArrowDownRight className="h-4 w-4 text-rose-200" />}</div><p className={`mt-4 font-mono text-xl font-semibold ${result.net12 >= 0 ? 'text-[#dff7a8]' : 'text-rose-200'}`}>{money(result.net12)}</p></div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#142321] p-4"><div className="flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-wider text-[#70877f]">24-month effect</span><Target className="h-4 w-4 text-[#9fd6cc]" /></div><p className={`mt-4 font-mono text-xl font-semibold ${result.net24 >= 0 ? 'text-[#dff7a8]' : 'text-rose-200'}`}>{money(result.net24)}</p></div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#142321] p-4"><div className="flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-wider text-[#70877f]">Lowest cash</span><Gauge className="h-4 w-4 text-amber-200" /></div><p className="mt-4 font-mono text-xl font-semibold text-white">{money(result.minCash)}</p></div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#142321] p-4"><div className="flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-wider text-[#70877f]">Break even</span><Clock3 className="h-4 w-4 text-[#b7e35b]" /></div><p className="mt-4 font-mono text-xl font-semibold text-white">{result.breakEvenMonth === null ? '>24 mo' : `Month ${result.breakEvenMonth}`}</p></div>
          </div>

          <section className="rounded-[22px] border border-white/[0.08] bg-[#111b1a]/90">
            <div className="flex items-start justify-between border-b border-white/[0.07] px-5 py-4"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#718981]">03 · See the consequence</p><h3 className="mt-1 text-base font-semibold text-white">Deployable cash over 24 months</h3></div><span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${result.floorGap > 0 ? 'border-rose-300/20 bg-rose-300/10 text-rose-200' : 'border-[#b7e35b]/20 bg-[#b7e35b]/10 text-[#dff7a8]'}`}>{result.floorGap > 0 ? 'Floor breached' : 'Inside guardrail'}</span></div>
            <div className="px-3 pb-5 pt-2"><ScenarioLineChart result={result} floor={inputs.cashFloor} /></div>
          </section>

          <section className="rounded-[22px] border border-white/[0.08] bg-[#111b1a]/90">
            <div className="border-b border-white/[0.07] px-5 py-4"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#718981]">04 · Define what must be true</p><h3 className="mt-1 text-base font-semibold text-white">Finance guardrails for Kent</h3></div>
            <div className="grid gap-3 p-5 md:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><CircleDollarSign className="h-4 w-4 text-[#b7e35b]" /><p className="mt-3 text-[9px] font-black uppercase tracking-wider text-[#718981]">Break-even revenue</p><p className="mt-1 font-mono text-lg font-semibold text-white">{money(result.revenueToBreakEven)} / yr</p><p className="mt-2 text-[10px] leading-4 text-[#7f958e]">At the current timing and confidence assumptions.</p></div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><BriefcaseBusiness className="h-4 w-4 text-[#9fd6cc]" /><p className="mt-3 text-[9px] font-black uppercase tracking-wider text-[#718981]">Evidence threshold</p><p className="mt-1 font-mono text-lg font-semibold text-white">{money(Math.max(inputs.oneTimeCost, inputs.annualRevenue * 0.6))}</p><p className="mt-2 text-[10px] leading-4 text-[#7f958e]">Funding or executed backlog before full release.</p></div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">{result.floorGap > 0 ? <AlertTriangle className="h-4 w-4 text-rose-200" /> : <Check className="h-4 w-4 text-[#b7e35b]" />}<p className="mt-3 text-[9px] font-black uppercase tracking-wider text-[#718981]">Additional protection</p><p className={`mt-1 font-mono text-lg font-semibold ${result.floorGap > 0 ? 'text-rose-200' : 'text-[#dff7a8]'}`}>{result.floorGap > 0 ? money(result.floorGap) : '$0 required'}</p><p className="mt-2 text-[10px] leading-4 text-[#7f958e]">Funding needed to preserve the selected cash floor.</p></div>
            </div>
          </section>
        </div>
      </div>

      {saved.length > 0 ? (
        <section className="rounded-[22px] border border-white/[0.08] bg-[#111b1a]/90">
          <div className="flex items-center gap-2 border-b border-white/[0.07] px-5 py-4"><Sparkles className="h-4 w-4 text-[#b7e35b]" /><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#718981]">Saved comparison</p><h3 className="mt-1 text-base font-semibold text-white">Choices side by side</h3></div></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-white/[0.07] text-[9px] font-black uppercase tracking-wider text-[#6d847c]"><th className="px-5 py-3">Scenario</th><th className="px-3 py-3 text-right">12 month</th><th className="px-3 py-3 text-right">24 month</th><th className="px-3 py-3 text-right">Lowest cash</th><th className="px-3 py-3 text-right">Break even</th><th className="px-5 py-3 text-right">Floor protection</th></tr></thead><tbody>{saved.map((item) => <tr key={item.name} className="border-b border-white/[0.05] last:border-0"><td className="px-5 py-4 text-xs font-semibold text-white">{item.name}</td><td className={`px-3 py-4 text-right font-mono text-xs ${item.net12 >= 0 ? 'text-[#dff7a8]' : 'text-rose-200'}`}>{money(item.net12)}</td><td className={`px-3 py-4 text-right font-mono text-xs ${item.net24 >= 0 ? 'text-[#dff7a8]' : 'text-rose-200'}`}>{money(item.net24)}</td><td className="px-3 py-4 text-right font-mono text-xs text-white">{money(item.minCash)}</td><td className="px-3 py-4 text-right font-mono text-xs text-white">{item.breakEvenMonth === null ? '>24 mo' : `Mo ${item.breakEvenMonth}`}</td><td className="px-5 py-4 text-right font-mono text-xs text-white">{item.floorGap > 0 ? money(item.floorGap) : 'Protected'}</td></tr>)}</tbody></table></div>
        </section>
      ) : null}
    </div>
  );
}
