var UserModel = require('../Models/user');
var errorResponse = require('../Utils/errorResponse');

module.exports.create = async function (req, res, next) {
    try {
        const userData = {
            ...req.body
        };
        let result = await UserModel.create(userData);
        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

module.exports.list = async function (req, res, next) {
    try {
        let list = await UserModel.find();
        res.json({
            success: true,
            data: list
        });
    } catch (error) {
        next(error);
    }
}

module.exports.LisByID = async function (req, res, next) {
    try {
        let Luser = await UserModel.findOne({ _id: req.params.id });
        if (!Luser) {
            return errorResponse(res, 404, "User not found");
        }
        res.json({
            success: true,
            data: Luser
        });
    } catch (error) {
        next(error);
    }
}

module.exports.read = async function (req, res, next) {
    if (!req.user) {
        return errorResponse(res, 404, "User not found");
    }
    res.json({
        success: true,
        data: req.user
    });
}

module.exports.SetUserByUID = async function (req, res, next) {
    try {
        req.user = await UserModel.findOne({ uid: req.params.uid }, '-hashed_password -salt');
        next();
    } catch (error) {
        next(error);
    }
}


module.exports.update = async function (req, res, next) {
    try {
        const targetUid = req.params.uid;
        const currentUserUid = req.user?.uid;
        const userRole = req.user?.role;

        // Check if user exists first before authorization
        const existingUser = await UserModel.findOne({ uid: targetUid });
        if (!existingUser) {
            return errorResponse(res, 404, "User not found");
        }

        // Check authorization - allow if admin or updating own profile
        if (userRole !== 'admin' && currentUserUid !== targetUid) {
            return errorResponse(res, 403, "You are not authorized to perform this action");
        }

        let result = await UserModel.findOneAndUpdate(
            { uid: targetUid },
            { $set: req.body },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

module.exports.delete = async function (req, res, next) {
    try {
        const targetUid = req.params.uid;
        const currentUserUid = req.user?.uid;
        const userRole = req.user?.role;

        // Check if user exists first before authorization
        const existingUser = await UserModel.findOne({ uid: targetUid });
        if (!existingUser) {
            return errorResponse(res, 404, "User not found");
        }

        // Check authorization - allow if admin or deleting own profile
        if (userRole !== 'admin' && currentUserUid !== targetUid) {
            return errorResponse(res, 403, "You are not authorized to perform this action");
        }

        let result = await UserModel.deleteOne({ uid: targetUid });
        if (result.deletedCount > 0) {
            res.json({
                success: true,
                data: { message: "User deleted successfully." }
            });
        } else {
            return errorResponse(res, 404, "User not found");
        }
    } catch (error) {
        next(error);
    }
}

module.exports.setAdmin = async function (req, res, next) {

    try {
        // Check if the current user is admin. Only admins can set another admin.
        let authorized = await UserModel.findOne({ _id: req.auth.id }, 'admin');

        if (!authorized.admin) {
            return errorResponse(res, 403, "You are not authorized to perform this action");
        }
        else {
            // Update one single field.
            let result = await UserModel.updateOne({ _id: req.params.userID }, { admin: true });
            if (result.modifiedCount > 0) {
                res.json({
                    success: true,
                    data: { message: "User promoted successfully." }
                });
            }
            else {
                // Express will catch this on its own.
                throw new Error('User not updated. Are you sure it exists?')
            }
        }
    } catch (error) {
        next(error)
    }

}

module.exports.hasAuthorization = async function (req, res, next) {
    let authorized = req.auth && req.user && req.auth.username == req.user.username;

    if (!authorized) {
        return res.status('403').json(
            {
                success: false,
                message: "User is not authorized"
            }
        )
    }
    next();
}
