const transfer = require("./iota.flash.js/lib/transfer");
const multisig = require("./iota.flash.js/lib/multisig");

const createTransaction = (user, actions, close) => {

    // get mulit signature to be used
    let toUse = updateTree(user);

    /// Construct
    let bundles;
    let newTansfers;
    try {
        // Check if its closing the channel
        let rootToUse = toUse.multisig;
        if (!close) {
            // Prepare the transfer.
            newTansfers = transfer.prepare(
                user.flash.settlementAddresses,
                user.flash.deposit,
                user.userIndex,
                actions
            )
        } else {
            // Distribute the remaining channel balance amongst the channel users
            // NOTE: YOU MUST PASS THE SETTLEMENT ADDRESSES ARRAY as 'actions'
            newTansfers = transfer.close(actions, user.flash.deposit);
            rootToUse = user.flash.root;
        }

        // Compose the transfer bundles
        bundles = transfer.compose(
            user.flash.balance,
            user.flash.deposit,
            user.flash.outputs,
            rootToUse,
            user.flash.remainderAddress,
            user.flash.transfers,
            newTansfers,
            close
        )
    } catch (e) {
        console.log("Error: ", e);
        return false
    }
    return bundles
};

const signTransaction = (user, seed, bundles) => {
    return transfer.sign(user.flash.root, seed, bundles)
};

const applyTransfers = (user, bundles) => {
    transfer.applyTransfers(
        user.flash.root,
        user.flash.deposit,
        user.flash.outputs,
        user.flash.remainderAddress,
        user.flash.transfers,
        bundles
    );
    return user
};

const updateTree = (user) => {
    let toUse = multisig.updateLeafToRoot(user.flash.root);
    if (toUse.generate !== 0) {
        let lastMultiSig = null;
        for( let i = 0; i < toUse.generate; i++) {

            // check if digests are still available from pool
            if( user.flash.multisigDigestPool.length === 0 ) {
                console.log('No multisignature digests left!')
                // ToDo: handle this case
            }

            let newMultiSig = user.flash.multisigDigestPool.shift();
            console.log(`Using new address from pool: ${JSON.stringify(newMultiSig)}`);

            // chain branch
            if (lastMultiSig != null)
                newMultiSig.children.push(lastMultiSig);
            lastMultiSig = newMultiSig;

            user.index++;
        }

        toUse.multisig.children.push(lastMultiSig);
    }
    return toUse;
};

module.exports = {
    createTransaction: createTransaction,
    signTransaction: signTransaction,
    applyTransfers: applyTransfers,
    updateTree: updateTree
};
