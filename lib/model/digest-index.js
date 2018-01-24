const mongoose = require('mongoose');
// noinspection JSUnresolvedVariable
const Schema = mongoose.Schema;

const DigestIndexSchema = new Schema(
    {
        value: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    });

// noinspection JSUnresolvedFunction
const Model = mongoose.model('DigestIndex', DigestIndexSchema);

function getIndex() {
    return new Promise(function (resolve, reject) {
        Model.findOne({}, function (err, digestIndex) {
            if (err) {
                reject({message: `Index not found`})
            }
            else {
                const value = digestIndex != null ? digestIndex.value : 0;
                resolve(value);
            }
        });
    });
}

function setIndex(value) {
    return new Promise(function (resolve, reject) {
        // noinspection JSCheckFunctionSignatures
        Model.findOneAndUpdate({}, {value: value}, {new: true, upsert: true}, function (err, digestIndex) {
            if (err) {
                reject({message: `Index not found`})
            }
            else {
                resolve(digestIndex.value)
            }
        });
    });
}


module.exports = {
    Model: Model,
    getIndex: getIndex,
    setIndex: setIndex
};
