const mongoose = require("mongoose");
const SubscriptionPlan = require("../../models/subscriptionPlan.model");

// 1GB in bytes
const ONE_GB = 1024 * 1024 * 1024;

const subscriptionPlans = [
  {
    name: "starter",
    displayName: "Starter",
    description:
      "Perfect for small teams getting started. Includes essential features for basic employee and project management.",
    monthlyPrice: 0,
    annualPrice: 0,
    currency: "usd",
    limits: {
      maxUsers: 10,
      maxProjects: 3,
      maxStorageBytes: ONE_GB, // 1GB
    },
    features: ["basic_grievance"],
    stripePriceIds: {
      monthly: null,
      annual: null,
    },
    isActive: true,
    sortOrder: 1,
  },
  {
    name: "professional",
    displayName: "Professional",
    description:
      "Ideal for growing teams. Unlock advanced permissions, audit logs, and API access with increased limits.",
    monthlyPrice: 2900, // $29.00 in cents
    annualPrice: 28800, // $288.00 in cents (~17% discount from $348/yr)
    currency: "usd",
    limits: {
      maxUsers: 50,
      maxProjects: -1, // unlimited
      maxStorageBytes: 10 * ONE_GB, // 10GB
    },
    features: [
      "basic_grievance",
      "advanced_permissions",
      "custom_roles",
      "audit_logs",
      "api_access",
    ],
    stripePriceIds: {
      monthly: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || null,
      annual: process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID || null,
    },
    isActive: true,
    sortOrder: 2,
  },
  {
    name: "enterprise",
    displayName: "Enterprise",
    description:
      "For large organizations requiring unlimited resources, SSO, custom integrations, and dedicated support with SLA guarantees.",
    monthlyPrice: 0, // Custom pricing - contact sales
    annualPrice: 0, // Custom pricing - contact sales
    currency: "usd",
    limits: {
      maxUsers: -1, // unlimited
      maxProjects: -1, // unlimited
      maxStorageBytes: -1, // unlimited
    },
    features: [
      "basic_grievance",
      "advanced_permissions",
      "custom_roles",
      "audit_logs",
      "api_access",
      "sso",
      "custom_integrations",
      "priority_support",
      "dedicated_support",
      "sla_guarantee",
      "on_premise",
    ],
    stripePriceIds: {
      monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || null,
      annual: process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || null,
    },
    isActive: true,
    sortOrder: 3,
  },
];

/**
 * Seeds the subscription plans into the database.
 * Uses upsert to update existing plans or create new ones.
 * @returns {Promise<{created: number, updated: number}>} Count of created and updated plans
 */
async function seedSubscriptionPlans() {
  let created = 0;
  let updated = 0;

  for (const planData of subscriptionPlans) {
    const existingPlan = await SubscriptionPlan.findOne({ name: planData.name });

    if (existingPlan) {
      await SubscriptionPlan.updateOne({ name: planData.name }, { $set: planData });
      updated++;
      console.log(`Updated subscription plan: ${planData.displayName}`);
    } else {
      await SubscriptionPlan.create(planData);
      created++;
      console.log(`Created subscription plan: ${planData.displayName}`);
    }
  }

  return { created, updated };
}

/**
 * Removes all subscription plans from the database.
 * Use with caution - this will delete all plan data.
 * @returns {Promise<number>} Count of deleted plans
 */
async function clearSubscriptionPlans() {
  const result = await SubscriptionPlan.deleteMany({});
  console.log(`Deleted ${result.deletedCount} subscription plans`);
  return result.deletedCount;
}

/**
 * Gets the plan data array for testing or reference.
 * @returns {Array} Array of subscription plan objects
 */
function getSubscriptionPlansData() {
  return subscriptionPlans;
}

// Run seed if executed directly
if (require.main === module) {
  require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

  const connectDB = require("../db");

  (async () => {
    try {
      await connectDB();
      console.log("Starting subscription plans seed...");

      const result = await seedSubscriptionPlans();

      console.log(`\nSeed completed:`);
      console.log(`  - Created: ${result.created} plans`);
      console.log(`  - Updated: ${result.updated} plans`);

      process.exit(0);
    } catch (error) {
      console.error("Seed failed:", error);
      process.exit(1);
    }
  })();
}

module.exports = {
  seedSubscriptionPlans,
  clearSubscriptionPlans,
  getSubscriptionPlansData,
  subscriptionPlans,
};
