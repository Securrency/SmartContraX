module.exports = {
    estimateGas: async function (actionToEstimate, fromAddress, factor, value) {
      let estimatedGAS = Math.round(factor * (await actionToEstimate.estimateGas({ from: fromAddress, value: value})));
      return estimatedGAS;
    }
}