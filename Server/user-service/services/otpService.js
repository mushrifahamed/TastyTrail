const twilio = require("twilio");
const crypto = require("crypto");

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } =
  process.env;

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

module.exports = {
  generateOTP: () => {
    return crypto.randomInt(100000, 999999).toString();
  },

  sendOTP: async (phoneNumber, otp) => {
    try {
      await client.messages.create({
        body: `Your food delivery app verification code is: ${otp}`,
        from: TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
      return true;
    } catch (error) {
      console.error("Error sending OTP:", error);
      return false;
    }
  },

  verifyOTP: (user, otp) => {
    return (
      user.phoneVerificationOTP === otp &&
      user.phoneVerificationOTPExpires > Date.now()
    );
  },
};
