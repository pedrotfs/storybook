const express = require("express");
const path = require("path");
const hbs = require("hbs");

const mainRouter = require("./routers/mainRouter");
const formRouter = require("./routers/formRouter");

const app = express();
app.use(express.urlencoded());
const maintenance = process.env.MAINTENANCE === "true" || false;

app.use((req, res, next) => {
    if(maintenance) {
        res.status(503).send("WE ARE UNDER MAINTENANCE");
    } else {
        next();
    }
});

app.use(express.json());

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "../templates/views"));
//hbs.registerPartials(path.join(__dirname, "../templates/partials"));
hbs.registerHelper('isdefined', function (value) {
    return value !== undefined;
});
hbs.registerHelper('equals', function (v1, v2) {
    console.log("equals helper: " + v1 == v2);
    return v1 == v2;
});
app.use(express.static(path.join(__dirname, "../public/")));

// app.use(formRouter, () => {});
app.use(mainRouter, () => {});
app.set('etag', false);
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
})


module.exports = app;