const { DataTypes, Model } = require("sequelize");
const bcrypt = require("bcryptjs");   // switched from bcrypt to bcryptjs
const sequelize = require("../config/db");

// Extend Sequelize's Model class
class Admin extends Model {
  async comparePassword(password) {
    return bcrypt.compare(password, this.password); // bcryptjs has same API
  }
}

Admin.init(
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize, // Pass sequelize instance
    modelName: "Admin",
    tableName: "admins", // optional, but recommended
    timestamps: true, // adds createdAt & updatedAt
    hooks: {
      beforeCreate: async (admin) => {
        admin.password = await bcrypt.hash(admin.password, 10); // same API
      },
      beforeUpdate: async (admin) => {
        if (admin.changed("password")) {
          admin.password = await bcrypt.hash(admin.password, 10);
        }
      },
    },
  }
);

module.exports = Admin;
