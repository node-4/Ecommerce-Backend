const mongoose = require("mongoose");

const bannerSchema = mongoose.Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: "product"
    },
    image: {
        type: String,
        require: true,
    },
    desc: {
        type: String,
        require: false,
    },
    type: {
        type: String,
        enum: ["top", "product", "bottom", "Tranding"],
    },
});

const banner = mongoose.model("banner", bannerSchema);

module.exports = banner;
