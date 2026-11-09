// QCTO feedback 05.23: ONE South African ID number check for the whole domain — the File 3
// upload and the results capture screen use it now; learner registration and FISA uploads
// reuse it later. The format is 13 digits: YYMMDD (date of birth), SSSS (gender), C (citizen),
// A (legacy), Z (check digit, Luhn).
export const ID_LENGTH_MESSAGE = 'ID number must be 13 digits';
export const ID_DATE_MESSAGE = 'The date of birth in the ID number is not a real date';
export const ID_CHECK_DIGIT_MESSAGE = "The ID number's check digit is wrong";

function isRealBirthDate(yy: number, mm: number, dd: number): boolean {
  // The century is not in the number, so the date must be real in whichever century fits;
  // 2000 is a leap year, 1900 is not, so 29 February is accepted when either century allows it.
  return [1900 + yy, 2000 + yy].some((year) => {
    const date = new Date(Date.UTC(year, mm - 1, dd));
    return date.getUTCFullYear() === year && date.getUTCMonth() === mm - 1 && date.getUTCDate() === dd;
  });
}

function luhnIsValid(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

// Null when the ID number is valid, otherwise the first failing message.
export function saIdNumberIssue(idNumber: string): string | null {
  const value = idNumber.trim();
  if (!/^\d{13}$/.test(value)) return ID_LENGTH_MESSAGE;
  if (!isRealBirthDate(Number(value.slice(0, 2)), Number(value.slice(2, 4)), Number(value.slice(4, 6)))) return ID_DATE_MESSAGE;
  if (!luhnIsValid(value)) return ID_CHECK_DIGIT_MESSAGE;
  return null;
}

export function isValidSaIdNumber(idNumber: string): boolean {
  return saIdNumberIssue(idNumber) === null;
}
