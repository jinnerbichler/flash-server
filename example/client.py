import requests
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

USER_ONE_HOST = 'http://flash_one:3000'
USER_ONE_SETTLEMENT = 'USERONE9ADDRESS9USERONE9ADDRESS9USERONE9ADDRESS9USERONE9ADDRESS9USERONE9ADDRESS9U'
USER_TWO_HOST = 'http://flash_two:3000'
USER_TWO_SETTLEMENT = 'USERTWO9ADDRESS9USERTWO9ADDRESS9USERTWO9ADDRESS9USERTWO9ADDRESS9USERTWO9ADDRESS9U'

SECURITY = 2
TREE_DEPTH = 4
SIGNERS_COUNT = 2
BALANCE = 4000
DEPOSIT = [2000, 2000]


class FlashClient:

    def __init__(self, url):
        self.url = url

    def init(self, **kwargs):
        return self._post(path='/init', **kwargs)

    def multisignature(self, **kwargs):
        return self._post(path='/multisignature', **kwargs)

    def settlement(self, **kwargs):
        return self._post(path='/settlement', **kwargs)

    def transfer(self, **kwargs):
        return self._post(path='/transfer', **kwargs)

    def sign(self, **kwargs):
        return self._post(path='/sign', **kwargs)

    def apply(self, **kwargs):
        return self._post(path='/apply', **kwargs)

    def close(self, **kwargs):
        return self._post(path='/close', **kwargs)

    def _post(self, path, **kwargs):
        response = requests.post(self.url + path, json=kwargs)
        logger.debug(response.text)
        response.raise_for_status()
        return response.json()


def main():
    client_one = FlashClient(url=USER_ONE_HOST)
    client_two = FlashClient(url=USER_TWO_HOST)

    ##########################################################
    # Step 1: Initialise Flash channel
    ##########################################################
    logger.info('############# Initializing Flash channel #############')
    user_one_flash = client_one.init(userIndex=0, index=0, security=SECURITY, depth=TREE_DEPTH,
                                     signersCount=2, balance=BALANCE, deposit=DEPOSIT)
    user_two_flash = client_two.init(userIndex=1, index=0, security=SECURITY, depth=TREE_DEPTH,
                                     signersCount=2, balance=BALANCE, deposit=DEPOSIT)

    ##########################################################
    # Step 2: Generate multisignature addresses
    ##########################################################
    logger.info('############# Generating multisignature addresses #############')
    all_digests = [user_one_flash['partialDigests'], user_two_flash['partialDigests']]
    client_one.multisignature(allDigests=all_digests)
    client_two.multisignature(allDigests=all_digests)

    ##########################################################
    # Step 3: Set settlement addresses
    ##########################################################
    logger.info('############# Setting settlement addresses #############')
    settlement_addresses = [USER_ONE_SETTLEMENT, USER_TWO_SETTLEMENT]
    user_one_flash = client_one.settlement(settlementAddresses=settlement_addresses)
    user_two_flash = client_two.settlement(settlementAddresses=settlement_addresses)

    ##########################################################
    # Step 4: Transfer IOTA within channel
    ##########################################################
    logger.info('############# Initiating transfer #############')
    transfers = [{'value': 200, 'address': USER_TWO_SETTLEMENT}]
    bundles = client_one.transfer(transfers=transfers)

    ##########################################################
    # Step 5: Sign bundles
    ##########################################################
    logger.info('############# Signing bundles #############')
    signed_bundles = client_one.sign(bundles=bundles)
    signed_bundles = client_two.sign(bundles=signed_bundles)

    ##########################################################
    # Step 6: Applying signed bundles to Flash object
    ##########################################################
    logger.info('############# Applying signed bundles #############')
    user_one_flash = client_one.apply(signedBundles=signed_bundles)
    user_two_flash = client_two.apply(signedBundles=signed_bundles)

    ##########################################################
    # Step 7: Closing channel
    ##########################################################
    logger.info('############# Closing channel #############')
    closing_bundles = client_one.close()
    signed_bundles = client_one.sign(bundles=closing_bundles)
    signed_bundles = client_two.sign(bundles=signed_bundles)

    logger.info('Done!')


if __name__ == '__main__':
    main()
