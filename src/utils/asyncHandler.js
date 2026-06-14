

// asyncHandler is try-catch wrapper that saves from writing try-catch in every async controller
// it returns a new function (middleware), resolve is like try and catch is used to display error
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise
            .resolve(requestHandler(req, res, next))
            .catch((err) => next(err));
    }
}
export { asyncHandler }



// try-catch version of above code

/*
const asyncHandler = (fn) => async(req, res, next) => {

    try {
        return await fn(req,res,next);
    }
    catch (err){
        res.status(err.code || 500).json({
            success: false,
            message: err.message
        })
    }
}

export {asyncHandler};

*/