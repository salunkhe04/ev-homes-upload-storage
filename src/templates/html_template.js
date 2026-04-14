import moment from "moment-timezone";
import { formatedDateOnly } from "../utils/helper.js";

export const otpForgotPasswordTemplate = (otp, name) => {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Forgot Password</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }

        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .header {
          text-align: center;
          padding: 20px;
          border-bottom: 2px solid #007bff;
        }

        .header h1 {
          margin: 0;
          color: #007bff;
        }

        .otp {
          font-size: 32px;
          font-weight: bold;
          color: #333;
          margin: 20px 0;
          text-align: center;
        }

        .footer {
          text-align: center;
          padding: 10px;
          border-top: 1px solid #eaeaea;
          margin-top: 20px;
        }

        .footer p {
          color: #777;
          font-size: 14px;
        }
      </style>
    </head>

    <body>
      <div class="container">
        <div class="header">
          <h1>Forgot Password OTP</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p>To reset your password, please use the following One-Time Password (OTP):</p>
          <div class="otp">${otp}</div>
          <p>This OTP is valid for the next 10 minutes.</p>
          <p>If you did not request this OTP, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 EV Home Construction Pvt Ltd. All rights reserved.</p>
        </div>
      </div>
    </body>
  </html>
  `;
};

export const forgotPasswordTemplete = (name, otp, resetLink = undefined) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
        color: #333;
      }
      .container {
        width: 100%;
        max-width: 600px;
        margin: 20px auto;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }
      .header {
        background-color: #ff9800; /* Orange theme */
        padding: 20px;
        text-align: center;
        color: #ffffff;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
      }
      .content {
        padding: 20px;
        text-align: center;
      }
      .content p {
        font-size: 16px;
        margin-bottom: 20px;
      }
      .otp {
        font-size: 24px;
        font-weight: bold;
        padding: 10px 20px;
        border-radius: 4px;
        background-color: #f1f1f1;
        display: inline-block;
        margin: 20px 0;
      }
      .button {
        background-color: #ff9800; /* Orange theme */
        color: #ffffff;
        padding: 10px 20px;
        text-decoration: none;
        border-radius: 4px;
        font-size: 16px;
        display: inline-block;
      }
      .footer {
        padding: 20px;
        background-color: #f1f1f1;
        text-align: center;
        font-size: 12px;
        color: #666;
      }
      .footer a {
        color: #ff9800; /* Orange theme */
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Password Reset Request</h1>
      </div>
      <div class="content">
        <p>Dear ${name},</p>
        <p>
          We received a request to reset your password. Please use the following code to
          proceed:
        </p>
        <div class="otp">${otp}</div>
        <p>Alternatively, you can reset your password by clicking the button below:</p>
        <a href="${resetLink}" class="button">Reset Password</a>
        <p>If you did not request this, please ignore this email or contact support.</p>
      </div>
      <div class="footer">
        <p>&copy; 2024 EV Homes Construction PVT LTD. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`;
};

export const cpAccountOTPTemplate = (name, type, otp) => {
  let para =
    type === "email"
      ? `You’re receiving this email because you requested to verify your
          account email address. To complete the verification process, please
          use the OTP provided below:`
      : `You’re receiving this message because you requested to verify your phone number. To complete the verification process, please use the OTP provided below:`;
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Account ${type} OTP</title>
    <style>
      body {
        margin: 0;
        font-family: "Segoe UI", sans-serif;
        background-color: #f9f9f9;
        color: #333;
      }

      .container {
        max-width: 400px;
        margin: 0 auto;
        background-color: #fff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .header {
        position: relative;
        height: 180px;
        width: 100%;
      }

      .header img {
        width: 100%;
        height: 100%;
        object-fit: cover; /* Ensures image covers the area without distortion */
        border-radius: 12px 12px 0 0;
      }

      .header h1 {
        position: absolute;
        bottom: 20px;
        left: 20px;
        margin: 0;
        font-size: 22px;
        color: white;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
      }

      .content {
        padding: 24px 20px;
        text-align: center;
      }

      .content p {
        margin-bottom: 16px;
        font-size: 15px;
        line-height: 1.5;
      }

      .otp-box {
        font-size: 28px;
        letter-spacing: 4px;
        font-weight: bold;
        padding: 14px;
        border: 2px dashed #ff9800;
        border-radius: 10px;
        background-color: #fffbe6;
        color: #e65100;
        margin: 20px auto;
        display: inline-block;
      }

      .footer {
        font-size: 12px;
        text-align: center;
        padding: 16px;
        color: #777;
        background-color: #f0f0f0;
      }

      .footer a {
        color: #ff9800;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <!-- Inline image -->
        <img
          src="https://cdn.evhomes.tech/443bf3d3-bfe5-4df3-87be-0e112c8fc64c-malibu_showcase.jpeg"
          alt="Sales Lounge Visit"
        />
        <h1>${type} OTP</h1>
      </div>
      <div class="content">
        <p>Dear <strong>${name}</strong>,</p>
        <p>
          ${para}
        </p>
        <div class="otp-box">${otp}</div>
        <p>
          If you did not request this, please ignore the message or contact
          support.
        </p>
      </div>
      <div class="footer">
        &copy; 2025 EV Homes Construction Pvt. Ltd.<br />
        Need help? <a href="https://evhomes.tech/contact-us">Contact Support</a>
      </div>
    </div>
  </body>
</html>
`;
};

export const bookingRecievedTemplate = (
  project,
  teamLeader,
  clientName,
  phoneNumber,
  channelPartner = undefined,
  AssignmentDate,
  visitDate,
  revisitDate,
  bookingDate,
  kycRecieved,
) => {
  // let cpInfo = "";
  // if (channelPartner)
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
        color: #333;
      }
      .container {
        width: 100%;
        max-width: 600px;
        margin: 20px auto;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }
      .header {
        /*background-color: #ff9800;  Orange theme */
        padding: 20px;
        text-align: center;
        color: #ffffff;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
      }
      .content {
        padding: 20px;
      }
      .subject {
        padding: 0px 0px 0px 40px;
        font-weight: 500;
      }
      .subject .span-s {
        font-weight: 600;
      }
      .content p {
        font-size: 16px;
        margin-bottom: 20px;
      }
      .otp {
        font-size: 24px;
        font-weight: bold;
        padding: 10px 20px;
        border-radius: 4px;
        background-color: #f1f1f1;
        display: inline-block;
        margin: 20px 0;
      }
      .button {
        background-color: #ff9800; /* Orange theme */
        color: #ffffff;
        padding: 10px 20px;
        text-decoration: none;
        border-radius: 4px;
        font-size: 16px;
        display: inline-block;
      }
      .footer {
        padding: 20px;
        background-color: #f1f1f1;
        text-align: center;
        font-size: 12px;
        color: #666;
      }
      .footer a {
        color: #ff9800; /* Orange theme */
        text-decoration: none;
      }
      .image-congrats {
        /* width: 350px; */
        max-height: 350px;
      }
      .content .details-para {
        font-size: 16px;
      }
      .info-para {
        font-size: 16px;
        font-weight: 700;
      }
      .info-span {
        font-size: 14px;
        font-weight: 400;
      }
      .para-sir {
        font-size: 16px;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <!-- <h1>Password Reset Request</h1> -->
        <img
          class="image-congrats"
          src="https://cdn.evhomes.tech/77592a74-bebd-4a84-9fe0-8a61a4fbe73c-congrats_image-removebg-preview.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaWxlbmFtZSI6Ijc3NTkyYTc0LWJlYmQtNGE4NC05ZmUwLThhNjFhNGZiZTczYy1jb25ncmF0c19pbWFnZS1yZW1vdmViZy1wcmV2aWV3LnBuZyIsImlhdCI6MTc0MDE0NjUxOX0.P2cIzfdY38OSshECNMazV74ZH03bTDEFZqeEjSIL0IE"
          alt=""
          srcset=""
        />
      </div>
      <div class="content">
        <p class="para-sir">Dear sir,</p>
        <p class="subject">
          <span> There has been a new booking on </span>
          <span class="span-s"> ${project} </span>by
          <span class="span-s"> ${teamLeader} </span>team.
        </p>
        <p class="details-para">Details of booking are mentioned below.</p>
        <p class="info-para">
          Client Name: <span class="info-span">${clientName}</span>
        </p>
        <p class="info-para">
          Client Number: <span class="info-span">${phoneNumber}</span>
        </p>
        <p class="info-para">
          Channel Partner: <span class="info-span">${channelPartner}</span>
        </p>
        <p class="info-para">
          Assignment Date: <span class="info-span">${AssignmentDate}</span>
        </p>
        <p class="info-para">
          Visit Date: <span class="info-span">${visitDate}</span>
        </p>

        <p class="info-para">
          Revisit Date: <span class="info-span">${revisitDate}</span>
        </p>
        <p class="info-para">
          Booking Date: <span class="info-span">${bookingDate}</span>
        </p>
        <p class="info-para">
          KYC Recieved: <span class="info-span">${kycRecieved}</span>
        </p>
      </div>
      <div class="footer">
        <p>&copy; 2025 EV Homes Construction PVT LTD. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`;
};

export const feedbackPendingTemplate = (
  clientName,
  phoneNumber,
  assignBy,
  assignTo,
  assignDate,
  leadStatus,
) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Feedback Pending Warning</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f8f9fa;
        margin: 0;
        padding: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }
      .warning-box {
        background-color: #fff3cd;
        border-left: 8px solid #ffcc00;
        padding: 30px;
        width: 100%;
        max-width: 800px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        border-radius: 10px;
        text-align: left;
      }
      .warning-box h2 {
        color: #856404;
        margin-bottom: 15px;
        font-size: 24px;
        text-align: center;
      }
      .warning-box p {
        color: #856404;
        font-size: 16px;
        margin: 10px 0;
        word-wrap: break-word;
      }
      .warning-box a {
        display: block;
        text-align: center;
        background-color: #ffcc00;
        color: #856404;
        text-decoration: none;
        padding: 12px 20px;
        font-size: 18px;
        font-weight: bold;
        border-radius: 6px;
        margin-top: 20px;
      }
      .warning-box a:hover {
        background-color: #e6b800;
      }
      @media screen and (max-width: 600px) {
        body {
          padding: 10px;
        }
        .warning-box {
          padding: 20px;
        }
        .warning-box h2 {
          font-size: 20px;
        }
        .warning-box p {
          font-size: 14px;
        }
        .warning-box a {
          font-size: 16px;
          padding: 10px;
        }
      }
    </style>
  </head>
  <body>
    <div class="warning-box">
      <h2>⚠ Feedback Pending</h2>
      <p><strong>Client Name:</strong> ${clientName}</p>
      <p><strong>Phone Number:</strong> ${phoneNumber}</p>
      <p><strong>Assign By:</strong> ${assignBy}</p>
      <p><strong>Assign TO:</strong> ${assignTo}</p>
      <p><strong>Assign Date:</strong> ${assignDate}</p>
      <p><strong>Lead Status:</strong> ${leadStatus}</p>
      <p>
        Please submit feedback for the assigned lead to avoid delays. Timely
        feedback helps improve response times and ensures better communication
        with the client.
      </p>
      <!-- <a href="#" target="_blank">Submit Feedback</a> -->
    </div>
  </body>
</html>`;
};

export const cpFeedbackPendingTemplate = (
  clientName,
  phoneNumber,
  email,
  channelPartnerName,
  date,
) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CP Feedback Pending Warning</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f8f9fa;
        margin: 0;
        padding: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }
      .warning-box {
        background-color: #fff3cd;
        border-left: 8px solid #ffcc00;
        padding: 30px;
        width: 100%;
        max-width: 800px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        border-radius: 10px;
        text-align: left;
      }
      .warning-box h2 {
        color: #856404;
        margin-bottom: 15px;
        font-size: 24px;
        text-align: center;
      }
      .warning-box p {
        color: #856404;
        font-size: 16px;
        margin: 10px 0;
        word-wrap: break-word;
      }
      .warning-box a {
        display: block;
        text-align: center;
        background-color: #ffcc00;
        color: #856404;
        text-decoration: none;
        padding: 12px 20px;
        font-size: 18px;
        font-weight: bold;
        border-radius: 6px;
        margin-top: 20px;
      }
      .warning-box a:hover {
        background-color: #e6b800;
      }
      @media screen and (max-width: 600px) {
        body {
          padding: 10px;
        }
        .warning-box {
          padding: 20px;
        }
        .warning-box h2 {
          font-size: 20px;
        }
        .warning-box p {
          font-size: 14px;
        }
        .warning-box a {
          font-size: 16px;
          padding: 10px;
        }
      }
    </style>
  </head>
  <body>
    <div class="warning-box">
      <h2>⚠ CP Feedback Pending</h2>
      <p><strong>Client Name:</strong> ${clientName}</p>
      <p><strong>Phone Number:</strong> ${phoneNumber}</p>
      <p><strong>Client Email:</strong> ${email || "N/A"}</p>
      ${
        channelPartnerName
          ? `<p><strong>Channel Partner:</strong> ${channelPartnerName}</p>`
          : ""
      }

      <p><strong>Date:</strong> ${date}</p>
      <p>Please make sure to update the Channel Partner Feedback.
      </p>
    </div>
  </body>
</html>`;
};

export const leadAssignPendingTemplate = (
  clientName,
  phoneNumber,
  channelPartner,
  dataAnalyzer,
  assignDate,
  teamLeader,
) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lead Assignment Pending</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f8f9fa;
        margin: 0;
        padding: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }
      .warning-box {
        background-color: #ffcccc;
        border-left: 8px solid #ff0000;
        padding: 30px;
        width: 100%;
        max-width: 800px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        border-radius: 10px;
        text-align: left;
      }
      .warning-box h2 {
        color: #b30000;
        margin-bottom: 15px;
        font-size: 24px;
        text-align: center;
      }
      .warning-box p {
        color: #b30000;
        font-size: 16px;
        margin: 10px 0;
        word-wrap: break-word;
      }
      .warning-box a {
        display: block;
        text-align: center;
        background-color: #ff0000;
        color: #ffffff;
        text-decoration: none;
        padding: 12px 20px;
        font-size: 18px;
        font-weight: bold;
        border-radius: 6px;
        margin-top: 20px;
      }
      .warning-box a:hover {
        background-color: #cc0000;
      }
      @media screen and (max-width: 600px) {
        body {
          padding: 10px;
        }
        .warning-box {
          padding: 20px;
        }
        .warning-box h2 {
          font-size: 20px;
        }
        .warning-box p {
          font-size: 14px;
        }
        .warning-box a {
          font-size: 16px;
          padding: 10px;
        }
      }
    </style>
  </head>
  <body>
    <div class="warning-box">
      <h2>⚠ Lead Assignment Pending</h2>
      <p><strong>Client Name:</strong> ${clientName}</p>
      <p><strong>Phone Number:</strong> ${phoneNumber}</p>
      <p><strong>Channel Partner:</strong> ${channelPartner}</p>
      <p><strong>Approved By:</strong> ${dataAnalyzer}</p>
      <p><strong>Assign Date:</strong> ${assignDate}</p>
      <p><strong>Team Leader:</strong> ${teamLeader}</p>
      <p>
        Please take immediate action on the assigned lead to ensure smooth
        communication and follow-ups.
      </p>
      <!-- <a href="#" target="_blank">View Lead Details</a> -->
    </div>
  </body>
</html>`;
};

export const meetingRequestTemplate = (
  teamLeader,
  clientFirstName,
  clientLastName,
) => {
  return `
   <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>New Appointment Request</title>
    </head>
    <body>
      <h4>New Appointment Request Received!!!</h1>
      <p>Hi,</p>
      <p>A new Appointment Request has been received from <strong>${teamLeader}</strong> for client <strong> ${clientFirstName} ${clientLastName}
      </strong></p>
    
      <p>Regards</p>
    </body>
    </html>
  `;
};

export const weekOffTemplete = (
  name,
  designation,
  reportingTo,
  date,
  reason,
) => {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Week Off Application</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 20px;
      }
      .container {
        max-width: 600px;
        background: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
      }
      .header {
        background: #0073e6;
        color: #ffffff;
        text-align: center;
        padding: 10px;
        border-radius: 8px 8px 0 0;
      }
      .content {
        padding: 20px;
        color: #333333;
      }
      .footer {
        text-align: center;
        font-size: 12px;
        color: #777777;
        margin-top: 20px;
      }
      .button {
        display: inline-block;
        background: #0073e6;
        color: #ffffff;
        padding: 10px 20px;
        text-decoration: none;
        border-radius: 5px;
        margin-top: 10px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>Week Off Request</h2>
      </div>
      <div class="content">
        <p>Dear ${reportingTo},</p>
        <p>
          I hope you are doing well. I would like to request a week off on
          <strong>${date}</strong> due to ${reason}. Please let me know if this
          can be accommodated.
        </p>
        <p>Thank you for your time and consideration.</p>
        <p>Best regards,</p>
        <p><strong>${name}</strong><br />${designation}</p>
        <a href="#" class="button">Approve Request</a>
      </div>
      <div class="footer">
        <p>This is an automated email. Please do not reply directly.</p>
      </div>
    </div>
  </body>
</html>`;
};

export const visitTemplate = (
  header,
  clientName,
  phoneNumber,
  projects,
  requirement,
  team,
  closingManager,
  visitType = "",
) => {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Site Visit Notification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f4f4f4;
        padding: 20px;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      .header {
        background: #007bff;
        color: #fff;
        text-align: center;
        padding: 10px;
        border-radius: 8px 8px 0 0;
      }
      .content {
        padding: 20px;
      }
      .footer {
        text-align: center;
        font-size: 12px;
        color: #777;
        padding-top: 10px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="content">
        <p>
          <strong> ${header} </strong>
        </p>

        <p><strong>Client Name:</strong> ${clientName}</p>
        <p><strong>Contact:</strong> ${phoneNumber}</p>
        <p><strong>Projects Interested:</strong>${projects}</p>
        <p><strong>requirement:</strong> ${requirement}</p>
        <p><strong>Visit Type:</strong> ${visitType}</p>
        <hr />
        <p><strong>Sales Guide:</strong>${team}</p>
        <p><strong>Closing Manager:</strong> ${closingManager}</p>
      </div>
      <div class="footer">
        <p>This is an automated notification. Please do not reply.</p>
      </div>
    </div>
  </body>
</html>`;
};

export const visitSummaryTemplate = ({
  date = "",
  totalVisits = 0,
  cpVirtualMeetings = 0,
  cpVisits = 0,
  cpRevisits = 0,

  internalVirtualMeetings = 0,
  internalVisits = 0,
  internalRevisits = 0,

  walkinVirtualMeetings = 0,
  walkinVisits = 0,
  walkinRevisits = 0,

  nineSquareVirtualMeetings = 0,
  nineSquareVisits = 0,
  nineSquareRevisits = 0,

  marinaBayVirtualMeetings = 0,
  marinaBayVisits = 0,
  marinaBayRevisits = 0,

  malibuVirtualMeetings = 0,
  malibuVisits = 0,
  malibuRevisits = 0,

  heartCityVirtualMeetings = 0,
  heartCityVisits = 0,
  heartCityRevisits = 0,

  deepakVisits = 0,
  deepakRevisits = 0,
  deepakVirtualMeetings = 0,

  vickyManeVisits = 0,
  vickyManeRevisits = 0,
  vickyManeVirtualMeetings = 0,

  jaspreetVisits = 0,
  jaspreetRevisits = 0,
  jaspreetVirtualMeetings = 0,

  ranjnaVisits = 0,
  ranjnaRevisits = 0,
  ranjnaVirtualMeetings = 0,

  maxVisitCpName = "NA",
}) => {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Summary Visits Email</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        padding: 20px;
      }
      .email-container {
        max-width: 600px;
        margin: auto;
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        text-align: center;
      }
      .header {
        font-size: 24px;
        font-weight: bold;
        /* margin-bottom: 20px; */
        color: #333;
      }
      .sub-header {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 20px;
        color: #333;
      }
      .max-cp {
        color: green;
      }

      .summary-table {
        width: 100%;
        border-collapse: collapse;
      }
      .summary-table th,
      .summary-table td {
        padding: 10px;
        border: 1px solid #ddd;
        font-size: 12px;
      }
      .bold {
        font-weight: 700;
      }

      .summary-table th {
        background-color: #f8f8f8;
        color: #555;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">Visit Summary</div>
      <div class="sub-header">(${date})</div>
      <div class="sub-header">Total Visits : ${totalVisits}</div>
      <!-- summary walk-in/cp/internal table -->
      <table class="summary-table">
        <tr>
          <th>Source</th>
          <th>Virtual Meeting</th>
          <th>Visit</th>
          <th>Revisit</th>
        </tr>
        <tr>
          <td>Channel Partner</td>
          <td>${cpVirtualMeetings}</td>
          <td>${cpVisits}</td>
          <td>${cpRevisits}</td>
        </tr>
        <tr>
          <td>Walk In</td>
          <td>${walkinVirtualMeetings}</td>
          <td>${walkinVisits}</td>
          <td>${walkinRevisits}</td>
        </tr>
        <tr>
          <td>Internal Lead</td>
          <td>${internalVirtualMeetings}</td>
          <td>${internalVisits}</td>
          <td>${internalRevisits}</td>
        </tr>
      </table>
      <br />

      <!-- summary projects table -->
      <table class="summary-table">
        <tr>
          <th>Projects</th>
          <th>Virtual Meeting</th>
          <th>Visit</th>
          <th>Revisit</th>
        </tr>
        <tr>
          <td>EV 10 Marina Bay</td>
          <td>${marinaBayVirtualMeetings}</td>
          <td>${marinaBayVisits}</td>
          <td>${marinaBayRevisits}</td>
        </tr>
        <tr>
          <td>EV 9 Square</td>
          <td>${nineSquareVirtualMeetings}</td>
          <td>${nineSquareVisits}</td>
          <td>${nineSquareRevisits}</td>
        </tr>
        <tr>
          <td>EV 23 Malibu West</td>
          <td>${malibuVirtualMeetings}</td>
          <td>${malibuVisits}</td>
          <td>${malibuRevisits}</td>
        </tr>
        <tr>
          <td>EV Heart City</td>
          <td>${heartCityVirtualMeetings}</td>
          <td>${heartCityVisits}</td>
          <td>${heartCityRevisits}</td>
        </tr>
      </table>
      <br />

      <!-- summary Team Visits table -->
      <table class="summary-table">
        <tr>
          <th>Team</th>
          <th>Virtual Meeting</th>
          <th>Visit</th>
          <th>Revisit</th>
        </tr>
        <tr>
          <td>Deepak Karki</td>
          <td>${deepakVirtualMeetings}</td>
          <td>${deepakVisits}</td>
          <td>${deepakRevisits}</td>
        </tr>
        <tr>
          <td>Vicky Mane</td>
          <td>${vickyManeVirtualMeetings}</td>
          <td>${vickyManeVisits}</td>
          <td>${vickyManeRevisits}</td>
        </tr>
        <tr>
          <td>Jaspreet Arrora</td>
          <td>${jaspreetVirtualMeetings}</td>
          <td>${jaspreetVisits}</td>
          <td>${jaspreetRevisits}</td>
        </tr>
        <tr>
          <td>Ranjna Gupta</td>
          <td>${ranjnaVirtualMeetings}</td>
          <td>${ranjnaVisits}</td>
          <td>${ranjnaRevisits}</td>
        </tr>
        <tr>
          <td class="bold">Total</td>
          <td class="bold">
            ${
              deepakVirtualMeetings +
              vickyManeVirtualMeetings +
              jaspreetVirtualMeetings +
              ranjnaVirtualMeetings
            }
          </td>
          <td class="bold">
            ${deepakVisits + vickyManeVisits + jaspreetVisits + ranjnaVisits}
          </td>
          <td class="bold">
            ${
              deepakRevisits +
              vickyManeRevisits +
              jaspreetRevisits +
              ranjnaRevisits
            }
          </td>
        </tr>
      </table>
      <br />

      <div class="sub-header max-cp">
        Channel Partner with Maximum Visits: ${maxVisitCpName}
      </div>
    </div>
  </body>
</html>`;
};

export const siteVisitOtpTemplete = (name, otp) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Site Visit</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
        color: #333;
      }
      .container {
        width: 100%;
        max-width: 600px;
        margin: 20px auto;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }
      .header {
        background-color: #ff9800; /* Orange theme */
        padding: 20px;
        text-align: center;
        color: #ffffff;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
      }
      .content {
        padding: 20px;
        text-align: center;
      }
      .content p {
        font-size: 16px;
        margin-bottom: 20px;
      }
      .otp {
        font-size: 24px;
        font-weight: bold;
        padding: 10px 20px;
        border-radius: 4px;
        background-color: #f1f1f1;
        display: inline-block;
        margin: 20px 0;
      }
      .button {
        background-color: #ff9800; /* Orange theme */
        color: #ffffff;
        padding: 10px 20px;
        text-decoration: none;
        border-radius: 4px;
        font-size: 16px;
        display: inline-block;
      }
      .footer {
        padding: 20px;
        background-color: #f1f1f1;
        text-align: center;
        font-size: 12px;
        color: #666;
      }
      .footer a {
        color: #ff9800; /* Orange theme */
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Site Visit Request</h1>
      </div>
      <div class="content">
        <p>Dear ${name},</p>
        <p>
          We received a request to verify your visit. Use the following code to
          proceed:
        </p>
        <div class="otp">${otp}</div>
        <p>
          If you did not request this, please ignore this email or contact
          support.
        </p>
      </div>
      <div class="footer">
        <p>&copy; 2025 EV Homes Construction PVT LTD. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`;
};

export const visitTemplateV2 = ({
  header,
  clientName,
  phoneNumber,
  email,
  location,
  projects,
  requirement,
  team,
  closingManager,
  visitType = "",
  channelPartner,
  date,
}) => {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Site Visit Notification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f4f4f4;
        padding: 20px;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      .header {
        background: #007bff;
        color: #fff;
        text-align: center;
        padding: 10px;
        border-radius: 8px 8px 0 0;
      }
      .content {
        padding: 20px;
      }
      .para {
        font-size: 15px;
      }
      .para2 {
        font-size: 15px;
      }

      .footer {
        text-align: center;
        font-size: 12px;
        color: #777;
        padding-top: 10px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="content">
        <p><strong>Sub:</strong></p>
        <p>
          <strong> ${header} </strong>
        </p>
        <p>Dear ${closingManager},</p>
        <br />
        <p class="para">
          We would like to inform you that a prospective client has just visited
          the EV Homes Sales Lounge at ${location} and completed the visitor
          registration form
        </p>
        <p class="para">
          Please find the client’s details below for your immediate attention
          and follow-up:
        </p>
        <p><strong>Client Details</strong></p>
        <ul>
          <li>
            <p class="para2"><strong>Full name:</strong> ${clientName}</p>
          </li>
          <li>
            <p class="para2"><strong>Contact Number:</strong> ${phoneNumber}</p>
          </li>
          <li>
            <p class="para2"><strong>Email Address:</strong> ${email}</p>
          </li>
          <li>
            <p class="para2">
              <strong>Interested Project:</strong> ${projects}
            </p>
          </li>
          <li>
            <p class="para2"><strong>Requirement:</strong> ${requirement}</p>
          </li>
          <li>
            <p class="para2">
              <strong>Channel Partner:</strong> ${channelPartner}
            </p>
          </li>
          <li>
            <p><strong>Date & Time of Visit:</strong> ${date}</p>
          </li>
          <li>
            <p class="para2"><strong>Visit Type:</strong> ${visitType}</p>
          </li>
          <li>
            <p class="para2"><strong>Closing Team:</strong>${team}</p>
          </li>
          <li>
            <p class="para2">
              <strong>Closing Manager:</strong> ${closingManager}
            </p>
          </li>
        </ul>
        <hr />
      </div>
      <div class="footer">
        <!-- <p>This is an automated notification. Please do not reply.</p> -->
        Warm regards, EV Homes – Visitor Notification System 📍 Sales Lounge,
        ${location} ✉️ evhomes.operations@evgroup.co.in | 🌐 evhomes.tech
      </div>
    </div>
  </body>
</html>`;
};

export const siteVisitOtpTempleteV2 = ({ name, otp, imageUrl, location }) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Site Visit Verification</title>
    <style>
      body {
        margin: 0;
        font-family: "Segoe UI", sans-serif;
        background-color: #f9f9f9;
        color: #333;
      }

      .container {
        max-width: 400px;
        margin: 0 auto;
        background-color: #fff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .header {
        position: relative;
        height: 180px;
        width: 100%;
      }

      .header img {
        width: 100%;
        height: 100%;
        object-fit: cover; /* Ensures image covers the area without distortion */
        border-radius: 12px 12px 0 0;
      }

      .header h1 {
        position: absolute;
        bottom: 20px;
        left: 20px;
        margin: 0;
        font-size: 22px;
        color: white;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
      }

      .content {
        padding: 24px 20px;
        text-align: center;
      }

      .content p {
        margin-bottom: 16px;
        font-size: 15px;
        line-height: 1.5;
      }

      .otp-box {
        font-size: 28px;
        letter-spacing: 4px;
        font-weight: bold;
        padding: 14px;
        border: 2px dashed #ff9800;
        border-radius: 10px;
        background-color: #fffbe6;
        color: #e65100;
        margin: 20px auto;
        display: inline-block;
      }

      .footer {
        font-size: 12px;
        text-align: center;
        padding: 16px;
        color: #777;
        background-color: #f0f0f0;
      }

      .footer a {
        color: #ff9800;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <!-- Inline image -->
        <img
          src="${imageUrl}"
          alt="Sales Lounge Visit"
        />
        <h1>Site Visit Verification</h1>
      </div>
      <div class="content">
        <p>Dear <strong>${name}</strong>,</p>
        <p>
          You’re receiving this email because you visited our
          <strong>${location} Sales Lounge</strong>
          for a site visit. To verify and complete the check-in process, please
          use the OTP below:
        </p>
        <div class="otp-box">${otp}</div>
        <p>
          If you did not request this, please ignore the message or contact
          support.
        </p>
      </div>
      <div class="footer">
        &copy; 2025 EV Homes Construction Pvt. Ltd.<br />
        Need help? <a href="https://evhomes.tech/contact-us">Contact Support</a>
      </div>
    </div>
  </body>
</html>`;
};

export const siteVisitOtpTempleteV3 = ({ name, otp, imageUrl, location }) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Site Visit Verification</title>
    <style>
      body {
        margin: 0;
        font-family: "Segoe UI", sans-serif;
        background-color: #f9f9f9;
        color: #333;
      }

      .container {
        max-width: 400px;
        margin: 0 auto;
        background-color: #fff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .header {
        position: relative;
        height: 180px;
        width: 100%;
      }

      .header img {
        width: 100%;
        height: 100%;
        object-fit: cover; /* Ensures image covers the area without distortion */
        border-radius: 12px 12px 0 0;
      }

      .header h1 {
        position: absolute;
        bottom: 20px;
        left: 20px;
        margin: 0;
        font-size: 22px;
        color: white;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
      }

      .content {
        padding: 24px 20px;
        text-align: center;
      }

      .content p {
        margin-bottom: 16px;
        font-size: 15px;
        line-height: 1.5;
      }

      .otp-box {
        font-size: 28px;
        letter-spacing: 4px;
        font-weight: bold;
        padding: 14px;
        border: 2px dashed #ff9800;
        border-radius: 10px;
        background-color: #fffbe6;
        color: #e65100;
        margin: 20px auto;
        display: inline-block;
      }

      .footer {
        font-size: 12px;
        text-align: center;
        padding: 16px;
        color: #777;
        background-color: #f0f0f0;
      }

      .footer a {
        color: #ff9800;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <!-- Inline image -->
        <img
          src="${imageUrl}"
          alt="Sales Lounge Visit"
        />
      </div>
      <div class="content">
        <p>Dear <strong>${name}</strong>,</p>
        <p>
          You’re receiving this email because you visited our
          <strong>${location} Sales Lounge</strong>
          for a site visit. To verify and complete the check-in process, please
          use the OTP below:
        </p>
        <div class="otp-box">${otp}</div>
        <p>
          If you did not request this, please ignore the message or contact
          support.
        </p>
      </div>
      <div class="footer">
        &copy; 2025 EV Homes Construction Pvt. Ltd.<br />
        Need help? <a href="https://evhomes.tech/contact-us">Contact Support</a>
      </div>
    </div>
  </body>
</html>`;
};

export const visitTemplateV3 = ({
  header,
  clientName,
  phoneNumber,
  email,
  location,
  projects,
  requirement,
  team,
  closingManager,
  visitType = "",
  channelPartner,
  date,
  imageUrl,
}) => {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>New Site Visit Notification</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
        font-family: "Segoe UI", sans-serif;
      }
      .email-container {
        position: relative;
        max-width: 600px;
        margin: 30px auto;
        background-color: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        position: absolute;
        right: -8px;
        top: -29px;
        /* background-color: #004080; */
        padding: 16px;
      }
      .header img {
        max-width: 120px;
        height: auto;
      }
      .header h1 {
        color: #ffffff;
        font-size: 20px;
        margin: 12px 0 0;
      }
      .banner {
        width: 100%;
        display: block;
        max-height: 40vh;
        aspect-ratio: 16 /9;
      }
      .content {
        padding: 24px;
      }
      .content h2 {
        font-size: 18px;
        color: #004080;
        margin-bottom: 10px;
      }
      .content p {
        font-size: 15px;
        line-height: 1.6;
        color: #333333;
        margin-bottom: 16px;
      }
      .details-table {
        width: 100%;
        border-collapse: collapse;
      }
      .details-table td {
        padding: 8px;
        font-size: 14px;
        border-bottom: 1px solid #f0f0f0;
      }
      .details-table td:first-child {
        font-weight: bold;
        color: #004080;
        width: 150px;
      }
      .footer {
        font-size: 12px;
        text-align: center;
        color: #777;
        padding: 16px;
        background-color: #f0f0f0;
      }
      .footer a {
        color: #004080;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <img
          src="https://cdn.evhomes.tech/7ac9016b-0960-41e5-b3ef-ab2063acb8ee-ev_home_compress_logo.png"
          alt="EV Homes Logo"
        />
      </div>
      <img
        src="${
          imageUrl ??
          "https://cdn.evhomes.tech/f1710db4-8f34-49b0-b7af-f90e8bfd129c-Bird%20Eye%20view%20Final%20with%20rera%20and%20logo%20jpeg%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaWxlbmFtZSI6ImYxNzEwZGI0LThmMzQtNDliMC1iN2FmLWY5MGU4YmZkMTI5Yy1CaXJkIEV5ZSB2aWV3IEZpbmFsIHdpdGggcmVyYSBhbmQgbG9nbyBqcGVnICgxKS5wbmciLCJpYXQiOjE3MzMzODU1OTB9.LvoQwZlClIUIdjUx-hONJmlPrnLAA_XBiFNBWGLMvQE"
        }"
        alt="Sales Lounge"
        class="banner"
      />
      <div class="content">
        <h2>Hello ${closingManager},</h2>
        <p>
          A prospective client has visited the
          <strong>${location} Sales Lounge</strong> and completed the visitor
          registration form.
        </p>
        <p>Below are the client details for your attention and follow-up:</p>
        <table class="details-table">
          <tr>
            <td>Full Name:</td>
            <td>${clientName}</td>
          </tr>
          <tr>
            <td>Contact:</td>
            <td>${phoneNumber}</td>
          </tr>
          <tr>
            <td>Email:</td>
            <td>${email}</td>
          </tr>
          <tr>
            <td>Project:</td>
            <td>${projects}</td>
          </tr>
          <tr>
            <td>Requirement:</td>
            <td>${requirement}</td>
          </tr>
          <tr>
            <td>Channel Partner:</td>
            <td>${channelPartner}</td>
          </tr>
          <tr>
            <td>Date & Time:</td>
            <td>${date}</td>
          </tr>
          <tr>
            <td>Visit Type:</td>
            <td>${visitType}</td>
          </tr>
          <tr>
            <td>Closing Team:</td>
            <td>${team}</td>
          </tr>
          <tr>
            <td>Closing Manager:</td>
            <td>${closingManager}</td>
          </tr>
        </table>
      </div>
      <div class="footer">
        Warm regards, <br />
        <strong>EV Homes – Visitor Notification System</strong> <br />
        📍 ${location} Sales Lounge <br />
        ✉️
        <a href="mailto:evhomes.operations@evgroup.co.in"
          >evhomes.operations@evgroup.co.in</a
        >
        | 🌐 <a href="https://evhomes.tech">evhomes.tech</a>
      </div>
    </div>
  </body>
</html>
`;
};

export const paymentConfirmationTemplate = () => {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payment Confirmation</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        padding: 20px;
      }
      .email-container {
        max-width: 600px;
        /* margin: auto; */
        /* background: white; */
        padding: 20px;
        /* border-radius: 10px; */
        /* box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); */
        text-align: left;
      }
      p {
        line-height: 1.2;
      }
      .header {
        font-size: 24px;
        font-weight: bold;
        /* margin-bottom: 20px; */
        color: #333;
      }
      .sub-header {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 20px;
        color: #333;
      }

      .summary-table {
        width: 100%;
        border-collapse: collapse;
      }
      .summary-table th,
      .summary-table td {
        padding: 5px;
        border: 1.2px solid #535353;
        font-size: 12px;
      }
      .bold {
        font-weight: 700;
      }

      .summary-table th {
        background-color: #f8f8f8;
        color: #0f0f0f;
      }

      .strong-header-text {
        font-size: 15px;
      }

      .header-name {
        font-weight: 500;
        font-size: 15px;
        margin: 0;
        padding: 0;
      }
      .header-address {
        max-width: 265px;
        margin: 0;
        padding: 0;
      }
      .header-address-text {
        font-size: 15px;
        margin-top: 5px;
      }
      .first-line-gap {
        margin-left: 65px;
      }
      .footer-text {
        font-size: 15px;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <!-- header start -->
      <p class="strong-header-text"><strong>To,</strong></p>
      <p class="header-name">Mrs. Shubhangi Ashok Sawant</p>
      <p class="header-name">Mr. Ashok Mahadu Sawant</p>
      <div class="header-address">
        <p class="header-name header-address-text">
          Sahyadri Co.op.NOC., Ramnagar A, Near Shankar Mandir, Ghatkoper ( W )
          Mumbai- 400086
        </p>
      </div>
      <br />
      <!-- header end -->
      <p class="strong-header-text"><strong>Dear Sir,</strong></p>
      <p class="footer-text">
        <span class="first-line-gap"></span> We are pleased to welcome you to
        our EV Family and look toward to hand over your Dream Home at the
        Earliest
      </p>
      <!-- <br /> -->
      <p class="footer-text">
        We request you to kindly make the below mentioned payment in the manner
        mentioned for the confirmation of your booking and to proceed with the
        registration of your Dream Home
      </p>
      <!-- cost sheet table -->
      <table class="summary-table">
        <tr>
          <th>Perticulars</th>
          <th>Rs</th>
          <th>Amount</th>
          <th>Rounded</th>
        </tr>
        <tr>
          <td>Agreement Value</td>
          <td>Rs</td>
          <td>1,24,80,631</td>
          <td></td>
        </tr>
        <tr>
          <td>Stamp duty @ 6%</td>
          <td>Rs</td>
          <td>7,48,837</td>
          <td>7,48,840</td>
        </tr>
        <tr>
          <td>Registration</td>
          <td>Rs</td>
          <td>30,000</td>
          <td></td>
        </tr>
        <tr>
          <td>GST @ 5% inclusive</td>
          <td>Rs</td>
          <td>6,24,032</td>
          <td></td>
        </tr>
        <tr>
          <td style="font-weight: bold">Total</td>
          <td style="font-weight: bold">Rs</td>
          <td style="font-weight: bold">1,38,83,500</td>
          <td style="font-weight: bold"></td>
        </tr>

        <tr>
          <td style="font-weight: bold">Adjusted for Stampduty</td>
          <td style="font-weight: bold">Rs</td>
          <td style="font-weight: bold">-</td>
          <td style="font-weight: bold">3</td>
        </tr>
      </table>
      <br />

      <p class="footer-text">
        GST is reconciled on monthly basis and delay in making payment to us
        will attract interest and penalty, the same will be charged on you at
        the rate as applicable time to time (i.e., Govt. rate).
      </p>
      <p class="footer-text">
        <strong>Kindly note:- </strong> delay in payment mentioned above may
        attract Late Payment Charges.
      </p>
    </div>
  </body>
</html>
`;
};

export const sitevisitTodayEmalTemplete = ({ leads = [], teamLeader }) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Client Site Visits</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
      }

      p {
        margin: 10px 15px;
        font-size: 14px;
        line-height: 1.5;
      }

      .card-container {
        margin: 20px 15px 30px 15px;
      }

      .card {
        background: #ffffff;
        border: 1px solid #ddd;
        padding: 15px;
        margin-bottom: 15px;
        border-radius: 6px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        font-size: 14px;
        line-height: 1.6;
      }

      .card p {
        margin: 5px 0;
      }

      .card strong {
        color: #5b2c6f;
      }
    </style>
  </head>
  <body>
    <p>
      Dear
      <strong
        >${teamLeader?.firstName ?? ""} ${teamLeader?.lastName ?? ""}'s
        Team</strong
      >,
    </p>

    <p>
      As per the latest feedback from our clients, site visits have been
      scheduled today (${moment()
        .tz("Asia/Kolkata")
        .format("DD-MM-YYYY")}). Kindly find the client details below:
    </p>

    <p><strong>Total Site Visit Schedule:</strong> ${leads?.length ?? 0}</p>

    <div class="card-container">
      ${leads
        .map((ele) => {
          let source = ele?.leadType;
          let taggingOver = false;
          if (source === "cp") {
            const now = moment();
            const endDate = moment(ele?.validTill);
            taggingOver = endDate.isBefore(now);
            source = taggingOver
              ? `${ele.channelPartner?.firmName} (tagging-over)`
              : `${ele.channelPartner?.firmName} (CP)`;
          }
          return `
      <div class="card">
        <p>
          <strong>Client Name:</strong> ${ele?.firstName ?? ""} ${
            ele?.lastName ?? ""
          }
        </p>
        <p>
          <strong>Mobile Number:</strong> ${ele?.countryCode ?? ""}
          ${ele?.phoneNumber ?? ""}
        </p>
        <p>
          <strong>Lead Assign Date:</strong>
          ${formatedDateOnly(ele?.cycle?.startDate)}
        </p>
        <p>
          <strong>Visit Deadline:</strong>
          ${formatedDateOnly(ele?.cycle?.validTill)}
        </p>
        <p><strong>Source:</strong> ${source ?? "NA"}</p>
        <p>
          <strong>Scheduled By:</strong> ${
            ele?.taskRef?.assignTo?.firstName ?? ""
          } ${ele?.taskRef?.assignTo?.lastName ?? ""}
        </p>
        <p>
          <strong>App Link:</strong>
          <a href="https://evhomes.tech/closing-manager-lead-details/${
            ele._id
          }">https://evhomes.tech/closing-manager-lead-details/${ele._id}</a>
        </p>
      </div>
      `;
        })
        .join("")}
    </div>

    <p>
      Please ensure each client is warmly welcomed and given a complete
      walkthrough of the site. It is important that the visit takes place
      smoothly and all queries are addressed during the visit.
    </p>

    <p>
      Let’s make sure we create a positive experience and move closer to the
      closure.
    </p>

    <p>For any assistance, feel free to reach out.</p>

    <p style="margin: 30px 15px">
      Best Regards,<br />
      <strong>EV Homes Constructions</strong>
    </p>
  </body>
</html>
`;
};

export const paymentReminderTemplate = ({ leads = [] }) => {
  const todayStr = moment().tz("Asia/Kolkata").format("DD/MM/YYYY");
  const tomorrowStr = moment()
    .tz("Asia/Kolkata")
    .add(1, "day")
    .format("DD/MM/YYYY");

  // Group by payment type + due date
  const grouped = {};

  leads.forEach((lead) => {
    const payments = [
      { label: "Payment 1", date: lead.paymentOneDueDate },
      { label: "Payment 2", date: lead.paymentTwoDueDate },
      { label: "Payment 3", date: lead.paymentThreeDueDate },
      { label: "Payment 4", date: lead.paymentFourDueDate },
    ];

    payments.forEach(({ label, date }) => {
      if (!date) return;

      const formatted = moment(date).tz("Asia/Kolkata").format("DD/MM/YYYY");
      const when =
        formatted === todayStr
          ? "today"
          : formatted === tomorrowStr
            ? "tomorrow"
            : null;

      if (!when) return;

      const key = `${label} due ${when} (${formatted})`;

      if (!grouped[key]) grouped[key] = [];

      if (!grouped[key].some((l) => l._id === lead._id)) {
        grouped[key].push(lead);
      }
    });
  });

  // Build HTML without Object.entries
  let htmlSections = "";

  for (const key in grouped) {
    const items = grouped[key];
    htmlSections += `
      <h2>${key}</h2>
      <div class="reminder">
        <span class="payment-type">Kindly check and ensure follow-up</span>.
      </div>
      <table>
        <thead>
          <tr>
            <th>Customer Name</th>
            <th>Phone No</th>
            <th>Unit No</th>
            <th>Closing Manager</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (lead) => `
            <tr>
              <td>${lead.firstName || ""} ${lead.lastName || ""}</td>
              <td>${lead.phoneNumber || ""}</td>
              <td>${lead.unitNo || ""}</td>
              <td>${lead.closingManager?.firstName || ""} ${lead.closingManager?.lastName || ""}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Payment Reminder</title>
      <style>
        body {
          font-family: system-ui, sans-serif;
          margin: 40px;
          color: #222;
          background-color: #f9f9f9;
        }
        h1 { margin-bottom: 20px; }
        h2 {
          color: #333;
          margin-top: 40px;
          border-bottom: 2px solid #ddd;
          padding-bottom: 5px;
        }
        p { font-size: 16px; margin: 12px 0; }
        .reminder { margin-left: 20px; font-size: 16px; }
        table {
          border-collapse: collapse;
          width: 90%;
          margin: 12px 0 30px 20px;
          background: white;
          box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
        }
        th, td {
          border: 1px solid #ccc;
          padding: 8px;
          text-align: center;
          vertical-align: middle;
        }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #fafafa; }
        .payment-type { font-weight: bold; color: #333; }
      </style>
    </head>
    <body>
      <h1>Payment Due Summary</h1>
      ${htmlSections}
      <p style="margin: 30px 15px">
        Best Regards,<br />
        <strong>EV Homes Constructions</strong>
      </p>
    </body>
    </html>
  `;
};

export const solarisLeadTemplate = ({ type, email, name, phoneNumber }) => {
  // let cpInfo = "";
  // if (channelPartner)
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Solaris Lead</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
        color: #333;
      }
      .container {
        width: 100%;
        max-width: 600px;
        background-color: #ffffff;
        overflow: hidden;
      }
      .header {
        text-align: center;
        color: #ffffff;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
      }
      .content {
        /* padding: 20px; */
        line-height: 10px;
      }
      .subject {
        font-weight: 500;
      }
      .subject .span-s {
        font-weight: 600;
      }
      .content p {
        font-size: 16px;
        /* margin-bottom: 20px; */
      }
      .footer {
        padding: 20px;
        background-color: #f1f1f1;
        font-size: 12px;
        color: #666;
      }
      .footer a {
        color: #ff9800; /* Orange theme */
        text-decoration: none;
      }
      .content .details-para {
        font-size: 16px;
      }
      .info-para {
        font-size: 16px;
        font-weight: 700;
      }
      .info-span {
        font-size: 14px;
        font-weight: 400;
      }
      .para-sir {
        font-size: 16px;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="content">
        <p class="para-sir">Dear sir,</p>
        <p class="subject">
          <span> New Lead Recieved for Solaris</span>
          <span class="span-s"> ${type} </span>
        </p>
        <p class="details-para">Details of client are mentioned below.</p>
        <p class="info-para">
          Client Name: <span class="info-span">${name}</span>
        </p>
        <p class="info-para">
          Client Number: <span class="info-span">${phoneNumber}</span>
        </p>
        <p class="info-para">
          Email: <span class="info-span">${email}</span>
        </p>
        <p class="info-para">
          Project: <span class="info-span">Solaris ${type}</span>
        </p>
      </div>
      <div class="footer">
        <p>&copy; 2026 EV Homes Construction PVT LTD. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`;
};
