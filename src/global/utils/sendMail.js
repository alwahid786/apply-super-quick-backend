import nodemailer from "nodemailer";
import { getEnv } from "../configs/config.js";

const transporter = nodemailer.createTransport({
  host: getEnv("NODEMAILER_HOST"),
  port: parseInt(getEnv("NODEMAILER_PORT")),
  auth: {
    user: getEnv("NODEMAILER_USER"),
    pass: getEnv("NODEMAILER_PASSWORD"),
  },
});

const sendMail = async (to, subject, text, html = false) => {
  try {
    if (!to || !subject || !text) throw new Error("Please Provide To, Subject and Text");
    const myTransPorter = transporter;
    await myTransPorter.sendMail({
      from: getEnv("NODEMAILER_FROM"),
      to,
      subject,
      text: html ? undefined : text,
      html: html ? text : undefined,
    });
    return true;
  } catch (error) {
    console.log("error while sending mail", error);
    return false;
  }
};

export { sendMail };
