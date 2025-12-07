var UserModel = require('../Models/user');

module.exports.create = async function (req, res, next) {
    try {
        const userData = {
            ...req.body,
            admin: false
        };
        let result = await UserModel.create(userData);
        res.json(
            {
                success: true,
                message: "User created successfully."
            }
        );
    } catch (error) {
        console.log(error);
        next(error);
    }
}

module.exports.list = async function (req, res, next) {
    try {
        let list = await UserModel.find();
        res.json(list);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

module.exports.LisByID = async function (req, res, next) {
    try {
        let Luser = await UserModel.findOne({ _id: req.params.id });
        res.json(Luser);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

module.exports.read = async function (req, res, next) {
    res.json(req.user);
}

module.exports.SetUserByID = async function (req, res, next) {
    try {
        req.user = await UserModel.findOne({ _id: req.params.id }, '-hashed_password -salt');
        next();
    } catch (error) {
        console.log(error);
        next(error);
    }
}


module.exports.update = async function (req, res, next) {
    try {
        let result = await UserModel.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!result) {
            return res.status(404).json({ success: false, message: "Not Found" });
        }

        res.json({ success: true, data: result });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

module.exports.delete = async function (req, res, next) {
    try {
        let result = await UserModel.deleteOne({ _id: req.params.id });
        if (result.deletedCount > 0) {
            res.json(
                {
                    success: true,
                    message: "User deleted successfully."
                }
            );
        } else {
            res.json(
                {
                    success: false,
                    message: "User not deleted. Are you sure it exists?"
                }
            );
        }
    } catch (error) {
        console.log(error);
        next(error);
    }
}

module.exports.setAdmin = async function (req, res, next) {

    try {
        // Check if the current user is admin. Only admins can set another admin.
        let authorized = await UserModel.findOne({ _id: req.auth.id }, 'admin');
        console.log("authorized", authorized.admin);

        if (!authorized.admin) {
            return res.status(403).json(
                {
                    success: false,
                    message: "User is not authorized"
                }
            )
        }
        else {
            // Update one single field.
            let result = await UserModel.updateOne({ _id: req.params.userID }, { admin: true });
            console.log("setAdmin", result);
            if (result.modifiedCount > 0) {
                res.json(
                    {
                        success: true,
                        message: "User promoted successfully."
                    }
                );
            }
            else {
                // Express will catch this on its own.
                throw new Error('User not updated. Are you sure it exists?')
            }
        }
    } catch (error) {
        console.log(error);
        next(error)
    }

}

module.exports.hasAuthorization = async function (req, res, next) {
    console.log("Payload", req.auth);
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