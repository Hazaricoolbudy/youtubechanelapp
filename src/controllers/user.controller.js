import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudnary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const genrateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access or refresh token"
    );
  }
};
const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  //validation is not empty
  // check if user is already exist username or email
  //check for image/ check for avatar
  //upload to the cloudnairy avatar
  //create user object-create entry in db
  // remove the password and refresh token from response
  // chec for the user creation
  // return res
  const { fullname, email, username, password } = req.body;
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field are required");
  }
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  console.log(existingUser);
  if (existingUser) {
    throw new ApiError(
      400,
      "This email or username already taken try with some anoterone"
    );
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  console.log(avatarLocalPath);
  // const coverImageLocalpath = req.files?.coverimage[0]?.path;
  if (!avatarLocalPath) throw new ApiError(409, "Avatar is required");

  const avatar = await uploadOnCloudnary(avatarLocalPath);
  let coverImageLocalpath;
  if (
    req.files &&
    Array.isArray(req.files.coverimage) &&
    req.files.coverimage.length > 0
  ) {
    coverImageLocalpath = req.files.coverimage[0].path;
  }
  const cover = await uploadOnCloudnary(coverImageLocalpath);
  if (!avatar) throw new ApiError(409, "Avatar is required");
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverimage: cover?.url || "",
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    password,
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Somethings went wrong while creating the user");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //req-body->data;
  //username or email
  // check user or email is exists
  //validate password
  //generate accessoken or refresh token
  // send it as cookie
  const { email, username, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "Username or Email is required for login");
  }
  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    throw new ApiError(
      400,
      "Wrong credential try with your resister email or username"
    );
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid  credential ");
  }
  const { accessToken, refreshToken } = await genrateAccessAndRefreshToken(
    user._id
  );
  const logedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        201,
        { user: logedInUser, accessToken, refreshToken },
        "Login Successfully"
      )
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    { new: true }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "logout sucessfully"));
});

const accessRefreshToken = asyncHandler(async (req, res) => {
  const incomingRefeshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefeshToken) {
    throw new ApiError(401, "unauthorize invalid credential");
  }
  const decodedToken = jwt.verify(
    incomingRefeshToken,
    process.env.REFRESH_TOKEN
  );
  const user = await User.findById(decodedToken?._id);
  if (!user) {
    throw new ApiError(401, " invalid refresh token");
  }
  if (incomingRefeshToken !== user?.refreshToken) {
    throw new ApiError(401, "unauthorized credential");
  }
  const { accessToken, newrefreshToken } = await generateAccessToken(user?._id);
  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .cookie("refreshToken", newrefreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        201,
        { accessToken, refreshToken: newrefreshToken },
        "AccessToken refreshed"
      )
    );
});
const changeUserCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = User.findById(req.user._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "you enter wrong password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Your password is changed successfully"));
});
const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(200, req.user, "Current user fetch successfully");
});
const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new ApiError(401, "Enter your email or fullname ");
  }
  const user = await User.findByIdAndUpdate(
    req.body._id,
    { $set: { fullname, email } },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "Name or email changed successfully"));
});
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Please Select your avatar to change");
  }
  const avatar = uploadOnCloudnary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(500, "Error during file uploading");
  }
  const updateduser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { avatar: avatar.url },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { data: updateduser },
        "userAvatar updated Successfully"
      )
    );
});
const upDateCoverImage = asyncHandler(async (req, res) => {
  const coverLocalPath = req.file?.path;
  if (!coverLocalPath) {
    throw new ApiError(400, "Please Select your avatar to change");
  }
  const coverimage = uploadOnCloudnary(coverLocalPath);
  if (!avatar.url) {
    throw new ApiError(500, "Error during file uploading");
  }
  const updateduser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { coverimage: coverimage.url },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { data: updateduser },
        "userAvatar updated Successfully"
      )
    );
});
const getUserChanelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "chanel is not exits");
  }
  const channel = await User.aggregate([
    { $match: { username: username?.toLowerCase() } },
    {
      $lookup: {
        from: "Subscription",
        localField: "_id",
        forignField: "channel",
        as: "suscriber",
      },
    },
    {
      $lookup: {
        from: "Subscription",
        localField: "_id",
        forignField: "suscriber",
        as: "suscribedTo",
      },
    },
    {
      $addFields: {
        suscriberCount: { $size: "$suscriber" },
        suscribedToCount: { $size: "$suscribedTo" },
        isSuscribed: {
          $cond: {
            if: { $in: [req?.user?._id, "$suscriber.suscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        suscriberCount: 1,
        suscribedToCount: 1,
        isSuscribed: 1,
        avatar: 1,
        coverimage: 1,
      },
    },
  ]);
  if (!channel?.length) {
    return new ApiError(400, "Channel doesn't exists");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, { data: channel }, "channel is fetch successfully")
    );
});
const watchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(req.user._id) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        forignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              forignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullname: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "uour watch is fetched successfully"
      )
    );
});
export {
  registerUser,
  loginUser,
  logoutUser,
  accessRefreshToken,
  getCurrentUser,
  changeUserCurrentPassword,
  updateUserDetails,
  updateUserAvatar,
  getUserChanelProfile,
  watchHistory,
  upDateCoverImage,
};
