const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const cors = require("cors");
const nodemailer = require("nodemailer");

// server used to send emails
const app = express();

require("dotenv").config();
app.use(cors());
app.use(express.json());
app.use("/", router);
app.listen(5000, () => console.log("Server Running"));

const contactEmail = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_MAIL,
    pass: process.env.USER_PASS,
  },
});

contactEmail.verify((error) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Ready to Send");
  }
});

// Contact route with validation middleware
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
      .withMessage("Valid email is required")
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
      return res.status(400).json({ errors: errors.array() });
    }
    
    const name = `${req.body.firstName} ${req.body.lastName}`;
    const email = req.body.email;
    const message = req.body.message;
    const phone = req.body.phone;

    const mail = {
      from: name,
      to: "********@gmail.com",
      subject: "Contact Form Submission - Portfolio",
      html: `<p>Name: ${name}</p>
             <p>Email: ${email}</p>
             <p>Phone: ${phone || "N/A"}</p>
             <p>Message: ${message}</p>`,
    };

    contactEmail.sendMail(mail, (error) => {
      if (error) {
        res.json(error);
      } else {
        res.json({ code: 200, status: "Message Sent" });
      }
    });
  }
);
