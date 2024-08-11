const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const OrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Organization address is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Organization phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Organization email is required"],
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Organization description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [500, "Description must be at most 500 characters long"],
    },
    city: {
      type: String,
      required: [true, "Organization city is required"],
      trim: [true, "Organization city is required"],
    },
    state: {
      type: String,
      required: [true, "Organization state is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Organization country is required"],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, "Organization pincode is required"],
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_approved: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    versionKey: false,
  }
);

OrganizationSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

OrganizationSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

OrganizationSchema.index({ email: 1, username: 1 }, { unique: true });

const Organization = mongoose.model("Organization", OrganizationSchema);

module.exports = Organization;
