import mongoose from "mongoose";
export const rankingsSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      default: null,
      ref: "employees",
    },
    rank: {
      type: Number,
      default: 0,
    },
    leadsShouldRecieve: {
      type: Number,
      default: 0, // (rank 1) - 3 -> 2 -> 1
    },
    leadsGiven: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    isMyTurn: {
      type: Boolean,
      default: false,
    },
    leads: [{ type: mongoose.Schema.Types.ObjectId, ref: "lead" }],
    visits: [{ type: mongoose.Schema.Types.ObjectId, ref: "siteVisits" }],
    bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "postSaleLead" }],
  },
  { timestamps: true }
);

export const rankingTurnSchema = new mongoose.Schema(
  {
    period: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unqiue: true,
      ref: "period",
    },
    startDate: { type: Date, required: true }, // Monday date (00:00)
    endDate: { type: Date, required: true }, // Sunday date (23:59:59)
    ranking: [rankingsSchema],
    timeline: [[rankingsSchema]],
  },
  { timestamps: true }
);

// Ensure unique week + period type
rankingTurnSchema.index({ period: 1, startDate: 1, endDate: 1 });

// const rankingTurnModel = mongoose.model("rankingTurnTest", rankingTurnSchema);
const rankingTurnModel = mongoose.model("rankingTurn", rankingTurnSchema);

export default rankingTurnModel;
