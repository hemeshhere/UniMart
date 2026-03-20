// const nodemailer = require('nodemailer');

// const sendEmail = async (options) => {
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
//   });

//   const message = {
//     from: `${process.env.FROM_NAME} <${process.env.EMAIL_USER}>`,
//     to: options.email,
//     subject: options.subject,
//     text: options.message
//   };

//   await transporter.sendMail(message);
// };
// module.exports = sendEmail;

//Using brevo for mail services
const SibApiV3Sdk = require('sib-api-v3-sdk');
const sendEmail = async (options) => {
  try {
    // 1. Configure API Key
    const client = SibApiV3Sdk.ApiClient.instance;
    const apiKey = client.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

    // 2. Email Template
    const htmlTemplate = `
  <div style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
    
    <div style="max-width:520px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <div style="background:#007bff; padding:20px; text-align:center;">
        <h1 style="color:#ffffff; margin:0; font-size:22px;">
          ${process.env.FROM_NAME}
        </h1>
      </div>

      <!-- Body -->
      <div style="padding:30px; text-align:center;">
        
        <p style="font-size:16px; color:#555; margin-bottom:10px;">
          Your One-Time Password (OTP)
        </p>

        <div style="display:inline-block; background:#f1f5ff; padding:15px 25px; border-radius:8px; margin:20px 0;">
          <span style="font-size:28px; letter-spacing:6px; color:#007bff; font-weight:bold;">
            ${options.message}
          </span>
        </div>

        <p style="color:#555; font-size:14px;">
          This OTP is valid for <b>5 minutes</b>.
        </p>

      </div>

      <!-- Footer -->
      <div style="padding:20px; text-align:center; border-top:1px solid #eee;">
        <p style="font-size:12px; color:#999; margin:0;">
          If you did not request this, please ignore this email.
        </p>
      </div>

    </div>

  </div>
`;

    // 3. Email Config
    const message = {
      sender: {
        email: process.env.EMAIL_USER,
        name: process.env.FROM_NAME
      },
      to: [
        {
          email: options.email
        }
      ],
      subject: options.subject,
      textContent: `Your OTP is ${options.message}`,
      htmlContent: htmlTemplate
    };
    await tranEmailApi.sendTransacEmail(message);
  } catch (error) {
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;