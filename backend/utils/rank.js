const LexoRank = require("../services/lexorank.service");

async function updateModelRanks({
  model,
  orderBy = 'createdAt',
  rankField = 'rank',
  query = {}
}) {
  const session = await model.db.startSession();

  try {
    await session.startTransaction();

    // Find all documents needing ranks in a single operation
    const unrankedDocs = await model
      .find({
        ...query,
        [rankField]: { $exists: false }
      })
      .sort({ [orderBy]: 1 })
      .session(session);

    const total = unrankedDocs.length;
    console.log(`Found ${total} documents needing ranks`);

    let lastRank = null;

    // Fetch the last existing rank if available
    const lastRankedDoc = await model
      .findOne({
        ...query,
        [rankField]: { $exists: true }
      })
      .sort({ [rankField]: -1 })
      .session(session);

    if (lastRankedDoc) {
      lastRank = lastRankedDoc[rankField];
    }

    // Update each unranked document in sequence with unique incremental ranks
    const updateOperations = unrankedDocs.map((doc, index) => {
      const newRank = lastRank
        ? LexoRank.generateNextRank(lastRank)
        : LexoRank.getInitialRank();

      lastRank = newRank;

      return {
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { [rankField]: newRank } }
        }
      };
    });

    // Bulk update all unranked documents
    if (updateOperations.length > 0) {
      await model.bulkWrite(updateOperations, { session });
    }

    console.log(`Processed ${total} documents`);

    await session.commitTransaction();
    
    return {
      success: true,
      totalProcessed: total,
      message: `Successfully updated ranks for ${total} documents`
    };

  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating ranks:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  } finally {
    await session.endSession();
  }
}

async function resetAllRanks({
  model,
  orderBy = 'createdAt',
  rankField = 'rank',
  query = {}
}) {
  const session = await model.db.startSession();

  try {
    await session.startTransaction();

    // First, remove all existing ranks
    await model.updateMany(
      query,
      { $unset: { [rankField]: "" } },
      { session }
    );

    // Then generate new ranks for all documents
    const result = await updateModelRanks({
      model,
      orderBy,
      rankField,
      query
    });

    await session.commitTransaction();
    return result;

  } catch (error) {
    await session.abortTransaction();
    console.error('Error resetting ranks:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  } finally {
    await session.endSession();
  }
}

module.exports = {
  updateModelRanks,
  resetAllRanks
};
