export interface Country {
  name: string;
  code: string;
  dialCode: string;
  /** Expected length of the national number, digits only (no dial code). */
  phoneLength: { min: number; max: number };
}

const DEFAULT_PHONE_LENGTH = { min: 7, max: 12 };

export const countries: Country[] = [
  { name: "India", code: "IN", dialCode: "+91", phoneLength: { min: 10, max: 10 } },
  { name: "United States", code: "US", dialCode: "+1", phoneLength: { min: 10, max: 10 } },
  { name: "United Kingdom", code: "GB", dialCode: "+44", phoneLength: { min: 10, max: 10 } },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971", phoneLength: { min: 9, max: 9 } },
  { name: "Singapore", code: "SG", dialCode: "+65", phoneLength: { min: 8, max: 8 } },
  { name: "Australia", code: "AU", dialCode: "+61", phoneLength: { min: 9, max: 9 } },
  { name: "Canada", code: "CA", dialCode: "+1", phoneLength: { min: 10, max: 10 } },
  { name: "Germany", code: "DE", dialCode: "+49", phoneLength: { min: 10, max: 11 } },
  { name: "France", code: "FR", dialCode: "+33", phoneLength: { min: 9, max: 9 } },
  { name: "Japan", code: "JP", dialCode: "+81", phoneLength: { min: 10, max: 10 } },
  { name: "China", code: "CN", dialCode: "+86", phoneLength: { min: 11, max: 11 } },
  { name: "Afghanistan", code: "AF", dialCode: "+93", phoneLength: DEFAULT_PHONE_LENGTH },
  { name: "Bahrain", code: "BH", dialCode: "+973", phoneLength: { min: 8, max: 8 } },
  { name: "Bangladesh", code: "BD", dialCode: "+880", phoneLength: { min: 10, max: 10 } },
  { name: "Belgium", code: "BE", dialCode: "+32", phoneLength: { min: 9, max: 9 } },
  { name: "Bhutan", code: "BT", dialCode: "+975", phoneLength: { min: 8, max: 8 } },
  { name: "Brazil", code: "BR", dialCode: "+55", phoneLength: { min: 10, max: 11 } },
  { name: "Cambodia", code: "KH", dialCode: "+855", phoneLength: DEFAULT_PHONE_LENGTH },
  { name: "Denmark", code: "DK", dialCode: "+45", phoneLength: { min: 8, max: 8 } },
  { name: "Egypt", code: "EG", dialCode: "+20", phoneLength: { min: 10, max: 10 } },
  { name: "Finland", code: "FI", dialCode: "+358", phoneLength: { min: 9, max: 10 } },
  { name: "Hong Kong", code: "HK", dialCode: "+852", phoneLength: { min: 8, max: 8 } },
  { name: "Indonesia", code: "ID", dialCode: "+62", phoneLength: { min: 9, max: 12 } },
  { name: "Ireland", code: "IE", dialCode: "+353", phoneLength: { min: 9, max: 9 } },
  { name: "Israel", code: "IL", dialCode: "+972", phoneLength: { min: 9, max: 9 } },
  { name: "Italy", code: "IT", dialCode: "+39", phoneLength: { min: 9, max: 10 } },
  { name: "Kenya", code: "KE", dialCode: "+254", phoneLength: { min: 9, max: 9 } },
  { name: "Kuwait", code: "KW", dialCode: "+965", phoneLength: { min: 8, max: 8 } },
  { name: "Malaysia", code: "MY", dialCode: "+60", phoneLength: { min: 9, max: 10 } },
  { name: "Maldives", code: "MV", dialCode: "+960", phoneLength: { min: 7, max: 7 } },
  { name: "Mauritius", code: "MU", dialCode: "+230", phoneLength: { min: 7, max: 8 } },
  { name: "Nepal", code: "NP", dialCode: "+977", phoneLength: { min: 10, max: 10 } },
  { name: "Netherlands", code: "NL", dialCode: "+31", phoneLength: { min: 9, max: 9 } },
  { name: "New Zealand", code: "NZ", dialCode: "+64", phoneLength: { min: 8, max: 10 } },
  { name: "Nigeria", code: "NG", dialCode: "+234", phoneLength: { min: 10, max: 10 } },
  { name: "Norway", code: "NO", dialCode: "+47", phoneLength: { min: 8, max: 8 } },
  { name: "Oman", code: "OM", dialCode: "+968", phoneLength: { min: 8, max: 8 } },
  { name: "Pakistan", code: "PK", dialCode: "+92", phoneLength: { min: 10, max: 10 } },
  { name: "Philippines", code: "PH", dialCode: "+63", phoneLength: { min: 10, max: 10 } },
  { name: "Poland", code: "PL", dialCode: "+48", phoneLength: { min: 9, max: 9 } },
  { name: "Portugal", code: "PT", dialCode: "+351", phoneLength: { min: 9, max: 9 } },
  { name: "Qatar", code: "QA", dialCode: "+974", phoneLength: { min: 8, max: 8 } },
  { name: "Russia", code: "RU", dialCode: "+7", phoneLength: { min: 10, max: 10 } },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966", phoneLength: { min: 9, max: 9 } },
  { name: "South Africa", code: "ZA", dialCode: "+27", phoneLength: { min: 9, max: 9 } },
  { name: "South Korea", code: "KR", dialCode: "+82", phoneLength: { min: 9, max: 10 } },
  { name: "Spain", code: "ES", dialCode: "+34", phoneLength: { min: 9, max: 9 } },
  { name: "Sri Lanka", code: "LK", dialCode: "+94", phoneLength: { min: 9, max: 9 } },
  { name: "Sweden", code: "SE", dialCode: "+46", phoneLength: { min: 7, max: 9 } },
  { name: "Switzerland", code: "CH", dialCode: "+41", phoneLength: { min: 9, max: 9 } },
  { name: "Taiwan", code: "TW", dialCode: "+886", phoneLength: { min: 9, max: 9 } },
  { name: "Thailand", code: "TH", dialCode: "+66", phoneLength: { min: 9, max: 9 } },
  { name: "Turkey", code: "TR", dialCode: "+90", phoneLength: { min: 10, max: 10 } },
  { name: "Vietnam", code: "VN", dialCode: "+84", phoneLength: { min: 9, max: 10 } }
];

export function findCountry(name: string): Country | undefined {
  return countries.find((c) => c.name === name);
}
