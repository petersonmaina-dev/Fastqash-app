const sequelize = require('./config/db'); // your sequelize instance
const Admin = require('./models/Admin');

async function createAdmin() {
  try {
    // Ensure all models are synced with the DB
    await sequelize.sync();

    const [admin, created] = await Admin.findOrCreate({
      where: { username: 'Maina' },
      defaults: { password: 'PETERson@123' },
    });

    if (created) {
      console.log('✅ Admin user created:', admin.username);
    } else {
      console.log('ℹ️ Admin user already exists:', admin.username);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin user:', err);
    process.exit(1);
  }
}

createAdmin();
