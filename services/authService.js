const User = require('../models/userModel');
const { doHash, doHashValidation, hmacProcess } = require('../utils/hashing');
const transport = require('../middlewares/sendMail');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

class AuthService {
  async signup(email, password) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User already exists!', 401);
    }

    const hashedPassword = await doHash(password, 12);
    const newUser = new User({
      email,
      password: hashedPassword,
    });

    const result = await newUser.save();
    result.password = undefined;
    return result;
  }

  async signin(email, password) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('User does not exist!', 401);
    }

    const isValidPassword = await doHashValidation(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials!', 401);
    }

    return user;
  }

  async sendVerificationCode(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('User does not exist!', 404);
    }

    if (user.verified) {
      throw new AppError('User is already verified!', 400);
    }

    const codeValue = Math.floor(Math.random() * 1000000).toString();
    
    try {
      const info = await transport.sendMail({
        from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
        to: user.email,
        subject: 'Verification code',
        html: '<h1>' + codeValue + '</h1>'
      });

      if (info.accepted[0] === user.email) {
        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
        user.verificationCode = hashedCodeValue;
        user.verificationCodeValidation = Date.now();
        await user.save();
        return true;
      }
      throw new AppError('Failed to send verification code!', 400);
    } catch (error) {
      logger.error('Error sending verification code:', error);
      throw new AppError('Failed to send verification code!', 500);
    }
  }

  // Add other service methods here...
}

module.exports = new AuthService(); 