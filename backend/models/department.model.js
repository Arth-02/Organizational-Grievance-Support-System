const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required']
  },
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Department description is required'],
    trim: true
  },
  is_active: {
    type: Boolean,
    default: true
  }
},{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  versionKey: false
});

departmentSchema.index({ organization_id: 1, name: 1 }, { unique: true });

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;