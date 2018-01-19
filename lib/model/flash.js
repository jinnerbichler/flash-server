const mongoose = require('mongoose');
// noinspection JSUnresolvedVariable
const Schema = mongoose.Schema;

const FlashChannelSchema = new Schema(
    {
        modifiedAt: {
            type: Date
        },
        isClosed: {
            type: Boolean,
            default: false
        },
        isFinalized: {
            type: Boolean,
            default: false
        },
        data: Object,
    },
    {
        minimize: false,
        timestamps: true
    });

// noinspection JSUnresolvedFunction
const Model = mongoose.model('FlashChannel', FlashChannelSchema);

function create(data) {
    return new Promise(function (resolve, reject) {
        let flashObj = new Model({data: data});
        flashObj.save(function (err) {
            if (err)
                reject(err);
            else
                resolve(flashObj);
        });
    });
}

function getChannel(channelId) {
    return new Promise(function (resolve, reject) {
        Model.findById(channelId, function (err, flashChannel) {
            if (err)
                reject({message: `Channel with ID ${channelId} not found.`});
            else
                resolve(flashChannel);
        });
    });
}

function updateChannel(channelId, data) {
    return new Promise(function (resolve, reject) {
        // noinspection JSCheckFunctionSignatures
        Model.findByIdAndUpdate(channelId, data, {new: true}, function (err, flash) {
            if (err)
                reject({message: `Channel with ID ${channelId} not found.`});
            else
                resolve(flash);
        });
    });
}

module.exports = {
    Model: Model,
    create: create,
    getChannel: getChannel,
    updateChannel: updateChannel
};
