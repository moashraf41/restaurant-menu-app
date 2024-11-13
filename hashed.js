const bcrypt = require("bcryptjs");

const plainPassword = "ma412003"; // Replace with your desired password
bcrypt.hash(plainPassword, 10, (err, hashedPassword) => {
  if (err) throw err;
  console.log("Hashed password:", hashedPassword);
});
