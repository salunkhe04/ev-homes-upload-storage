import mongoose from "mongoose";

export const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    durationInMinutes: {
      type: Number,
      default: null,
      // required: true,
    },
    date: {
      type: Date,
      default: null,
    },
    totalMarks: {
      type: Number,
      // required: true,
    },
    passingMarks: {
      type: Number,
    },
    // gainedMarks: {
    //   type: Number,
    //   deafult: null,
    // },
    questions: [
      {
        title: {
          type: String,
          default: null,
        },
        questionText: { type: String, required: true },
        options: { type: [String], required: true },
        correctAnswer: { type: String, required: true },
        marks: { type: Number, default: 1 },
      },
    ],

    // generalEvaluation: [
    //   {
    //     questionText: { type: String, required: true },
    //     answer: { type: String },
    //     marks: { type: Number },
    //   },
    // ],
    // assignTo: {
    //   type: String,
    //   ref: "employees",
    // },
  },
  {
    timestamps: true,
  }
);

const examModel = mongoose.model("exam", examSchema, "exam");
export default examModel;
