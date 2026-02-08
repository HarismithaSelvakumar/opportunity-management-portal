const express = require("express");
const router = express.Router();

const Opportunity = require("../models/Opportunity");


// CREATE opportunity
router.post("/", async (req, res) => {
    try {
        const newOpp = new Opportunity(req.body);
        const saved = await newOpp.save();
        res.json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// READ all opportunities
router.get("/", async (req, res) => {
    try {
        const data = await Opportunity.find().sort({ createdAt: -1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// UPDATE opportunity
router.put("/:id", async (req, res) => {
    try {
        const updated = await Opportunity.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// DELETE opportunity
router.delete("/:id", async (req, res) => {
    try {
        await Opportunity.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
