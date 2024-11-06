const LexoRank = require("../services/lexorank.service");

async function updateModelRanks({
  model,
  orderBy = 'createdAt',
  rankField = 'rank',
  query = {},
  batchSize = 1000
}) {
  const session = await model.db.startSession();

  try {
    await session.startTransaction();

    // Count documents needing ranks
    const total = await model.countDocuments({
      ...query,
      [rankField]: { $exists: false }
    }).session(session);

    console.log(`Found ${total} documents needing ranks`);

    let processed = 0;
    let lastRank = null;

    while (processed < total) {
      // Get batch of unranked documents
      const batch = await model
        .find({
          ...query,
          [rankField]: { $exists: false }
        })
        .sort({ [orderBy]: 1 })
        .limit(batchSize)
        .session(session);

      // If this is the first batch, get the last existing rank
      if (!lastRank) {
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
      }

      // Process each document in the batch
      const updateOperations = batch.map((doc) => {
        const newRank = lastRank
          ? LexoRank.generateNearestRank(lastRank, 'after')
          : LexoRank.getInitialRank();
        
        lastRank = newRank;

        return {
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { [rankField]: newRank } }
          }
        };
      });

      // Bulk update the batch
      if (updateOperations.length > 0) {
        await model.bulkWrite(updateOperations, { session });
      }

      processed += batch.length;
      console.log(`Processed ${processed} of ${total} documents`);
    }

    await session.commitTransaction();
    
    return {
      success: true,
      totalProcessed: processed,
      message: `Successfully updated ranks for ${processed} documents`
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
  query = {},
  batchSize = 1000
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
      query,
      batchSize
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