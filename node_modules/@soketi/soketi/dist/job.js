"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Job = void 0;
const uuid_1 = require("uuid");
class Job {
    constructor(id = (0, uuid_1.v4)(), data = {}) {
        this.id = id;
        this.data = data;
    }
}
exports.Job = Job;
