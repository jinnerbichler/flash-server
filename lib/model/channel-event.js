const mongoose = require('mongoose');
// noinspection JSUnresolvedVariable
const Schema = mongoose.Schema;

ACTIONS = {
    init: 'init',  // meta contains init values
    multisignature: 'multisignature', // meta contains digest of all users
    settmement: 'settlement', // meta contains settlement addresses
    transfer: 'transfer',  // meta contains requested transfers
    sign: 'sign', // meta contains bundle to be signed
    apply: 'apply', // meta contains signed bundles
    close: 'close', // meta is emtpy
    fund: 'fund',  // meta contains final transaction which were attached to the Tangle
    finalize: 'finalize' // meta contains final transaction which were attached to the Tangle
};

const ChannelEventSchema = new Schema(
    {
        type: {
            type: String,
            required: true,
            enum: Object.values(ACTIONS)
        },
        flash: {
            type: Object,
            required: true
        },
        channel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FlashChannel',
            required: true
        },
        meta: {
            type: Object
        }
    },
    {
        timestamps: true
    });

// noinspection JSUnresolvedFunction
const Model = mongoose.model('ChannelEvent', ChannelEventSchema);

module.exports = {
    Model: Model,
    ACTIONS: ACTIONS,
};