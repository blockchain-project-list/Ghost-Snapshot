const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: false,
      default: null,
      lowercase: true,
    },

    recordId: {
      type: String,
      default: null,
    },

    walletAddress: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    email: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    totalbalance: {
      type: Number,
      default: 0,
    },

    balObj: {
      type: JSON,
      default: {},
    },

    timestamp: {
      type: Number,
      default: 0,
    },

    kycStatus: {
      type: String,
      enum: ['approved', 'waiting', 'inreview', 'resubmit', 'incomplete'],
    },

    approvedTimestamp: {
      type: Number,
      default: 0,
    },

    tier: {
      type: String,
      default: 'tier0',
    },
  },

  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

module.exports = mongoose.model('users', userSchema);
