const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let crypto = require('crypto');

const UserSchema = new Schema(
    {
        uid: {
            type: String,
            unique: true,
            required: "Uid is required"
        },
        displayName: {
            type: String
        },   uid: {
            type: String,
            unique: true,
            required: "Uid is required"
        },
        displayName: {
            type: String
        },
        email: {
            type: String,
            unique: true,
            match: [/.+\@.+\..+/, "Please fill a valid e-mail address"]
        },
        profilePic: {
            type: String//URL
        },
        bio: {
            type: String
        },
        linkedin:{
            type: String
        },
        created: {
            type: Date,
            default: Date.now,
            immutable: true
        },
        updated: {
            type: Date,
            default: Date.now
        },
        admin: {
            type: Boolean,
            default: false
        }

    },
    {
        collection: "users"
    }
);

// Ensure virtual fields are serialised.
UserSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id
    }
});

module.exports = mongoose.model('User', UserSchema);