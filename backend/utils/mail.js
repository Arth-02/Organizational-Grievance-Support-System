const nodemailer = require("nodemailer");

const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

const sendEmail = (to, subject, html) => {
  return new Promise((resolve, reject) => {
    const mailDetails = {
      from: process.env.EMAIL,
      to: to,
      subject: subject,
      html: html,
    };

    mailTransporter.sendMail(mailDetails, function (err) {
      if (err) {
        console.log("Error Occurs", err);
        reject(false);
      } else {
        console.log("Email sent successfully");
        resolve(true);
      }
    });
  });
};

exports.sendEmail = sendEmail;
