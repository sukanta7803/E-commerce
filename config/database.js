const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect("mongodb+srv://setudeyindia_db_user:qtgBf9fR8qcRNEMO@cluster0.2o3lpsk.mongodb.net/shopping-website");
    console.log(`MongoDB Connected.... `);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;