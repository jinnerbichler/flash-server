const mongoose = require('mongoose');
const Schema = mongoose.Schema;

ACTIONS = {
    init: 'init',
    multisignature: 'multisignature',
    transfer: 'transfer',
    sign: 'sign',
    apply: 'apply',
    close: 'close',
    fund: 'fund',
    finalyze: 'finalize'
};

const ChannelHistory = new Schema(
    {
        action: {
            type: String,
            required: true,
            enum: ['init', 'multisignature', 'settlement', 'transfer', 'sign', 'apply', 'close', 'fund', 'finalize']
        }
    });

const Model = mongoose.model('ChannelHistory', ChannelHistory);