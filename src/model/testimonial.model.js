import mongoose from "mongoose";

const comment = {
  message: { type: String, required: true },
  role: { type: String, required: true },
  isLiked: { type: Boolean, default: null },
  likes: { type: Boolean, default: 0 },
  date: { type: Date, default: Date.now },
  client: { type: String, default: null, ref: "clients" },
  channelPartner: { type: String, default: null, ref: "channelPartners" },
  employee: { type: String, default: null, ref: "employees" },
};
const commentSchema = new mongoose.Schema(
  {
    ...comment,
    replies: [comment],
  },
  { timestamps: true }
);

export const testimonialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    like: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    dislike: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    videoUrl: {
      type: String,
      default: null,
    },
    thumbnail: { type: String, default: null },
    shareLink: { type: String, default: null },
    // new project var
    project: {
      type: String,
      ref: "ourProjects",
    },
    likes: [
      {
        // like / dislike
        type: { type: String, required: true },
        role: { type: String, required: true },
        client: { type: String, default: null, ref: "clients" },
        channelPartner: { type: String, default: null, ref: "channelPartners" },
        employee: { type: String, default: null, ref: "employees" },
      },
    ],
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

// Create the model
const testimonialModel = mongoose.model(
  "Testimonial",
  testimonialSchema,
  "testimonial"
);
export default testimonialModel;
