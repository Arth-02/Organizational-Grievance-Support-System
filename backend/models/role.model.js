const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  permissions: {
    type: [Number],
    required: true,
  }
});

module.exports = mongoose.model('Role', RoleSchema);