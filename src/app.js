import express, { json } from "express"; //used to create backend server
import cors from "cors";                 //allows requests from different origins
import cookieParser from "cookie-parser"; //reads cookies from request


const app = express();  //Initializes your Express application


// Logs every request , next() → passes control to next middleware
app.use((req, res, next) => { 
    console.log(`${req.method} request for ${req.url}`);
    next();
});


// configurations 
// Only allows requests from a specific origin (your frontend)
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//body parsing
app.use(express.json({limit: "16kb"})); // express.json() → parses JSON body and payload limit is 16kb
app.use(express.urlencoded({extended: true},{limit: "16kb"})); // express.urlencoded() → parses form data 


app.use(express.static("public")); // serves static files like image
app.use(cookieParser()); // parses cookies data



//routes import
//This file contains all user-related endpoints (e.g., login, register, etc.)
import userRouter from "./routes/user.routes.js";

app.use("/api/v1/users", userRouter); //Users Route Mounting

// If inside user.routes.js you have:
// router.get("/login", ...) Final API becomes: /api/v1/users/login

//video routes
import videoRouter from "./routes/video.routes.js"
app.use("/api/v1/videos", videoRouter); //Video routes mounting

export {app}; // You export app so it can be used in another file (usually server.js)  : app.listen(PORT)

// Request comes → middleware logs it
// CORS checks origin
// Body is parsed
// Cookies are read
// Route is matched
// Controller handles response