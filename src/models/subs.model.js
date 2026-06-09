import moongose from "mongoose";

const subscriptionSchema = new moongose.Schema({
    subscriber: {
        type: moongose.Schema.Types.ObjectId,
        ref: "User"
    },
    channel: {
        type: moongose.Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps: true})

export const Subscription = moongose.model("Subscription", subscriptionSchema);

//for getting subscribers of a user count that user in channel field of every documents
//for getting following/subscribedTo of a user count that user in subscriber field of every documents