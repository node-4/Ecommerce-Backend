const mongoose = require("mongoose");
const schema = mongoose.Schema;
const ticketSchema = new mongoose.Schema(
    {
        userId: {
            type: schema.Types.ObjectId,
            ref: "user",
        },
        tiketId: {
            type: String
        },
        title: {
            type: String
        },
        description: {
            type: String
        },
        messageDetails: [{
            comment: {
                type: String,
            },
            byUser: {
                type: Boolean,
            },
            byAdmin: {
                type: Boolean,
            },
            date: {
                type: Date,
            },
        }],
        close: {
            type: Boolean,
            default: false
        },
    },
    { timestamps: true }
);
module.exports = mongoose.model("ticket", ticketSchema);