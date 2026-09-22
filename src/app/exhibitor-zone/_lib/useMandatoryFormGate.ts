"use client";

export const EXHIBITOR_INFO_FORM_KEY = "exhibitor-information";

/**
 * Mandatory forms no longer gate each other — every form is accessible
 * regardless of Exhibitor Information's completion status.
 */
export function useMandatoryFormGate() {
  return true;
}
