const express = require('express');
const multer = require('multer');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { profileStorage, cloudinary } = require('../config/cloudinary');

const router = express.Router();

// Configure multer with Cloudinary storage
const upload = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
      console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, upload.single('profileImage'), async (req, res) => {
  try {
    const { name, email, phone, address, dateOfBirth, bio, businessName, department } = req.body;

    // Find the user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already registered with another account'
        });
      }
    }

    // Handle profile image upload
    let profileImagePath = user.profileImage;

    if (req.file) {
      // Delete old profile image from Cloudinary if it exists
      if (user.profileImage && user.profileImage.includes('cloudinary.com')) {
        try {
          // Extract public_id from Cloudinary URL
          const urlParts = user.profileImage.split('/');
          const filename = urlParts[urlParts.length - 1];
          const publicId = `hall-booking/profiles/${filename.split('.')[0]}`;
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error('Error deleting old image from Cloudinary:', error);
        }
      }

      // Set new profile image path (Cloudinary returns full URL)
      profileImagePath = req.file.path;
    }

    // Update user fields
    const updateFields = {
      name: name || user.name,
      email: email || user.email,
      phone: phone || user.phone,
      address: address || user.address,
      dateOfBirth: dateOfBirth || user.dateOfBirth,
      bio: bio || user.bio,
      profileImage: profileImagePath,
      updatedAt: new Date()
    };

    // Remove undefined fields
    Object.keys(updateFields).forEach(key => {
      if (updateFields[key] === undefined) {
        delete updateFields[key];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error(error);

    // Note: Cloudinary automatically handles cleanup of uploaded files on error

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/users/profile/image
// @desc    Delete user profile image
// @access  Private
router.delete('/profile/image', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete profile image from Cloudinary if it exists
    if (user.profileImage && user.profileImage.includes('cloudinary.com')) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = user.profileImage.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = `hall-booking/profiles/${filename.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }

    // Update user to remove profile image
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $unset: { profileImage: 1 },
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile image deleted successfully',
      user: updatedUser
    });

  } catch (error) {
      console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (public profile info)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email profileImage bio createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
      console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;