import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
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
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //steps:-
  //01 get user details from frontend
  //02 validation not enpty
  //03 check if user already exists: username, email
  //04 check for image check for avtar
  //05 uploade them to cloudinary, avatar
  //06 create user object - create entry in db
  //07 remove password and refresh token field from response
  //08 check for user creation
  //09 return res

  //01 get user details from frontend
  const { fullName, email, username, password } = req.body;
  // console.log("emial", email);

  //02 validation not enpty

  /*
  this is a one way to access but there are many fiels :-
  if (fullName === "") {
    throw new ApiError (400, "fullname is required")
  }
  */
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all field are required");
  }

  //03 check if user already exists: username, email
  const existUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existUser) {
    throw new ApiError(409, "User With email or password exist");
  }

  //04 check for image check for avtar

  const avatarLocalPath = req.files?.avatar[0]?.path;

  //in case user not sent coverImage to how ho handle
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  //this method used

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  //05 uploade them to cloudinary, avatar

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw ApiError(400, "Avatar is required");
  }

  //06 create user object - create entry in db

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  //07 remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //08 check for user creation

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  //09 return res

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //steps:-
  //req - body-data
  //username or password
  //find the user in db
  //password check
  //access and refresh token
  //send cookies
  const { email, password, username } = req.body;

  if (!(email || username)) {
    throw new ApiError(400, "username or email is required");
  }

  // if (!email && !username) {
  //   throw new ApiError(400, "username or email is required");
  // }

  const user = await User.findOne({
    $or: [{ email }, { password }],
  });
  if (!user) {
    throw new ApiError(404, "User is not exist");
  }

  const isPassword = await user.isPasswordCorrect(password);
  if (!isPassword) {
    throw new ApiError(401, "password invalid");
  }
  const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  console.log(loggedInUser);
  //send cookies or secured
  const option = {
    // why is used because it not used httpOnly or secure then fronend not modified but this time only server modified
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user loging successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const option = {
    httpOnly: true,
    secure: true,
  };
  //clear cookies
  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "User logout Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorised request");
  }

  //incoming token to decoded token

  try {
    const decodedToken = jwt.variry(
      refreshAccessToken,
      process.env.REFRESH_TOKEN_SYSTEM
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalide refresh token");
    }

    //compare incomingRefreshToken and refresh token then after used

    if (incomingRefreshToken !== user) {
      throw new ApiError(401, "Refresh token is expire or used");
    }

    const option = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", newRefreshToken, option)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refresh"
        )
      );
  } catch (error) {
    throw new ApiError(401, error.message || "Invalide refrensh token Message");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }
  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
  .status(200)
  .json(200, req.user, "current user fetched successfully")
});

const uptateAccountDetails = asyncHandler(async(req,res)=>{
  const {fullName, email} = req.body
  if(!(fullName || email)){
    throw new ApiError(400, "All field Are required")
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email
      }
    },
    {new:true}

  ).select("-password")

  return res 
   .status(200)
   .json(new ApiResponse (200, user, "Account details updates successfully"))
});
//file update 

const updateUserAvater = asyncHandler(async(req,res)=>{
  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file missing")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  if(avatar.url){
    throw new ApiError(400,"Error while uploading on avatar")
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        avatar: avatar.url
      }
    }
  )
  return res
  .status(200)
  .json(200, user, "Avatar succusfully uplode")
})
const updateUserCoverImage = asyncHandler(async(req,res)=>{
  const updateCoverImage = req.file?.path

  if(!updateCoverImage){
    throw new ApiError(400,"coverImage file is missing")
  }
  const coverImage = await uploadOnCloudinary(updateCoverImage)
  if(!coverImage.url){
    throw new ApiError(400,"Error while uploading on Cover Image")
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        coverImage: coverImage.url
      }
    }
  )
  return res
  .status(200)
  .json(200, user, "Cover Image succesfully  is Uploaded")
})
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  uptateAccountDetails,
  updateUserAvater,
  updateUserCoverImage,

};
