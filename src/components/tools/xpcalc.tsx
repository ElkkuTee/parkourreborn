'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  calculateProgressBetweenLevels,
  formatComboScore,
  formatXP,
  xpRemainingToTargetLevel,
  xpRequiredBetweenLevels,
  xpToRequiredComboScore,
} from '@/lib/xpcalc';
import PageHero from '@/components/page-hero';
import { images } from '@/lib/assets';

type FieldProps = {
  label: string;
  value: InputValue;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: InputValue) => void;
};

type InputValue = number | string;

type SavedValues = {
  level?: InputValue;
  multiplier?: InputValue;
  vip?: boolean;
  targetLevel?: InputValue;
  sessionTargetLevel?: InputValue;
  averageCombo?: InputValue;
  startLevel?: InputValue;
  endLevel?: InputValue;
};

const saveKey = 'xpcalc-values';
const levelCap = 999;

const num = (value: InputValue, fallback: number) => {
  if (value === '') return fallback;
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const calcLevel = (value: InputValue) => Math.min(levelCap, Math.max(1, Math.floor(num(value, 1))));
const calcNumber = (value: InputValue) => num(value, 0);
const calcMultiplier = (value: InputValue) => Math.max(1, num(value, 1));

const Result = ({ label, value, big = false }: { label: string; value: string; big?: boolean }) => (
  <div className={`xp-result ${big ? 'xp-result--big' : ''}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const Field = ({ label, value, min, max, step = 1, onChange }: FieldProps) => (
  <label className="xp-field">
    <span>{label}</span>
    <input type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(event.target.value)} />
  </label>
);

export default function XPCalculator() {
  const [level, setLevel] = useState<InputValue>(1);
  const [percent, setPercent] = useState<InputValue>(0);
  const [multiplier, setMultiplier] = useState<InputValue>(1);
  const [vip, setVip] = useState(false);
  const [targetLevel, setTargetLevel] = useState<InputValue>(10);
  const [sessionTargetLevel, setSessionTargetLevel] = useState<InputValue>(10);
  const [averageCombo, setAverageCombo] = useState<InputValue>(360000);
  const [startLevel, setStartLevel] = useState<InputValue>(1);
  const [endLevel, setEndLevel] = useState<InputValue>(50);
  const [loaded, setLoaded] = useState(false);
  const currentCalcLevel = calcLevel(level);
  const currentCalcPercent = calcNumber(percent);
  const calcXPMultiplier = calcMultiplier(multiplier);
  const goalCalcLevel = calcLevel(targetLevel);
  const sessionGoalCalcLevel = calcLevel(sessionTargetLevel);
  const startCalcLevel = calcLevel(startLevel);
  const endCalcLevel = calcLevel(endLevel);
  const averageCalcCombo = calcNumber(averageCombo);

  const calc = useMemo(() => calculateProgressBetweenLevels(currentCalcLevel, currentCalcPercent, currentCalcLevel + 1, calcXPMultiplier, vip), [currentCalcLevel, currentCalcPercent, calcXPMultiplier, vip]);
  const targetXP = useMemo(() => xpRemainingToTargetLevel(currentCalcLevel, currentCalcPercent, goalCalcLevel), [currentCalcLevel, currentCalcPercent, goalCalcLevel]);
  const targetCombo = useMemo(() => xpToRequiredComboScore(targetXP, calcXPMultiplier, vip), [targetXP, calcXPMultiplier, vip]);
  const levelsRemaining = useMemo(() => Math.max(0, goalCalcLevel - currentCalcLevel), [goalCalcLevel, currentCalcLevel]);
  const sessionXP = useMemo(() => xpRemainingToTargetLevel(currentCalcLevel, currentCalcPercent, sessionGoalCalcLevel), [currentCalcLevel, currentCalcPercent, sessionGoalCalcLevel]);
  const sessionCombo = useMemo(() => xpToRequiredComboScore(sessionXP, calcXPMultiplier, vip), [sessionXP, calcXPMultiplier, vip]);
  const runsNeeded = useMemo(() => (averageCalcCombo > 0 ? Math.ceil(sessionCombo / averageCalcCombo) : 0), [sessionCombo, averageCalcCombo]);
  const betweenXP = useMemo(() => xpRequiredBetweenLevels(startCalcLevel, endCalcLevel), [startCalcLevel, endCalcLevel]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(saveKey);
      if (!raw) {
        setLoaded(true);
        return;
      }

      const saved = JSON.parse(raw) as SavedValues;
      if (typeof saved.level === 'number' || typeof saved.level === 'string') setLevel(saved.level);
      if (typeof saved.multiplier === 'number' || typeof saved.multiplier === 'string') setMultiplier(saved.multiplier);
      if (typeof saved.vip === 'boolean') setVip(saved.vip);
      if (typeof saved.targetLevel === 'number' || typeof saved.targetLevel === 'string') setTargetLevel(saved.targetLevel);
      if (typeof saved.sessionTargetLevel === 'number' || typeof saved.sessionTargetLevel === 'string') setSessionTargetLevel(saved.sessionTargetLevel);
      if (typeof saved.averageCombo === 'number' || typeof saved.averageCombo === 'string') setAverageCombo(saved.averageCombo);
      if (typeof saved.startLevel === 'number' || typeof saved.startLevel === 'string') setStartLevel(saved.startLevel);
      if (typeof saved.endLevel === 'number' || typeof saved.endLevel === 'string') setEndLevel(saved.endLevel);
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const saved: SavedValues = { level, multiplier, vip, targetLevel, sessionTargetLevel, averageCombo, startLevel, endLevel };
    localStorage.setItem(saveKey, JSON.stringify(saved));
  }, [level, multiplier, vip, targetLevel, sessionTargetLevel, averageCombo, startLevel, endLevel, loaded]);

  return (
    <div className="xp-page">
      <PageHero eyebrow="Tool" title="XP Calculator" image={images.backgrounds.tools.xpcalc} />

      <section className="xp-layout">
        <div className="xp-panel">
          <div className="xp-title">
            <span>Current progress</span>
          </div>
          <div className="xp-fields">
            <Field label="Current level" value={level} min={1} onChange={setLevel} />
            <Field label="Current XP %" value={percent} min={0} max={100} step={0.1} onChange={setPercent} />
            <Field label="XP multiplier" value={multiplier} min={0} step={0.1} onChange={setMultiplier} />
          </div>
          <button className={`xp-toggle ${vip ? 'is-on' : ''}`} type="button" aria-pressed={vip} onClick={() => setVip((current) => !current)}>
            <span />
            VIP / Executive Runner 2x
          </button>
        </div>

        <div className="xp-panel xp-panel--results">
          <div className="xp-title">
            <span>Next level</span>
          </div>
          <div className="xp-results xp-results--main">
            <Result label="Combo needed" value={formatComboScore(calc.comboScoreRequiredForNextLevel)} big />
            <Result label="XP left" value={formatXP(calc.xpRemainingForNextLevel)} big />
            <Result label="Effective XP" value={`${calc.effectiveMultiplier}x`} />
            <Result label="Full level XP" value={formatXP(calc.xpRequiredForNextLevel)} />
          </div>
        </div>
      </section>

      <section className="xp-advanced">
        <div className="xp-title xp-title--section"><span>Advanced XP stuff</span></div>

        <div className="xp-panel">
          <div className="xp-title"><span>Sessions Needed</span></div>
          <div className="xp-fields xp-fields--tight">
            <Field label="Target level" value={sessionTargetLevel} min={1} onChange={setSessionTargetLevel} />
            <Field label="Average combo per run" value={averageCombo} min={0} onChange={setAverageCombo} />
          </div>
          <Result label="Total combo needed" value={formatComboScore(sessionCombo)} />
          <Result label="Runs needed" value={formatComboScore(runsNeeded)} />
        </div>

        <div className="xp-panel">
          <div className="xp-title"><span>Level Goal</span></div>
          <div className="xp-fields xp-fields--tight">
            <Field label="Target level" value={targetLevel} min={1} onChange={setTargetLevel} />
          </div>
          <Result label="Combo remaining" value={formatComboScore(targetCombo)} />
          <Result label="XP remaining" value={formatXP(targetXP)} />
          <Result label="Levels remaining" value={formatComboScore(levelsRemaining)} />
        </div>

        <div className="xp-panel">
          <div className="xp-title"><span>Level gap</span></div>
          <div className="xp-fields xp-fields--tight">
            <Field label="Level A" value={startLevel} min={1} onChange={setStartLevel} />
            <Field label="Level B" value={endLevel} min={1} onChange={setEndLevel} />
          </div>
          <Result label="Combo needed" value={formatComboScore(xpToRequiredComboScore(betweenXP, calcXPMultiplier, vip))} />
          <Result label="XP needed" value={formatXP(betweenXP)} />
        </div>
      </section>
    </div>
  );
}
