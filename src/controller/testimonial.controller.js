import testimonialModel from "../model/testimonial.model.js";
import { errorRes, successRes } from "../model/response.js";
import { RedisService } from "../app/redis.js";

export const getTestimonial = async (req, res) => {
  try {
    const cached = await RedisService.get("testimonials", true);

    if (cached != null) {
      //
      return res.send(
        successRes(200, "Get testimonilas - cached", {
          data: cached,
        })
      );
    }

    const respTesti = await testimonialModel
      .find()
      .populate({ path: "project", select: "name locationName locationLink" });

    const cacheNew = await RedisService.set("testimonials", respTesti, 86400); // 24 hr cache

    return res.send(
      successRes(200, "Get Testimonial", {
        data: respTesti,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const getTestimonialById = async (req, res) => {
  const id = req.params.id;

  try {

 const cached = await RedisService.get("testimonials", true);

    if (cached != null) {
      //
      return res.send(
        successRes(200, "Get testimonilas - cached", {
          data: cached,
        })
      );
    }


    const respTesti = await testimonialModel
      .findById(id)
      .populate({ path: "project", select: "name locationName locationLink" });
    const cacheNew = await RedisService.set("testimonials", respTesti, 86400); // 24 hr cache

    return res.send(
      successRes(200, "Get Testimonial", {
        data: respTesti,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const getTestiomonialById = async (req, res, next) => {
  const projects = req.params.projects ?? req.params.project;

  try {
     const cached = await RedisService.get("testimonials", true);

    if (cached != null) {
      //
      return res.send(
        successRes(200, "Get testimonilas - cached", {
          data: cached,
        })
      );
    }


    if (!projects) return res.send(errorRes(403, "projects is required"));

    const respTest = await testimonialModel
      .find({ projec: projects })
      .populate({
        select: "name locationName locationLink",
        path: "project",
      });

    if (!respTest)
      return res.send(
        successRes(404, `Projects not found with id:${projects}`, {
          data: respTest,
        })
      );
    const cacheNew = await RedisService.set("testimonials", respTest, 86400); // 24 hr cache


    return res.send(
      successRes(200, "Similar Leads", {
        data: respTest,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const addTestimonial = async (req, res) => {
  const body = req.body;

  const { title, videoUrl, thumbnail, project } = body;

  try {
    if (!body) return res.send(errorRes(403, "testimonial is required"));

    const newTestimonial = await testimonialModel.create({
      ...body,
    });
    await newTestimonial.save();
    const cached = await RedisService.del("testimonials");


    const newTest = await testimonialModel
      .findById(newTestimonial.id)
      .populate({ path: "project", select: "name locationName locationLink" });

    return res.send(
      successRes(200, `testimonial added successfully: ${title} ${project}`, {
        data: newTest,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const addMultipleTestimonial = async (req, res) => {
  const body = req.body;

  const { testimonials } = body;

  try {
    if (!body) return res.send(errorRes(403, "testimonial is required"));
    await Promise.all(
      testimonials.map(async (ele) => {
        await testimonialModel.create({
          ...ele,
        });
      })
    );

    const newTest = await testimonialModel
      .find()
      .populate({ path: "project", select: "name locationName locationLink" });

    const cached = await RedisService.del("testimonials");
    

    return res.send(
      successRes(200, `testimonial added successfully: `, {
        data: newTest,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const updateLikesOnTestimonial = async (req, res) => {
  const id = req.params.id;
  const { role, userId, type } = req.body;

  try {
    if (!req.body) return res.send(errorRes(403, "Request body is required"));
    if (!["like", "dislike"].includes(type)) {
      return res.send(errorRes(400, "Type must be 'like' or 'dislike'"));
    }

    // First, check if the user has already liked/disliked this testimonial
    const testimonial = await testimonialModel.findById(id);
    if (!testimonial) {
      return res.send(errorRes(404, "Testimonial not found"));
    }

    // Determine the field to check based on role
    const userField =
      role === "employee"
        ? "employee"
        : role === "channel-partner"
        ? "channelPartner"
        : role === "client"
        ? "client"
        : null;

    if (!userField) {
      return res.send(errorRes(400, "Invalid role provided"));
    }

    // Check if user already has a like/dislike entry
    const existingLikeIndex = testimonial.likes.findIndex(
      (like) => like[userField] && like[userField].toString() === userId
    );

    let updateOperation;

    if (existingLikeIndex >= 0) {
      // User already has a like/dislike - update it
      const existingType = testimonial.likes[existingLikeIndex].type;

      // If same type, remove the like/dislike
      if (existingType === type) {
        // Remove the like entry
        updateOperation = {
          $pull: { likes: { _id: testimonial.likes[existingLikeIndex]._id } },
          $inc: { [type]: -1 }, // Decrement the count
        };
      } else {
        // Change from like to dislike or vice versa
        updateOperation = {
          $set: { [`likes.${existingLikeIndex}.type`]: type },
          $inc: {
            [existingType]: -1, // Decrement previous type
            [type]: 1, // Increment new type
          },
        };
      }
    } else {
      // User hasn't liked/disliked yet - add new entry
      const newLike = {
        type,
        role,
        [userField]: userId,
      };

      updateOperation = {
        $push: { likes: newLike },
        $inc: { [type]: 1 },
      };
    }

    // Perform the update
    const updatedTestimonial = await testimonialModel
      .findByIdAndUpdate(
        id,
        updateOperation,
        { new: true } // Return the updated document
      )
      .populate({ path: "project", select: "name locationName locationLink" });

    const cached = await RedisService.del("testimonials");


    return res.send(
      successRes(200, `Testimonial updated successfully`, {
        data: updatedTestimonial,
      })
    );
  } catch (error) {
    console.error("Error updating testimonial:", error);
    return res.send(errorRes(500, error.message || "Server error"));
  }
};

// Add a comment to a testimonial
export const addCommentToTestimonial = async (req, res) => {
  const testimonialId = req.params.id;
  const { message, role, userId } = req.body;

  try {
    if (!message) {
      return res.send(errorRes(400, "Comment message is required"));
    }

    if (!role || !userId) {
      return res.send(errorRes(400, "User role and ID are required"));
    }

    // Determine which user field to set based on role
    let userField;
    if (role === "employee") {
      userField = "employee";
    } else if (role === "channel-partner") {
      userField = "channelPartner";
    } else if (role === "client") {
      userField = "client";
    } else {
      return res.send(errorRes(400, "Invalid role provided"));
    }

    // Create the comment object
    const newComment = {
      message,
      role,
      [userField]: userId,
      date: new Date(),
      isLiked: null,
      likes: 0,
      replies: [],
    };

    // Add the comment to the testimonial
    const updatedTestimonial = await testimonialModel
      .findByIdAndUpdate(
        testimonialId,
        { $push: { comments: newComment } },
        { new: true }
      )
      .populate({ path: "project", select: "name locationName locationLink" });

    if (!updatedTestimonial) {
      return res.send(errorRes(404, "Testimonial not found"));
    }

    const cached = await RedisService.del("testimonials");


    return res.send(
      successRes(200, "Comment added successfully", {
        data: updatedTestimonial,
      })
    );
  } catch (error) {
    console.error("Error adding comment:", error);
    return res.send(errorRes(500, error.message || "Server error"));
  }
};

// Add a reply to a comment
export const addReplyToComment = async (req, res) => {
  const testimonialId = req.params.testimonialId;
  const commentId = req.params.commentId;
  const { message, role, userId } = req.body;

  try {
    if (!message) {
      return res.send(errorRes(400, "Reply message is required"));
    }

    if (!role || !userId) {
      return res.send(errorRes(400, "User role and ID are required"));
    }

    // Determine which user field to set based on role
    let userField;
    if (role === "employee") {
      userField = "employee";
    } else if (role === "channel-partner") {
      userField = "channelPartner";
    } else if (role === "client") {
      userField = "client";
    } else {
      return res.send(errorRes(400, "Invalid role provided"));
    }

    // Create the reply object
    const newReply = {
      message,
      role,
      [userField]: userId,
      date: new Date(),
      isLiked: null,
      likes: 0,
    };

    // Find the testimonial and add the reply to the specified comment
    const testimonial = await testimonialModel.findById(testimonialId);

    if (!testimonial) {
      return res.send(errorRes(404, "Testimonial not found"));
    }

    // Find the comment to add the reply to
    const comment = testimonial.comments.id(commentId);

    if (!comment) {
      return res.send(errorRes(404, "Comment not found"));
    }

    // Add the reply to the comment
    comment.replies.push(newReply);

    // Save the updated testimonial
    await testimonial.save();

    const cached = await RedisService.del("testimonials");

    return res.send(
      successRes(200, "Reply added successfully", {
        data: testimonial,
      })
    );
  } catch (error) {
    console.error("Error adding reply:", error);
    return res.send(errorRes(500, error.message || "Server error"));
  }
};

// Toggle like on a comment
export const toggleLikeOnComment = async (req, res) => {
  const testimonialId = req.params.testimonialId;
  const commentId = req.params.commentId;
  const { role, userId } = req.body;

  try {
    if (!role || !userId) {
      return res.send(errorRes(400, "User role and ID are required"));
    }

    // Find the testimonial
    const testimonial = await testimonialModel.findById(testimonialId);

    if (!testimonial) {
      return res.send(errorRes(404, "Testimonial not found"));
    }

    // Find the comment
    const comment = testimonial.comments.id(commentId);

    if (!comment) {
      return res.send(errorRes(404, "Comment not found"));
    }

    // Toggle the like status
    if (comment.isLiked === true) {
      // User is unliking the comment
      comment.isLiked = null;
      comment.likes = Math.max(0, comment.likes - 1); // Ensure likes don't go below 0
    } else {
      // User is liking the comment
      comment.isLiked = true;
      comment.likes += 1;
    }

    // Save the updated testimonial
    await testimonial.save();

    const cached = await RedisService.del("testimonials");

    return res.send(
      successRes(200, "Comment like toggled successfully", {
        data: testimonial,
      })
    );
  } catch (error) {
    console.error("Error toggling comment like:", error);
    return res.send(errorRes(500, error.message || "Server error"));
  }
};

// Toggle like on a reply
export const toggleLikeOnReply = async (req, res) => {
  const testimonialId = req.params.testimonialId;
  const commentId = req.params.commentId;
  const replyId = req.params.replyId;
  const { role, userId } = req.body;

  try {
    if (!role || !userId) {
      return res.send(errorRes(400, "User role and ID are required"));
    }

    // Find the testimonial
    const testimonial = await testimonialModel.findById(testimonialId);

    if (!testimonial) {
      return res.send(errorRes(404, "Testimonial not found"));
    }

    // Find the comment
    const comment = testimonial.comments.id(commentId);

    if (!comment) {
      return res.send(errorRes(404, "Comment not found"));
    }

    // Find the reply
    const reply = comment.replies.id(replyId);

    if (!reply) {
      return res.send(errorRes(404, "Reply not found"));
    }

    // Toggle the like status
    if (reply.isLiked === true) {
      // User is unliking the reply
      reply.isLiked = null;
      reply.likes = Math.max(0, reply.likes - 1); // Ensure likes don't go below 0
    } else {
      // User is liking the reply
      reply.isLiked = true;
      reply.likes += 1;
    }

    // Save the updated testimonial
    await testimonial.save();

    const cached = await RedisService.del("testimonials");

    return res.send(
      successRes(200, "Reply like toggled successfully", {
        data: testimonial,
      })
    );
  } catch (error) {
    console.error("Error toggling reply like:", error);
    return res.send(errorRes(500, error.message || "Server error"));
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  const testimonialId = req.params.testimonialId;
  const commentId = req.params.commentId;
  const { role, userId } = req.body;

  try {
    // Find the testimonial
    const testimonial = await testimonialModel.findById(testimonialId);

    if (!testimonial) {
      return res.send(errorRes(404, "Testimonial not found"));
    }

    // Find the comment
    const comment = testimonial.comments.id(commentId);

    if (!comment) {
      return res.send(errorRes(404, "Comment not found"));
    }

    // Check if the user is authorized to delete the comment
    const userField =
      role === "employee"
        ? "employee"
        : role === "channel-partner"
        ? "channelPartner"
        : role === "client"
        ? "client"
        : null;

    if (!userField || comment[userField]?.toString() !== userId) {
      return res.send(
        errorRes(403, "You are not authorized to delete this comment")
      );
    }

    // Remove the comment
    comment.remove();

    // Save the updated testimonial
    await testimonial.save();

    const cached = await RedisService.del("testimonials");

    return res.send(
      successRes(200, "Comment deleted successfully", {
        data: testimonial,
      })
    );
  } catch (error) {
    console.error("Error deleting comment:", error);
    return res.send(errorRes(500, error.message || "Server error"));
  }
};

// Delete a reply
export const deleteReply = async (req, res) => {
  const testimonialId = req.params.testimonialId;
  const commentId = req.params.commentId;
  const replyId = req.params.replyId;
  const { role, userId } = req.body;

  try {
    // Find the testimonial
    const testimonial = await testimonialModel.findById(testimonialId);

    if (!testimonial) {
      return res.send(errorRes(404, "Testimonial not found"));
    }

    // Find the comment
    const comment = testimonial.comments.id(commentId);

    if (!comment) {
      return res.send(errorRes(404, "Comment not found"));
    }

    // Find the reply
    const reply = comment.replies.id(replyId);

    if (!reply) {
      return res.send(errorRes(404, "Reply not found"));
    }

    // Check if the user is authorized to delete the reply
    const userField =
      role === "employee"
        ? "employee"
        : role === "channel-partner"
        ? "channelPartner"
        : role === "client"
        ? "client"
        : null;

    if (!userField || reply[userField]?.toString() !== userId) {
      return res.send(
        errorRes(403, "You are not authorized to delete this reply")
      );
    }

    // Remove the reply
    reply.remove();

    // Save the updated testimonial
    await testimonial.save();

    const cached = await RedisService.del("testimonials");

    return res.send(
      successRes(200, "Reply deleted successfully", {
        data: testimonial,
      })
    );
  } catch (error) {
    console.error("Error deleting reply:", error);
    return res.send(errorRes(500, error.message || "Server error"));
  }
};

export const incrementViewCount = async (req, res) => {
  const testimonialId = req.params.id;

  try {
    // Simple increment without duplicate checking
    const updatedTestimonial = await testimonialModel
      .findByIdAndUpdate(testimonialId, { $inc: { views: 1 } }, { new: true })
      .populate({ path: "project", select: "name locationName locationLink" });

    if (!updatedTestimonial) {
      return res.send(errorRes(404, "Testimonial not found"));
    }

    const cached = await RedisService.del("testimonials");

    return res.send(
      successRes(200, "View count incremented successfully", {
        data: updatedTestimonial,
      })
    );
  } catch (error) {
    console.error("Error incrementing view count:", error);
    return res.send(errorRes(500, error.message || "Server error"));
  }
};
