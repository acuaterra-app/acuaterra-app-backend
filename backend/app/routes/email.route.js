const express = require('express');
const router = express.Router();
const Mailer = require('../utils/Mailer');

// Instantiate the Mailer class with the API key from environment variables
const mailer = new Mailer(process.env.RESEND_API_KEY);

/**
 * @route POST /api/v2/email
 * @desc Send a test email
 * @access Public
 */
router.post('/', async (req, res) => {
  try {
    const { email, text } = req.body;
    
    // Validate required parameters
    if (!email || !text) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and text are required parameters' 
      });
    }
    
    // Send the test email
    // Wrap the text in HTML tags to ensure it's sent as HTML content
    const htmlContent = `<div>${text}</div>`;
    
    const result = await mailer.sendEmail(
      email,
      'Test Email',
      htmlContent,
      process.env.RESEND_FROM_EMAIL
    );
    
    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

module.exports = router;

