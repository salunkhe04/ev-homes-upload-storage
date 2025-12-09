import mongoose from "mongoose";
import { type } from "os";

export const eventSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
      },
    startDate: {
        type: Date,
        required: true,
      },
      validTill: {
        type: Date,
        default: null,
      },
      event:{
        type:String,
        default:null,
      },
      remark:{
        type:String,
        default:null,
      }

});

// Create the model
const eventModel = mongoose.model("event", eventSchema, "event");
export default eventModel;