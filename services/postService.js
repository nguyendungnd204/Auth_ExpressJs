const Post = require('../models/postModel');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

class PostService {
    async getAllPosts(page) {
        const postsPerPage = 10;
        const pageNum = page <= 1 ? 0 : page - 1;
        
        const posts = await Post.find()
            .sort({createdAt: -1})
            .skip(pageNum * postsPerPage)
            .limit(postsPerPage)
            .populate({
                path: 'userId',
                select: 'email',
            });
            
        return posts;
    }

    async getPostById(_id) {
        const post = await Post.findOne({ _id }).populate({
            path:'userId', 
            select:'email'
        });
        
        if (!post) {
            throw new AppError('Post unavailable', 404);
        }
        
        return post;
    }

    async createPost(title, description, userId) {
        const post = await Post.create({
            title, 
            description, 
            userId,
        });
        
        logger.info(`New post created by user ${userId}`);
        return post;
    }

    async updatePost(_id, title, description, userId) {
        const post = await Post.findOne({ _id });
        
        if (!post) {
            throw new AppError('Post unavailable', 404);
        }
        
        if (post.userId.toString() !== userId) {
            throw new AppError('Unauthorized', 403);
        }
        
        post.title = title;
        post.description = description;
        
        const updatedPost = await post.save();
        logger.info(`Post ${_id} updated by user ${userId}`);
        
        return updatedPost;
    }

    async deletePost(_id, userId) {
        const post = await Post.findOne({ _id });
        
        if (!post) {
            throw new AppError('Post not found', 404);
        }
        
        if (post.userId.toString() !== userId) {
            throw new AppError('Unauthorized', 403);
        }
        
        await Post.deleteOne({ _id });
        logger.info(`Post ${_id} deleted by user ${userId}`);
        
        return true;
    }
}

module.exports = new PostService(); 