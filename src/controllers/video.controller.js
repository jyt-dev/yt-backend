import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async(req,res) => {
    
    const {page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", userId} = req.query;

    const allowedSortFields = [
        "createdAt",
        "views",
        "duration",
        "videoTitle"
    ];

    const sortField = allowedSortFields.includes(sortBy)
        ? sortBy
        : "createdAt";

    //matches all published video by every uploader/user
    const matchStage = {
        isPublished: true
    }
    //matches published videos of a specified user from requested url using userId
    if(userId){
        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }
    //matches specific keywords from query to vidoetitle or description for searching
    if(query){
        matchStage.$or = [
            {
                videoTitle: {
                    $regex: query,
                    $options: "i"
                }
            },
            {
                description: {
                    $regex: query,
                    $options: "i"
                }
            }
        ]
    }

    const aggregate =  Video.aggregate([
        {
            $match: matchStage
        },
        {
            $sort: {
                [sortField]: sortType === "asc" ? 1 : -1
            }
        },
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
                            coverImage: 1,
                        }
                    }
                ]
            }
        },
        {
            
            $unwind: "$owner"
           
        },
        {
            $project: {
                videoFile: 1,
                videoTitle: 1,
                description: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                owner: 1
            }
        }
   ])
//pagination
    const options = {
        page: Number(page), //Number convert String to Integer 
        limit: Number(limit)
    };

    const videos = await Video.aggregatePaginate(
        aggregate,
        options
    )

    return res
            .status(200)
            .json(new ApiResponse(200,videos,"Videos fetched successfully"));

})

const uploadAVideo = asyncHandler(async(req,res) => {

    const {videoTitle,description} = req.body;

    const videoLocalPath = req.files?.videoFile[0]?.path; //returns a local path of video using multer middleware
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(!videoLocalPath || !thumbnailLocalPath){
        throw new ApiError(400," Thumbnail and Video required");
    }

    //Uploading video on cloudinary returns a url if success operation
    const uploadedVideo = await uploadOnCloudinary(videoLocalPath);
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!uploadedVideo || !uploadedThumbnail){
        throw new ApiError(500, "Upload operation failed");
    }

    //Creating and saving fields in db
    const video = await Video.create({
        videoFile: uploadedVideo?.url,
        videoTitle: videoTitle,
        description: description,
        duration: uploadedVideo?.duration,
        owner: req.user?._id,
        thumbnail: uploadedThumbnail?.url,
        isPublished: false
    });

    if(!video){
        throw new ApiError(401,"DB Video field creation failed");
    }

    return res
             .status(201)
             .json(new ApiResponse(201,video,"Video uploaded successfully"));
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    //check if it is a valid mongoDB objectID 
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid videoId");
    }

    const video = await Video.findById(videoId).populate(
        "owner", "username fullName avatar"
    );

    if(!video){
        throw new ApiError(404, "Video not available");
    }

    return res
             .status(200)
             .json(new ApiResponse(200,video,"Video fetched successfully"));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"Unauthorized request");
    }

    const {videoTitle,thumbnail,description} = req.body;

    if(!videoTitle && !thumbnail && !description){
        throw new ApiError(400,"At least one of field is required");
    }
    const updateFields = {};

    if(videoTitle) updateFields.videoTitle = videoTitle;
    if(thumbnail) updateFields.thumbnail = thumbnail;
    if(description) updateFields.description = description;
    
    const videoUpdate = await Video.findByIdAndUpdate(
          videoId,
        {
            $set: {
                updateFields
            }
        },
        {
            new: true
        }
    ).populate("owner","-password -refreshToken -coverImage");

    if(!videoUpdate){
        throw new ApiError(404,"Update failed");
    }

    return res
             .status(200)
             .json(new ApiResponse(200,videoUpdate,"Video details updated successfully"));
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid video Id");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404,"Video not found");
    }

    //check authorization
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"Unauthorized request");
    }
    
    const deleteVidFromCloudinary = await deleteFromCloudinary(video.videoFile);
    const deleteThumbnail = await deleteFromCloudinary(video.thumbnail);

    if(!deleteVidFromCloudinary){
        throw new ApiError(400, "Video deletion from cloudinary failed");
    }

    await Video.findByIdAndDelete(videoId); //delete from mongodB 

    return res
             .status(200)
             .json(new ApiResponse(200,{},"Video deleted successfully"));

})
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"Unauthorized request");
    }

    //when a user click toggle switch it reaches an endpoint and sends a http request to server 
    //if video is published then it is unpublished or vice-versa

    video.isPublished = !video.isPublished; 
    await video.save({validateBeforeSave: false});

    return res
             .status(200)
             .json(new ApiResponse(200,video,`Video ${video.isPublished ? "published" : "unpublished"} successfully`));
})

export {
    getAllVideos,
    getVideoById,
    updateVideo,
    uploadAVideo,
    deleteVideo,
    togglePublishStatus
}



