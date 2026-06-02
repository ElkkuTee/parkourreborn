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
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
};

type SavedValues = {
  level?: number;
  multiplier?: number;
  vip?: boolean;
  targetLevel?: number;
  sessionTargetLevel?: number;
  averageCombo?: number;
  startLevel?: number;
  endLevel?: number;
};

const saveKey = 'xpcalc-values';
const levelCap = 999;

const num = (value: string) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
};

const calcLevel = (value: number) => Math.min(levelCap, value);
const calcMultiplier = (value: number) => Math.max(1, value);

const Result = ({ label, value, big = false }: { label: string; value: string; big?: boolean }) => (
  <div className={`xp-result ${big ? 'xp-result--big' : ''}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const Field = ({ label, value, min, max, step = 1, onChange }: FieldProps) => (
  <label className="xp-field">
    <span>{label}</span>
    <input type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(num(event.target.value))} />
  </label>
);

export default function XPCalculator() {
  const [level, setLevel] = useState(1);
  const [percent, setPercent] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [vip, setVip] = useState(false);
  const [targetLevel, setTargetLevel] = useState(10);
  const [sessionTargetLevel, setSessionTargetLevel] = useState(10);
  const [averageCombo, setAverageCombo] = useState(360000);
  const [startLevel, setStartLevel] = useState(1);
  const [endLevel, setEndLevel] = useState(50);
  const [loaded, setLoaded] = useState(false);
  const currentCalcLevel = calcLevel(level);
  const calcXPMultiplier = calcMultiplier(multiplier);
  const goalCalcLevel = calcLevel(targetLevel);
  const sessionGoalCalcLevel = calcLevel(sessionTargetLevel);
  const startCalcLevel = calcLevel(startLevel);
  const endCalcLevel = calcLevel(endLevel);

  const calc = useMemo(() => calculateProgressBetweenLevels(currentCalcLevel, percent, currentCalcLevel + 1, calcXPMultiplier, vip), [currentCalcLevel, percent, calcXPMultiplier, vip]);
  const targetXP = useMemo(() => xpRemainingToTargetLevel(currentCalcLevel, percent, goalCalcLevel), [currentCalcLevel, percent, goalCalcLevel]);
  const targetCombo = useMemo(() => xpToRequiredComboScore(targetXP, calcXPMultiplier, vip), [targetXP, calcXPMultiplier, vip]);
  const levelsRemaining = useMemo(() => Math.max(0, goalCalcLevel - currentCalcLevel), [goalCalcLevel, currentCalcLevel]);
  const sessionXP = useMemo(() => xpRemainingToTargetLevel(currentCalcLevel, percent, sessionGoalCalcLevel), [currentCalcLevel, percent, sessionGoalCalcLevel]);
  const sessionCombo = useMemo(() => xpToRequiredComboScore(sessionXP, calcXPMultiplier, vip), [sessionXP, calcXPMultiplier, vip]);
  const runsNeeded = useMemo(() => (averageCombo > 0 ? Math.ceil(sessionCombo / averageCombo) : 0), [sessionCombo, averageCombo]);
  const betweenXP = useMemo(() => xpRequiredBetweenLevels(startCalcLevel, endCalcLevel), [startCalcLevel, endCalcLevel]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(saveKey);
      if (!raw) {
        setLoaded(true);
        return;
      }

      const saved = JSON.parse(raw) as SavedValues;
      if (typeof saved.level === 'number') setLevel(saved.level);
      if (typeof saved.multiplier === 'number') setMultiplier(saved.multiplier);
      if (typeof saved.vip === 'boolean') setVip(saved.vip);
      if (typeof saved.targetLevel === 'number') setTargetLevel(saved.targetLevel);
      if (typeof saved.sessionTargetLevel === 'number') setSessionTargetLevel(saved.sessionTargetLevel);
      if (typeof saved.averageCombo === 'number') setAverageCombo(saved.averageCombo);
      if (typeof saved.startLevel === 'number') setStartLevel(saved.startLevel);
      if (typeof saved.endLevel === 'number') setEndLevel(saved.endLevel);
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
