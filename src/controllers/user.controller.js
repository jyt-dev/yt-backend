import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";



const registerUser = asyncHandler (async (req,res,next) => {
    // res.status(200).json(
    //     {message: "ok"}
    // )
    // recieve data from client 

    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res
    const {fullName, username, password, email} = req.body;
    console.log(fullName, email, username);

    // check for blank field and also trim 
    if([fullName, username, password, email].some((field) => field?.trim() === "")){
        throw new ApiError(400, "This field is required");
    }

    //check by either checking username or email
    const isUserExist = await User.findOne({
        $or: [{username: username},{email: email}]
    });

    if(isUserExist){
        throw new ApiError(409, "User alreday exists");
    }

    // getting local paths of images through multer 
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }
    // uploading images on cloudinary 
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar is required");
    }

    // creating fields in db
    const user = await User.create({
        username: username.toLowerCase(),
        fullName,
        email: email.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })
    // remove password and refreshToken from resp
    const UserCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!UserCreated){
        throw new ApiError(500, "Something went wrong on registring the user");
    }

    // now send resp to the user

    return res.status(201).json(
        new ApiResponse(200, UserCreated, "User registered successfully")
    )
    next();
})
const loginUser = asyncHandler (async (req,res) => {
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie
    const {email, username, password} = req.body;

    if(!(username || email) || !password){
        throw new ApiError(400, "username or email or password is required");
    }

    const user = await User.findOne({
        $or: [{username: username},{email: email}]
    });

    if(!user){
        throw new ApiError(404, "user doesn't exist");
    }

    const isPassValid = await user.isPasswordCorrect(password);

    if(!isPassValid){
        throw new ApiError(401, "Enter correct password")
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

     
    //Now save refresh token in db
    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave: false});

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly : true,
        secure : true
    }

    //sending accesstoken and refreshtoken through cookies to client
    return res
            .status(200)
            .cookie("accessToken" , accessToken, options)
            .cookie("RefreshToken", refreshToken, options)
            .json(new ApiResponse(200,
                 { userData : loggedInUser,
                 accessToken,
                 refreshToken},
                 "user logged in succesfully"));
})
const logoutUser = asyncHandler (async (req,res) => {
    // find user in db by using middleware req.user
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {refreshToken: 1}
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    
    // return resp by clearing cookies of tokens from client thus logging out
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out successfully"));
})

const refrAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized access");
    }
    const decodedToekn = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToekn?._id);

    if(!user){
        throw new ApiError(401, "Invalid refresh token")
    }

    if(incomingRefreshToken != user?.refreshToken){
        throw new ApiError(401, "Refresh token experied or reused")
    }

    const accessToken = await user.generateAccessToken();
    const newRefreshToken = await user.generateRefreshToken();

    user.refreshToken = newRefreshToken;
    await user.save({validateBeforeSave: false});

    const options = {
        httpOnly: true,
        secure: true
    }

    res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(new ApiResponse(200, {accessToken,newRefreshToken}));
})

const changeCurrPassword = asyncHandler(async(req,res) => {
    const{oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id)

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordValid){
        throw new ApiError(400, "Invalid old password");
    }

    if(!newPassword){
        throw new ApiError(400, "Bad request");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password is changed successfully"));
})

const getCurrUser = asyncHandler(async(req,res) => {
    return res
    .status(200)
    .json(200,req.user,"Current user fetched successfully"); 
})
const updateAccDetails = asyncHandler (async(req,res) => {

    const {fullName, email, username} = req.body;

    if(!(fullName || email || username)){
        throw new ApiError(400, "Fields can't be blank")
    }
    //return updated info of user from db 
    const user =  await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName, email, username
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Account updated successfully"))
})

const updateAvatar = asyncHandler(async(req,res) => {
   
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "missing file Avatar")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar")
    }

    const user =  User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { avatar: avatar.url}
        },
        {
            new: true
        }
    ).select("-password");

    return res
    .status(200)
    .json(200,"Avatar changed successfully")
    
})

const updateCoverImage = asyncHandler(async(req,res) => {
    
    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400, "cover image path missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url){
        throw new ApiError(400,"Error in uploading cover image");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            coverImage: coverImage.url
        },
        {
            new:true
        }
    ).select("-password");

    return res
    .status(200)
    .json(200, "Cover image changed successfully");
})

const getUserChannelProfile = asyncHandler(async(req,res) => {
    //get username from url
    const {username} = req.params;

    if(!username?.trim()){
        throw new apiError(400, "Failed to fetch username");
    }

    const channelDetails = await User.aggregate([
        {   //find a requested user from db
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
            //For each user, find all documents in subscriptions where
            //subscriptions.channel == user._id
            //and store them in subscribers array.
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
            //For each user, find all documents in subscriptions where
            //subscriptions.subscriber == user._id
            //and store them in subscribedTo array
        },
        {
            $addFields: {
                subscribersCount: {$size: "$subscribers"},
                subscribedToCount: {$size: "$subscribedTo"},
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                createdAt: 1
            }
        }
    ])
    if(!channelDetails?.length){
        throw new ApiError(400, "Channel is missing")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"User channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async(req,res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1,
                                        coverImage: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
             .status(201)
             .json(new ApiResponse(201,user[0].watchHistory,"Watched History fetched successfully"));
})
export {registerUser,
    loginUser,
    logoutUser,
    refrAccessToken,
    changeCurrPassword,
    getCurrUser,
    updateAccDetails,
    updateAvatar,
    getUserChannelProfile,
    getWatchHistory,
    updateCoverImage
};