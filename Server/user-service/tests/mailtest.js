// ./server/user-service/services/emailService.js (Mock)
async function sendEmail(to, subject, text, html) {
  const fakeInfo = {
    messageId: "mocked-message-id-123",
    envelope: {
      from: "mock@tastytrail.dev",
      to: to.split(",").map((email) => email.trim()),
    },
    accepted: [to],
    rejected: [],
    pending: [],
    response: "250 Mock OK: queued as MOCK12345",
    previewUrl: "https://ethereal.email/mock-preview-url",
  };

  console.log("MOCK: Message sent:", fakeInfo.messageId);
  console.log("MOCK: Preview URL:", fakeInfo.previewUrl);
  return fakeInfo;
}

module.exports = { sendEmail };
