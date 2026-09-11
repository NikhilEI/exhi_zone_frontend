// Shared across all 7 mandatory-form pages: turns the `lockedFields` array
// a form's GET response returns into an `isLocked(key)` check. Admin
// editing mode (?profileId=...) is never locked out of anything — the
// backend enforces the same rule (see isAdminOverride), this just mirrors
// it so the UI doesn't grey out fields an admin is allowed to edit.
export function makeIsLocked(profileId: number | null, lockedFields: string[]) {
  return function isLocked(field: string) {
    return !profileId && lockedFields.includes(field);
  };
}
