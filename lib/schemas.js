const Joi = require('joi');

const init = {
    body: {
        userIndex: Joi.number().integer().min(0).required(),
        index: Joi.number().integer().min(0).required(),
        security: Joi.number().integer().min(0).required(),
        depth: Joi.number().integer().min(0).required(),
        signersCount: Joi.number().integer().min(0).required(),
        balance: Joi.number().integer().min(0).required(),
        deposit: Joi.array().length(Joi.ref('signersCount')).items(Joi.number().integer().min(0).required()).required()
    }
};

const multisignature = {
    body: {
        allDigests: Joi.array().required()
    }
};

const settlement = {
    body: {
        settlementAddresses: Joi.array().items(Joi.string().required()).required()
    }
};

const transfer = {
    body: {
        transfers: Joi.array().required()
    }
};

const sign = {
    body: {
        bundles: Joi.array().required()
    }
};

const apply = {
    body: {
        signedBundles: Joi.array().required()
    }
};

module.exports = {
    init: init,
    multisignature: multisignature,
    settlement: settlement,
    transfer: transfer,
    sign: sign,
    apply: apply
};