import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudnary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
  if (!username || !email) {
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
const logoutUser = asyncHandler(async (req, res) => {});

export { registerUser, loginUser };
