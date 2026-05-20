import nodemailer from 'nodemailer';
import { EMAIL_USER, EMAIL_PASS } from '../config/configEnv.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

