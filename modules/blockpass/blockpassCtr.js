const UserModal = require('../kycUsers/usersModel');
const SyncHelper = require('../sync/syncHelper');
const axios = require('axios');
const syncHelper = require('../sync/syncHelper');
const blockPassCtr = {};

blockPassCtr.getApprovedUserList = async (req, res) => {
  try {
    const getLatestBlockNoUrl = `https://api.bscscan.com/api?module=proxy&action=eth_blockNumber&apikey=CWZ1A15GW1ANBXEKUUE32Z2V2F4U1Q6TVA`;
    const getLatestBlock = await axios.get(getLatestBlockNoUrl);
    const latestBlock = parseInt(getLatestBlock.data.result, 16);

    const getFarmingArray = await await SyncHelper.getFarmingBalance(
      0,
      latestBlock
    );
    const getBakeryArray = await SyncHelper.getBakeryFarmBalance(
      0,
      latestBlock
    );
    const getTosdisArray = await SyncHelper.getToshFarmBalance(0, latestBlock);
    const getSlpArray = await SyncHelper.slpBalance(0, latestBlock);

    const getRecordsFromBlockPass = async (skip) => {
      const getRecords = await getDatafromBlockPass(skip);

      if (getRecords && getRecords.records.length) {
        const itreateBlocks = async (i) => {
          if (i < getRecords.records.length) {
            console.log(
              getRecords.records[i].identities.crypto_address_eth.value
            );

            const userAddress =
              getRecords.records[i].identities.crypto_address_eth.value;

            const getSfund = await getSfundBalance(
              '0x477bc8d23c634c154061869478bce96be6045d12',
              userAddress,
              latestBlock
            );

            const getLiquidity = await getLiquidityBalance(
              userAddress,
              latestBlock
            );

            const getFarming = await findData(getFarmingArray, userAddress);

            const getBakery = await findData(getBakeryArray, userAddress);

            const getTosdis = await findData(getTosdisArray, userAddress);

            const getSlp = await findData(getSlpArray, userAddress);

            const balObj = {
              sfund: getSfund,
              liquidity: getLiquidity,
              farming: getFarming,
              bakery: getBakery,
              tosdis: getTosdis,
              slp: getSlp,
            };

            const total =
              getSfund +
              getLiquidity +
              getFarming +
              getBakery +
              getTosdis +
              getSlp;

            const email = getRecords.records[i].identities.email.value;
            const name = `${getRecords.records[i].identities.given_name.value}${getRecords.records[i].identities.family_name.value} `;

            const checkUserAvalaible = await UserModal.findOne({
              walletAddress: userAddress.toLowerCase().trim(),
            });

            if (checkUserAvalaible) {
              checkUserAvalaible.balObj = balObj;
              checkUserAvalaible.totalbalance = total;
              checkUserAvalaible.tier = syncHelper.getUserTier(total);

              await checkUserAvalaible.save();
              itreateBlocks(i + 1);
            } else {
              const addNewUser = new UserModal({
                recordId: getRecords.records[i].recordId,
                walletAddress: userAddress,
                email: email,
                name: name,
                totalbalance: total,
                balObj: balObj,
                tier: syncHelper.getUserTier(total),
              });

              await addNewUser.save();
              itreateBlocks(i + 1);
            }
          }
        };
        itreateBlocks(0);

        if (getRecords.total > getRecords.skip) {
          getRecordsFromBlockPass(+getRecords.skip + 10);
        } else {
          console.log('Cron fired successfully');

          if (res) {
            res.status(200).JSON({
              message: 'Cron fired successfully',
            });
          }
        }
      }
    };
    getRecordsFromBlockPass(0);

    // console.log('data is', data);
  } catch (err) {
    console.log('error in getting data', err);
    if (res) {
      res.status(500).JSON({
        message: 'Something went wrong',
      });
    }
  }
};

// get data from block pass
async function getDatafromBlockPass(skip) {
  let url = `https://kyc.blockpass.org/kyc/1.0/connect/${process.env.BLOCKPASS_CLIENT_ID}/applicants/approved?limit=10`;
  if (skip > 0) {
    url = `https://kyc.blockpass.org/kyc/1.0/connect/${process.env.BLOCKPASS_CLIENT_ID}/applicants/approved?limit=10&skip=${skip}`;
  }

  var config = {
    method: 'get',
    url: url,
    headers: {
      Authorization: `${process.env.BLOCKPASS_AUTHORIZATION}`,
    },
  };

  const getBlockPassData = await axios(config);
  if (getBlockPassData && getBlockPassData.status === 200) {
    // console.log(getBlockPassData.data.data);
    const data = getBlockPassData.data.data.records;
    const total = getBlockPassData.data.data.total;
    const skip = getBlockPassData.data.data.skip;

    return {
      records: data,
      total: total,
      skip: skip,
    };
  } else {
    return {
      records: [],
      total: 0,
      skip: 0,
    };
  }
}

// get sfund balance
async function getSfundBalance(address, userAddress, endBlock) {
  const fromAddress = userAddress.trim();
  const requiredAddress = fromAddress.substring(2, fromAddress.length);
  console.log('requiredAddress is:', requiredAddress);
  const data = {
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [
      {
        to: address,
        data: `0x70a08231000000000000000000000000${requiredAddress}`,
      },
      `0x${endBlock.toString(16).toUpperCase()}`,
    ],
    id: 67,
  };
  const config = {
    method: 'post',
    url: 'https://bsc-private-dataseed1.nariox.org',
    headers: {
      'Content-Type': 'application/json',
    },
    data: JSON.stringify(data),
  };
  const fetchDetails = await axios(config);

  if (!fetchDetails.data.error) {
    const weiBalance = parseInt(fetchDetails.data.result, 16);
    let seedifyBalance = (weiBalance / Math.pow(10, 18)).toFixed(2);
    return seedifyBalance;
  } else {
    return 0;
  }
}

// get liquidity balance
async function getLiquidityBalance(userAddress, endBlock) {
  const address = '0x74fa517715c4ec65ef01d55ad5335f90dce7cc87';

  const getTotalSupplyUrl = `https://api.bscscan.com/api?module=stats&action=tokensupply&contractaddress=${address}&apikey=${process.env.BSC_API_KEY}`;
  const tokenBalanceUrl = `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=0x477bc8d23c634c154061869478bce96be6045d12&address=${address}&tag=latest&apikey=${process.env.BSC_API_KEY}`;

  const getTotalSupply = await axios.get(getTotalSupplyUrl);
  const getTokenBalance = await axios.get(tokenBalanceUrl);

  const getSfundBal = await getSfundBalance(address, userAddress, endBlock);

  const tokenSupply = +getTotalSupply.data.result / Math.pow(10, 18);
  const tokenBalance = +getTokenBalance.data.result / Math.pow(10, 18);

  if (getSfundBal) {
    const transactionCount = +getSfundBal / tokenSupply;
    const total = transactionCount * tokenBalance;

    return total;
  } else {
    return 0;
  }
}

async function findData(data, userAddress) {
  const findIndex = data.findIndex(
    (user) =>
      user.address.toLowerCase().trim() === userAddress.toLowerCase().trim()
  );

  if (findIndex >= 0) {
    return data[findIndex].balance;
  } else {
    return 0;
  }
}

module.exports = blockPassCtr;