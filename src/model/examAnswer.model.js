import mongoose from "mongoose";

export const examAnswerSchema = new mongoose.Schema(
  {
    eligibilityRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "eligibilityRequest",
    },
    appliedBy: {
      type: String,
      ref: "employees",
    },
    startTime: {
      type: Date,
      default: null,
    },
    examEntryDeadline: {
      type: Date,
      default: null,
    },

    endTime: {
      type: Date,
      default: null,
    },
    marksObtained: {
      type: Number,
      default: 0,
    },
    durationInMinutes: {
      type: Number,
      default: null,
      // required: true,
    },
    passingMarks: {
      type: Number,
      default: 80,
    },
    autoSubmitted: {
      type: Boolean,
      default: false,
    },
    passed: {
      type: Boolean,
      default: false,
    },

    attempt: {
      type: Number,
      default: null,
    },

    pdf: {
      type: String,
      default: null,
    },
    attemptType: {
      type: String,
      default: null,
    },
    questions: [
      {
        title: { type: String },
        questionText: { type: String },
        options: { type: [String] },
        correctAnswer: { type: String },
        selectedAnswer: { type: String, default: null },
        marks: { type: Number },
        marksObtained: { type: Number, default: 0 },
      },
    ],
    recording: {
      type: String,
      default: null,
    },
    timeTaken: {
      type: Number,
      default: null,
    },
    score: {
      type: Number,
      default: null,
    },
    examTitle: {
      type: String,
      default: null,
    },

    timeline: [
      {
        screenshot: { type: String, default: null },
        selfie: { type: String, default: null },
        date: { type: Date, default: null },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const examAnswerModel = mongoose.model(
  "examAnswer",
  examAnswerSchema,
  "examAnswer"
);

export default examAnswerModel;
