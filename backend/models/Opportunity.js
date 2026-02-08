const mongoose = require("mongoose");

const OpportunitySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },

    company: {
        type: String,
        required: true
    },

    type: {
        type: String,
        enum: ["Job", "Internship", "Hackathon", "Scholarship"],
        required: true
    },

    status: {
        type: String,
        enum: ["Saved", "Applied", "Interview", "Rejected", "Offer"],
        default: "Saved"
    },

    deadline: {
        type: Date
    },

    link: {
        type: String
    },

    notes: {
        type: String
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Opportunity", OpportunitySchema);
