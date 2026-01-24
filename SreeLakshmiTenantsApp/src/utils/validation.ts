export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateAadharNumber = (aadhar: string): boolean => {
  const aadharRegex = /^\d{12}$/;
  return aadharRegex.test(aadhar.replace(/\s/g, ''));
};

export const validatePAN = (pan: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
};

export const isRequired = (value: any): boolean | string => {
  return value ? true : 'This field is required';
};

export const minLength = (min: number) => (value: string): boolean | string => {
  return value.length >= min ? true : `Minimum ${min} characters required`;
};
