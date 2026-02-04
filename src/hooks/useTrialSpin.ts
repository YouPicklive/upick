import { useState, useEffect, useCallback } from 'react';

const TRIAL_SPIN_KEY = 'youpick_trial_spin_used';

export function useTrialSpin() {
  const [hasUsedTrial, setHasUsedTrial] = useState(() => {
    return localStorage.getItem(TRIAL_SPIN_KEY) === 'true';
  });

  useEffect(() => {
    const stored = localStorage.getItem(TRIAL_SPIN_KEY) === 'true';
    setHasUsedTrial(stored);
  }, []);

  const useTrialSpin = useCallback(() => {
    localStorage.setItem(TRIAL_SPIN_KEY, 'true');
    setHasUsedTrial(true);
  }, []);

  const canUseTrial = !hasUsedTrial;

  return {
    hasUsedTrial,
    canUseTrial,
    useTrialSpin,
  };
}
