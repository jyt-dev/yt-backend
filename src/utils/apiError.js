
class ApiError extends Error {

    constructor(statusCode, message = "Something went wrong", errors = [], stack = ""){
        super();
        this.statusCode = statusCode;
        this.errors = errors;
        this.message = message;
        this.success = false; // no success when error or failure
        this.data = null; //no data when there is error

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export {ApiError};