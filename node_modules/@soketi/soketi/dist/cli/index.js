"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_1 = require("./cli");
let yargs = require('yargs')
    .usage('Usage: soketi <command> [options]')
    .command('start', 'Start the server.', yargs => {
    return yargs.option('config', { describe: 'The path for the config file. (optional)' });
}, (argv) => cli_1.Cli.start(argv))
    .demandCommand(1, 'Please provide a valid command.')
    .help('help')
    .alias('help', 'h');
yargs.$0 = '';
let argv = yargs.argv;
