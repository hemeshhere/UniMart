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
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fafbfc; padding: 40px 20px; margin: 0;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
          
          <div style="background-color: #1c2438; padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
              Uni<span style="color: #f97316;">Mart</span>
            </h1>
            <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 14px;">Campus Food Network</p>
          </div>

          <div style="padding: 40px 30px;">
            <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 22px;">${options.subject}</h2>
            
            <p style="margin: 0 0 30px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
              ${options.message}
            </p>

            <div style="background-color: #fff7ed; border: 2px dashed #fed7aa; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 30px;">
              <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #ea580c;">${options.otp}</span>
            </div>

            <p style="margin: 0; color: #ef4444; font-size: 14px; font-weight: 600; text-align: center;">
              ⏳ This code expires in 10 minutes.
            </p>
          </div>

          <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
              If you didn't request this code, you can safely ignore this email.<br/>
              © ${new Date().getFullYear()} UniMart Technologies. All rights reserved.
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