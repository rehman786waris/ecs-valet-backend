const validationPatterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[1-9]\d{7,14}$/,
    password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
  };
  
  const validationMessages = {
    required: field => `${field} is required`,
    minLength: (field, len) => `${field} must be at least ${len} characters long`,
    email: 'Please enter a valid email address',
    phone: 'Please enter a valid phone number (e.g., +923001234567)',
    password: 'Password must contain letters and numbers (min 8 chars)',
  };
  
  module.exports = {
    validationPatterns,
    validationMessages,
  };
  