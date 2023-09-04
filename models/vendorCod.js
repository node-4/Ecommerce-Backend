const mongoose = require("mongoose");
const schema = mongoose.Schema;
const ticketSchema = new mongoose.Schema(
    {
        userId: {
            type: schema.Types.ObjectId,
            ref: "user",
        },
        cod: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);
module.exports = mongoose.model("vendorCod", ticketSchema);