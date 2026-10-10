export interface ManagerCredentials {
  email: string;
  phone: string;
  password: string;
  name: string;
  role: string;
}

/**
 * Predefined manager credentials for H H Events & Conventions.
 * SINGLE SOURCE OF TRUTH.
 * NOT displayed anywhere in the UI, NOT exposed on public pages.
 */
export const MANAGER_CREDENTIALS: ManagerCredentials = {
  email: 'hheventsconvention@gmail.com',
  phone: '9448133378',
  password: 'HHEvents@Manager2026',
  name: 'Venue General Manager',
  role: 'venue_manager',
};

// Backwards compatibility alias
export const AUTHORIZED_MANAGER = MANAGER_CREDENTIALS;

/**
 * Normalizes phone numbers by stripping non-digits and resolving standard 10-digit formats.
 * Handles '+91', spaces, hyphens, and leading zeros.
 */
export function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.trim().replace(/\D/g, '');
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Validates manager credentials against MANAGER_CREDENTIALS.
 * - Email: trim whitespace and compare case-insensitively.
 * - Phone: trim whitespace and safely normalize harmless formatting (+91, 0, spaces, hyphens).
 * - Password: trim accidental whitespace only, compare case-sensitively.
 */
export function validateCredentials(
  enteredEmail: string,
  enteredPhone: string,
  enteredPassword: string
): boolean {
  if (!enteredEmail || !enteredPhone || !enteredPassword) return false;

  const cleanEmail = enteredEmail.trim().toLowerCase();
  const targetEmail = MANAGER_CREDENTIALS.email.trim().toLowerCase();

  const cleanPhone = normalizePhone(enteredPhone);
  const targetPhone = normalizePhone(MANAGER_CREDENTIALS.phone);

  const cleanPassword = enteredPassword.trim();
  const targetPassword = MANAGER_CREDENTIALS.password.trim();

  const emailMatch = cleanEmail === targetEmail;
  const phoneMatch =
    cleanPhone === targetPhone ||
    (cleanPhone.length >= 10 && cleanPhone.endsWith(targetPhone)) ||
    (targetPhone.length >= 10 && targetPhone.endsWith(cleanPhone));
  const passwordMatch = cleanPassword === targetPassword;

  return emailMatch && phoneMatch && passwordMatch;
}
