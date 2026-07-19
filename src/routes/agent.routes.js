const express = require("express");
const router = express.Router();

const runAgent =
require("../agents/runAgent");

router.post("/", async (req, res) => {

  try {

    const { question } = req.body;

    const answer =
      await runAgent(question);

    res.json({
      success: true,
      answer
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});

module.exports = router;