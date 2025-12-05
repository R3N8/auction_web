import { load, save } from "../utils/storage";

// Ensure a user has a credits record; if not, initialize with default credits
export function ensureCreditsForUser(userIdentifier: string) {
  const creditsKey = `credits:${userIdentifier}`;
  let credits = load(creditsKey);
  if (credits === null) {
    credits = 1000; // Default starting credits
    save(creditsKey, credits);
  }
  return credits;
}

// Get the current credits for a user
export function getCredits(userIdentifier: string) {
  return load(`credits:${userIdentifier}`) || 0;
}

// Add credits to a user's account and return the new total
export function addCredits(userIdentifier: string, amount: number) {
  const creditsKey = `credits:${userIdentifier}`;
  const currentCredits = getCredits(userIdentifier);
  const nextCredits = currentCredits + amount;
  save(creditsKey, nextCredits);
  return nextCredits;
}

// Subtract credits (w/ safety check)
export function subtractCredits(userIdentifier: string, amount: number) {
  const creditsKey = `credits:${userIdentifier}`;
  const currentCredits = getCredits(userIdentifier);

  if (currentCredits < amount) {
    throw new Error("Not enough credits");
  }

  const nextCredits = currentCredits - amount;
  save(creditsKey, nextCredits);
  return nextCredits;
}
