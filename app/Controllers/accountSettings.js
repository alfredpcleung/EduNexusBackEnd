const User = require('../Models/user');
const errorResponse = require('../Utils/errorResponse');


/**
 * PATCH /api/users/settings
 * Update email and/or password for the authenticated user
 * Requires current password for verification
 */
module.exports.updateSettings = async function (req, res, next) {
  try {
    const userId = req.user.uid;
    const {
      newEmail,
      confirmNewEmail,
      newPassword,
      confirmNewPassword,
      currentPassword
    } = req.body;


    if (!currentPassword) {
      return errorResponse(res, 400, 'Current password is required.');
    }

    if (!newEmail && !newPassword) {
      return errorResponse(res, 400, 'No changes specified.');
    }

    // Password change validation (mismatch check before password verification)
    if (newPassword) {
      if (!confirmNewPassword || newPassword !== confirmNewPassword) {
        return errorResponse(res, 400, 'Passwords do not match.');
      }
      if (newPassword.length < 6) {
        return errorResponse(res, 400, 'Password must be at least 6 characters.');
      }
    }

    // Email change validation (mismatch check before password verification)
    if (newEmail) {
      if (!confirmNewEmail || newEmail !== confirmNewEmail) {
        return errorResponse(res, 400, 'Emails do not match.');
      }
      if (newEmail !== confirmNewEmail) {
        return errorResponse(res, 400, 'Emails do not match.');
      }
    }

    // Fetch user
    const user = await User.findOne({ uid: userId }).select('+password +email');
    if (!user) {
      return errorResponse(res, 404, 'User not found.');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 401, 'Incorrect current password.');
    }

    // Email change apply
    if (newEmail) {
      // Check if email is already in use
      const existing = await User.findOne({ email: newEmail });
      if (existing && existing.uid !== userId) {
        return errorResponse(res, 409, 'Email already in use.');
      }
      user.email = newEmail;
    }

    // Password change apply
    if (newPassword) {
      user.password = newPassword;
    }

    await user.save();
    res.json({ success: true, message: 'Account settings updated successfully.' });
  } catch (error) {
    next(error);
  }
};
