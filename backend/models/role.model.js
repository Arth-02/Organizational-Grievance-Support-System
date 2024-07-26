const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  permission_id: {
    type: [Number],
    required: true,
  },
  default_permission_id: {
    type: [Number],
    required: true,
  }
});

module.exports = mongoose.model('Role', RoleSchema);