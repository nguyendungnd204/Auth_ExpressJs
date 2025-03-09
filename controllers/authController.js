const transport = require("../middlewares/sendMail");
const { signupSchema, signinSchema, acceptCodeSchema, changePasswordSchema, acceptCodeFPSchema } = require("../middlewares/validator");
const User = require("../models/userModel");
const {doHash, doHashValidation, hmacProcess} = require("../utils/hashing");
const jwt = require("jsonwebtoken");
const authService = require("../services/authService");
const logger = require("../utils/logger");
const { AppError } = require("../middlewares/errorHandler");

exports.signup = async (req, res, next) => {
    try {
        const {email, password} = req.body;
        const {error} = signupSchema.validate({email, password});

        if(error) {
            throw new AppError(error.details[0].message, 401);
        }

        const result = await authService.signup(email, password);
        logger.info(`New user registered: ${email}`);

        res.status(201).json({
            success: true, 
            message: "Your account has been created successfully!", 
            result
        });
    } catch (error) {
        next(error);
    }
};

exports.signin = async (req, res, next) => {
    try {
        const {email, password} = req.body;
        const {error} = signinSchema.validate({email, password});
        
        if(error) {
            throw new AppError(error.details[0].message, 401);
        }

        const user = await authService.signin(email, password);
        
        const token = jwt.sign({
            userId: user._id,
            email: user.email,
            verified: user.verified,
        }, process.env.TOKEN_SECRET, {
            expiresIn: '8h',
        });

        logger.info(`User logged in: ${email}`);

        res.cookie('Authorization', 'Bearer ' + token, {
            expires: new Date(Date.now() + 8 * 3600000),
            httpOnly: process.env.NODE_ENV === 'production',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        }).json({
            success: true,
            token,
            message: 'Logged in successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.logout = async (req, res) => {
    logger.info(`User logged out: ${req.user?.email}`);
    res.clearCookie('Authorization', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }).status(200).json({
        success: true, 
        message: 'Logged out successfully'
    });
};

exports.sendVerificationCode = async (req, res) => {
    const {email} = req.body;
    try {
        const existingUser = await User.findOne({email});
        if(!existingUser) {
            return res
                .status(404)
                .json({success: false, message: 'User does not exists!'});
        }
        if(existingUser.verified){
            return res
                .status(400)
                .json({success: false, message: 'You are already verified!'})
        }
        const codeValue = Math.floor(Math.random() * 1000000).toString();
        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject:"verification code",
            html:'<h1>' + codeValue + '</h1>'
        });

        if(info.accepted[0] === existingUser.email){
            const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
            existingUser.verificationCode = hashedCodeValue;
            existingUser.verificationCodeValidation = Date.now();
            await existingUser.save();
            return res.status(200).json({success: true, message: "Code sent!"});
        }
        res.status(400).json({success: false, message:'Code sent failded!'});
    } catch (error) {
        console.log(error);
    }
};

exports.verifyVerificationCode = async (req, res) => {
    const {email, providedCode} = req.body;
    try {
        const {error, value} = acceptCodeSchema.validate({email, providedCode});
        if(error){
            return res
                .status(401)
                .json({success: false, message: error.details[0].message});
        }

        const codeValue = providedCode.toString();
        const existingUser = await User.findOne({email}).select("+verificationCode +verificationCodeValidation");

        if(!existingUser){
            return res
                .status(401)
                .json({success: false, message:'User does not exists!'});
        }
        if(existingUser.verified){
            return res.status(400).json({success: false, message:"you are already"});
        }
        if(!existingUser.verificationCode || !existingUser.verificationCodeValidation){
            return res.status(400).json({success: false, message: "Something is wrong with the code"})
        }
        if(Date.now() - existingUser.verificationCodeValidation > 5*60*1000){
            return res
                .status(400)
                .json({success: false, message:'code has been expired'});
        }

        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
        
        if(hashedCodeValue === existingUser.verificationCode){
            existingUser.verified = true;
            existingUser.verificationCode = undefined;
            existingUser.verificationCodeValidation = undefined;
            
            await existingUser.save();
            return res
            .status(200)
            .json({success: true, message:'your account has been verified!'});
        }
        return res
            .status(400)
            .json({success: false, message:'unexpected occured!'});
    } catch (error) {
        console.log(error);
    }
};

exports.changePassword = async (req, res) => {
    const {userId, verified} = req.user;
    const {oldPassword, newPassword} = req.body;
    console.log("Client:", req.headers.client);
    console.log("Authorization Header:", req.headers.authorization);
    console.log("Cookies:", req.cookies);
    try {
        const {error} = changePasswordSchema.validate({oldPassword, newPassword});
        if(error){
            return res
                .status(401)
                .json({success: false, message: error.details[0].message});
        }
        if(!verified) {
            return res
                .status(401)
                .json({success: false, message: 'You are not verified user!'});
        }
        const existingUser = await User.findOne({_id: userId}).select('+password');
        if(!existingUser){
            return res
                .status(401)
                .json({success: false, message:'User does not exists!'});
        }
        const result = await doHashValidation(oldPassword, existingUser.password);
        if(!result) {
            return res
                .status(401)
                .json({success: false, message: 'Invalid credentials!'});
        }
        const hashedPassword = await doHash(newPassword, 12);
        existingUser.password = hashedPassword;
        await existingUser.save();
        return res
            .status(200)
            .json({success: true, message:'Password updated!'});
    } catch (error) {
        console.log(error);
    }
};
exports.sendForgotPasswordCode = async (req, res) => {
    const {email} = req.body;
    try {
        const existingUser = await User.findOne({email});
        if(!existingUser) {
            return res
                .status(404)
                .json({success: false, message: 'User does not exists!'});
        }
        const codeValue = Math.floor(Math.random() * 1000000).toString();
        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject:"Forgot password code",
            html:'<h1>' + codeValue + '</h1>'
        });

        if(info.accepted[0] === existingUser.email){
            const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
            existingUser.forgotPasswordCode = hashedCodeValue;
            existingUser.forgotPasswordCodeValidation = Date.now();
            await existingUser.save();
            return res.status(200).json({success: true, message: "Code sent!"});
        }
        res.status(400).json({success: false, message:'Code sent failded!'});
    } catch (error) {
        console.log(error);
    }
};

exports.verifyForgotPasswordCode = async (req, res) => {
    const {email, providedCode, newPassword} = req.body;
    try {
        const {error, value} = acceptCodeFPSchema.validate({email, providedCode, newPassword});
        if(error){
            return res
                .status(401)
                .json({success: false, message: error.details[0].message});
        }

        const codeValue = providedCode.toString();
        const existingUser = await User.findOne({email}).select("+forgotPasswordCode +forgotPasswordCodeValidation");

        if(!existingUser){
            return res
                .status(401)
                .json({success: false, message:'User does not exists!'});
        }
        if(!existingUser.forgotPasswordCode || !existingUser.forgotPasswordCodeValidation){
            return res.status(400).json({success: false, message: "Something is wrong with the code"})
        }
        if(Date.now() - existingUser.verificationCodeValidation > 5*60*1000){
            return res
                .status(400)
                .json({success: false, message:'code has been expired'});
        }

        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
        
        if(hashedCodeValue === existingUser.forgotPasswordCode){
            const hashedPassword = await doHash(newPassword, 12);
            existingUser.password = hashedPassword;
            existingUser.forgotPasswordCode = undefined;
            existingUser.forgotPasswordCodeValidation = undefined;
            
            await existingUser.save();
            return res
            .status(200)
            .json({success: true, message:'password updated!'});
        }
        return res
            .status(400)
            .json({success: false, message:'unexpected occured!'});
    } catch (error) {
        console.log(error);
    }
};