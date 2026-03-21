import twilio from "twilio";
import Worker from "../models/worker.model.js";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;
if (accountSid && authToken) {
    twilioClient = twilio(accountSid, authToken);
}

async function sendSMS(to, message) {
    if (!twilioClient) {
        console.log("Twilio not configured. SMS not sent.");
        return;
    }
    try {
        // Commented out to prevent accidental SMS charges during development
        // await twilioClient.messages.create({ body: message, from: twilioPhone, to });
        // console.log(`SMS sent to ${to}: ${message}`);
    } catch (err) {
        console.log(`Failed to send SMS to ${to}:`, err.message);
    }
}

async function sendSMSForWorkers(workerIds) {
    try {
        const workers = await Worker.find({ _id: { $in: workerIds } });
        for (const worker of workers) {
            const phone = "+919531670207";
            const message = `ALERT: Worker ${worker._id} (Helmet: ${worker.helmetId || "N/A"}) is in a High Risk Zone!`;
            sendSMS(phone, message);
        }
    } catch (err) {
        console.log("Error in sendSMSForWorkers:", err.message);
    }
}

export { sendSMSForWorkers };
