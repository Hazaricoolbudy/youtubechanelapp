import mongoose, { Mongoose, Schema } from "mongoose";

const playlistSchema = new Schema(
  {
    video: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "Uaer",
    },
  },
  { timestamps: true }
);

export const pLAYLIST = mongoose.model("Playlist", playlistSchema);
