const timeago = require('timeago.js');
const timeagoInstance = timeago;

const helpers = {};

helpers.timeago = (savedTimestamp) => {
    return timeagoInstance.format(savedTimestamp);
};
helpers.ifcond = (v1, v2, options) => {
    if (v1 === v2) {
        return options.fn(this);
    }
    return false;
};
module.exports = helpers;