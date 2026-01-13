const bcrypt = require('bcrypt');

exports.hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

exports.comparePassword = async (entered, hashed) => {
  return await bcrypt.compare(entered, hashed);
};
