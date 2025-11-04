import express from 'express';

const router = express.Router();

// POST /api/v1/contact
router.post('/', (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  // TODO: Save to database and send notification
  console.log('Contact form submission:', { name, email, subject });

  res.status(201).json({
    success: true,
    message: 'Your message has been sent successfully. We will contact you soon.',
  });
});

export default router;
