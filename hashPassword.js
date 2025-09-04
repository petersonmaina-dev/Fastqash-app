// hashPassword.js
import bcrypt from 'bcryptjs';

// Step 1: choose your admin password
const password = 'PETERson@123';  // You can replace this with your preferred password

// Step 2: generate salt (adds security)
const salt = bcrypt.genSaltSync(10);

// Step 3: create hashed password
const hashedPassword = bcrypt.hashSync(password, salt);

// Step 4: print it
console.log(hashedPassword);
