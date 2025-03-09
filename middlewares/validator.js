const joi = require("joi");

exports.signupSchema = joi.object({
    email: joi.string()
        .min(6)
        .max(60)
        .required()
        .email({
            tlds: {allow: ['com', 'net']},
        }),
    password: joi.string()
        .required()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$'))
}); 
exports.signinSchema = joi.object({
    email: joi.string()
        .min(6)
        .max(60)
        .required()
        .email({
            tlds: {allow: ['com', 'net']},
        }),
    password: joi.string()
        .required()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$'))
});

exports.acceptCodeSchema = joi.object({
    email: joi.string()
        .min(6)
        .max(60)
        .required()
        .email({
            tlds: { allow: ['com', 'net'] },
        }),
    providedCode: joi.number().required(), // Số nguyên, bắt buộc
});

exports.changePasswordSchema = joi.object({
    newPassword: joi.string()
        .required()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$')),
    oldPassword: joi.string()
        .required()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$')),
});

exports.acceptCodeFPSchema = joi.object({
    email: joi.string()
        .min(6)
        .max(60)
        .required()
        .email({
            tlds: { allow: ['com', 'net'] },
        }),
    providedCode: joi.number().required(),
    newPassword: joi.string()
        .required()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$')),
});

exports.createPostSchema = joi.object({
    title: joi.string()
        .min(6)
        .max(60)
        .required(),
    description: joi.string()
        .min(6)
        .max(600)
        .required(),
    userId: joi.string().required()
});

exports.createProductSchema = joi.object({
    name: joi.string()
        .min(6)
        .max(60)
        .required(),
    category: joi.string()
        .min(3)
        .max(50)
        .required(),
    quantity: joi.number().positive().required(), // Ensure quantity is a positive number
    price: joi.number().positive().required() // Ensure price is a positive number
})
