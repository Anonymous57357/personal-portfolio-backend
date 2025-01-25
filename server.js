const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const cors = require("cors");
const nodemailer = require("nodemailer");

// Server setup
const app = express();
require("dotenv").config();
app.use(cors());
app.use(express.json());
app.use("/", router);

app.listen(5000, () => console.log("Server Running on Port 5000"));

// Configure Nodemailer
const contactEmail = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_MAIL,
    pass: process.env.USER_PASS,
  },
});

contactEmail.verify((error) => {
  if (error) {
    console.log("Error setting up email transporter:", error);
  } else {
    console.log("Email transporter is ready to send emails.");
  }
});

// Contact route with validation
router.post(
  "/contact",
  [
    body("firstName")
      .trim()
      .notEmpty()
      .withMessage("First name is required")
      .isLength({ max: 50 })
      .withMessage("First name cannot exceed 50 characters"),
    body("lastName")
      .trim()
      .notEmpty()
      .withMessage("Last name is required")
      .isLength({ max: 50 })
      .withMessage("Last name cannot exceed 50 characters"),
    body("email")
      .isEmail()
      .withMessage("A valid email is required")
      .normalizeEmail(),
    body("message")
      .trim()
      .notEmpty()
      .withMessage("Message is required")
      .isLength({ max: 500 })
      .withMessage("Message cannot exceed 500 characters"),
    body("phone")
      .optional()
      .matches(/^\d{10}$/)
      .withMessage("Phone number must be 10 digits"),
  ],
  (req, res) => {
    // Handle validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors
          .array()
          .map((err) => ({ field: err.param, message: err.msg })),
      });
    }

    const name = `${req.body.firstName} ${req.body.lastName}`;
    const email = req.body.email;
    const message = req.body.message;
    const phone = req.body.phone || "N/A";

    const mail = {
      from: `"Portfolio Contact Form" <${process.env.USER_MAIL}>`, // Professional "from" email
      to: process.env.USER_MAIL, // Your portfolio email
      subject: "New Contact Form Submission - Portfolio",
      html: `
        <h2>Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    contactEmail.sendMail(mail, (error) => {
      if (error) {
        console.error("Error sending email:", error);
        return res
          .status(500)
          .json({
            error: "Failed to send the message. Please try again later.",
          });
      }
      res.status(200).json({ code: 200, status: "Message Sent Successfully" });
    });
  }
);
