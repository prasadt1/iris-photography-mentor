const ONBOARDING_KEY = 'practice_companion_onboarding_done';

export function isOnboardingComplete(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function setOnboardingComplete(): void {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

export function clearOnboardingComplete(): void {
  localStorage.removeItem(ONBOARDING_KEY);
}
