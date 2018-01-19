const mongoose = require('mongoose');
// noinspection JSUnresolvedVariable
const Schema = mongoose.Schema;

const FlashChannel = new Schema(
    {
        openedAt: {
            type: Date,
            default: Date.now
        },
        modifiedAt: {
            type: Date
        },
        isActive: {
            type: Boolean,
            default: true
        },
        data: Object,
    },
    {
        minimize: false
    });

// noinspection JSUnresolvedFunction
const Model = mongoose.model('FlashChannel', FlashChannel);

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

function updateChannel(channelId, flashChannel) {
    return new Promise(function (resolve, reject) {
        // noinspection JSCheckFunctionSignatures
        Model.findByIdAndUpdate(channelId, {data: flashChannel}, {new: true}, function (err, flash) {
            if (err)
                reject({message: `Channel with ID ${channelId} not found.`});
            else
                resolve(flash);
        });
    });
}

module.exports = {
    Model: Model,
    getChannel: getChannel,
    updateChannel: updateChannel
};
