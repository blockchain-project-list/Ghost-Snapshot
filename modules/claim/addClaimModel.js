const mongoose = require("mongoose");

const { Schema } = mongoose;

const addClaimSchema = new Schema(
  {
    contractAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    tokenAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    networkName: {
      type: String,
      required: true,
      enum: ["polygon", "binance", "ethereum", "solana", "avalanche"],
      lowercase: true,
    },
    networkSymbol: {
      type: String,
      required: true,
      enum: ["BNB", "ETH", "MATIC", "SOL", "AVAX"],
    },
    networkId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Number,
      required: true,
    },
    logo: {
      type: String,
      default: null,
    },
    phaseNo: {
      type: Number,
      required: true,
    },
    data: {
      type: Array,
      default: [],
    },
    loops: {
      type: Number,
      default: 0,
    },
    transactionHash : {
        type : Array,
        default : []
    }
  },

  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

module.exports = mongoose.model("addClaim", addClaimSchema);