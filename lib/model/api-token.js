const mongoose = require('mongoose');
// noinspection JSUnresolvedVariable
const Schema = mongoose.Schema;

const ApiTokenSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    });

// noinspection JSUnresolvedFunction
const Model = mongoose.model('ApiToken', ApiTokenSchema);

function get(query) {
    return new Promise(function (resolve, reject) {
        Model.findOne(query, function (err, tokenObj) {
            if (err)
                reject(err);
            else
                resolve(tokenObj);
        });
    });
}

async function exists(query) {
    const obj = await get(query);
    return obj != null;
}

module.exports = {
    Model: Model,
    get: get,
    exists: exists
};
