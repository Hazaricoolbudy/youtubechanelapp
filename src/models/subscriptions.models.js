import mongoose, { Schema } from "mongoose";
const subscriptionScheme = new Schema(
  {
    channel: {
      type: Schema.Types.ObjectId, //on whom user suscribe
      ref: "User",
    },
    subscriber: {
      type: Schema.Types.ObjectId, //one who is suscribing
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);
export const Subscription = mongoose.model("Subscription", subscriptionScheme);
