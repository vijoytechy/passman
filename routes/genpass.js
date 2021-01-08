const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const generator = require('generate-password');
const fs = require('fs');
const path = require('path');
const directoryPath = path.resolve('./uploads');
const csvtojson = require("csvtojson");
const Csv = require('../models/Csv');





// Generate password
router.get('/generatepassword', ensureAuthenticated, (req, res) =>
    res.render('generatepassword', {
        user: req.user
    })
);
router.post('/generatepassword', ensureAuthenticated, (req, res) => {
    const { passlen, passcount, numbers, symbols, lowercase, uppercase } = req.body;
    let errors = [];

    if (typeof numbers && symbols && lowercase && uppercase == "undefined") {

        errors.push({ msg: 'please choose atleast one option' });
    }

    function check(op) {
        if (op === 'on') {
            return true;
        } else {
            return false;
        }

    }
    var passwords = generator.generateMultiple(passcount, {
        length: passlen,
        lowercase: check(lowercase),
        uppercase: check(uppercase),
        symbols: check(symbols),
        numbers: check(numbers)
    });




    res.render('generatepassword', { 'passwords': passwords, user: req.user, errors });

});
//load CSV files
router.get('/loadcsv', ensureAuthenticated, (req, res) =>
    res.render('loadcsv', {
        user: req.user,
        files: fs.readdirSync(directoryPath)
    })
);
//import data to mongodb
router.post('/importdata', ensureAuthenticated, (req, res) => {
    let file = req.body.selectpicker

    csvtojson()
        .fromFile("uploads/" + file)
        .then(csvData => {

            Csv.insertMany(csvData, (err, res) => {
                if (err) throw err;
                else
                    console.log(`Inserted: ${res.insertedCount} rows`);
            })
        })

    req.flash('success_msg', 'Data Imported  Successfully !');
    res.redirect('/manage/loadcsv');
});


module.exports = router;
