const express = require('express');
const router = express.Router();

router.post('/verify', (req, res) => {
  const { pin } = req.body;
  const VALID_PIN = process.env.FAMILY_PIN || "1234";

  if (String(pin) === String(VALID_PIN)) {
    return res.json({ success: true, token: "session_valid_token" });
  }
  return res.status(401).json({ success: false, message: "Invalid PIN code" });
});

module.exports = router;
