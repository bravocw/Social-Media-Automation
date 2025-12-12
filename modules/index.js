const core = require("./core");
const ui = require("./ui");
const device = require("./device");
const like = require("./like");
const comment = require("./comment");
const follow = require("./follow");

module.exports = {
    ...core,
    ...ui,
    ...device,
    ...like,
    ...comment,
    ...follow,
};
