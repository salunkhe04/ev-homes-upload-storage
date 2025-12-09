import mongoose from "mongoose";

export const whatsappTemplateSchema = new mongoose.Schema(
  {
    projects: {
      type: String,
      default: null,
      ref: "ourProjects",
    },
    message: {
      type: String,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    templateName:{
      type:String,
      default:null,
    },
  },
  { timestamps: true }
);

// Create the model
const whatsappTemplateModel = mongoose.model("whatsappTemplate", whatsappTemplateSchema, "whatsappTemplate");
export default whatsappTemplateModel;