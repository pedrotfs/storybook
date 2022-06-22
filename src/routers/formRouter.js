const express = require("express")
const router = new express.Router()
const request = require('request')

router.post("/add-registry-submit", async (req, res) => {
    console.log("adding registry.")
    console.log(req.body);
    res.status(200).send("hit");
})

module.exports = router;