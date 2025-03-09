const { createPostSchema } = require('../middlewares/validator');
const postService = require('../services/postService');
const { AppError } = require('../middlewares/errorHandler');

exports.getPosts = async (req, res, next) => {
    try {
        const { page } = req.query;
        const posts = await postService.getAllPosts(page);
        
        res.status(200).json({
            success: true, 
            message: 'All posts', 
            data: posts
        });
    } catch (error) {
        next(error);
    }
};

exports.singlePost = async (req, res, next) => {
    try {
        const { _id } = req.query;
        const post = await postService.getPostById(_id);
        
        res.status(200).json({
            success: true, 
            message: 'Single Post', 
            data: post
        });
    } catch (error) {
        next(error);
    }
};

exports.createPost = async (req, res, next) => {
    try {
        const { title, description } = req.body;
        const { userId } = req.user;

        const { error } = createPostSchema.validate({
            title,
            description,
            userId,
        });

        if (error) {
            throw new AppError(error.details[0].message, 401);
        }

        const post = await postService.createPost(title, description, userId);
        
        res.status(201).json({
            success: true, 
            message: 'Created', 
            data: post
        });
    } catch (error) {
        next(error);
    }
};

exports.updatePost = async (req, res, next) => {
    try {
        const { _id } = req.query;
        const { title, description } = req.body;
        const { userId } = req.user;

        const { error } = createPostSchema.validate({
            title, 
            description, 
            userId
        });

        if (error) {
            throw new AppError(error.details[0].message, 401);
        }

        const updatedPost = await postService.updatePost(_id, title, description, userId);
        
        res.status(200).json({
            success: true, 
            message: 'Updated', 
            data: updatedPost
        });
    } catch (error) {
        next(error);
    }
};

exports.deletePost = async (req, res, next) => {
    try {
        const { _id } = req.query;
        const { userId } = req.user;

        await postService.deletePost(_id, userId);
        
        res.status(200).json({
            success: true, 
            message: 'Post Deleted'
        });
    } catch (error) {
        next(error);
    }
};