const business = require('./business');

(async () => {
    console.time('getPendingRequestCount');
    const result = await business.getPendingRequestCount();
    console.timeEnd('getPendingRequestCount');
    console.log(result);
})();