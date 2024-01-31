import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
  //steps:-
  //01 get user details from frontend
  const { fullName, email, username, password } = req.body;
  console.log("emial", email);

  //02 validation not enpty

  /*
  this is a one way to access but there are many fiels :-
  if (fullName === "") {
    throw new ApiError (400, "fullname is required")
  }
  */
  if(
    [fullName,email,username,password].some((field)=>field?.trim() === "")
    ){
      throw new ApiError(400, "all field are required")
    }


  //check if user already exists: username, email
const existUser = User.findOne({
  $or: [{username}, {email}]
})

if(existUser){
  throw new ApiError(409, "User With email or password exist")
}

const avatarLocalPath = req.files?.avatar[0]?.path;
const coverImageLocalPath = req.files?.coverImage[0]?.path;

  //check for image check for avtar

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is required")
  }
  //uploade them to cloudinary, avatar

  const avatar  = await uploadOnCloudinary(avatarLocalPath)
  const coverImage  = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw ApiError(400, "Avatar is required")
  }

  //create user object - create entry in db

  const user = await User.create({
    fullName,
    avatar:avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()

  })

  

  //remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )


  //check for user creation

  if(!createdUser){
    throw new ApiError(500, "Something went wrong while registering the user")
  }
  //return res

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
  )

});

export { registerUser };