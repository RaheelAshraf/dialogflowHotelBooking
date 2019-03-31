const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');
// const { Text, Card, Image, Suggestion, Payload } = require('dialogflow-fulfillment');
const app = express().use(bodyParser.json());;
const mongoose = require('mongoose');
const port = process.env.PORT || 8080;


var dbURI = "mongodb://raheel123:raheel123@ds117816.mlab.com:17816/mongocrud";

mongoose.connect(dbURI, { useNewUrlParser: true })
    .catch((e) => {
        console.log("catch error: ", e)
    })
mongoose.Promise = global.Promise;

mongoose.connection.on('connected', function () {//connected
    console.log("Mongoose is connected");
    app.listen(port, (req, res) => {

        console.log(`app started on port ${port}`);
    })
})

mongoose.connection.on('disconnected', function () {//disconnected
    console.log("Mongoose is disconnected");
    process.exit(1);
});

mongoose.connection.on('error', function (err) {
    error
    console.log('Mongoose connection error: ', err);
    process.exit(1);
})

process.on('SIGINT', function () {/////this function will run jst before app is closing
    console.log("app is terminating");
    mongoose.connection.close(function () {
        console.log('Mongoose default connection closed');
        process.exit(0);
    });
});

var userSchema = new mongoose.Schema({
    "name": String,
    "email": String,
    "RoomType": String,
    "number": Number,
    "joinedDate": { type: Date, default: Date.now },
    "isActive": { type: Boolean, default: true }

});


app.post('/webhook', (request, response) => {
    const _agent = new WebhookClient({ request: request, response: response });

    var userModel = mongoose.model("user", userSchema);


    function welcome(agent) {
        agent.add('Welcome to hotel booking app. What can i do for you?');
    }

    function fallback(agent) {
        agent.add(`I didn't understand.`);
    }

    function bookhotel(agent) {
        var params = new userModel({
            "name": agent.parameters.name,
            "email": agent.parameters.email,
            "RoomType": agent.parameters.RoomType,
            "number": agent.parameters.number
        });
        params.save((userSaved) => {
            // userSaved
            console.log("saved")
        })

        agent.add(`Dear ${params.name} your hotel booking request for ${params.RoomType} room for ${params.number} has been sent to your mail ${params.email}`);
    }

    function showBookings(agent) {

        var query = userModel.find({});
        return query.exec()
            .then(result => {
                if (!result || !result.length) {
                    return agent.add(`not found`);
                } else {

                    for (var i = 0; i < result.length; i++) {
                        var obj = result[i];

                        agent.add(`Order no:${obj.id} person name:${obj.name} person email:${obj.email} Room for how many person:${obj.number} Room Type:${obj.RoomType}`);
                    }
                }
            })
            .catch(err => {
                console.log(err);
            });
    }

    function deleteBooking(agent) {

        userModel.find({
            name: agent.parameters.name,
            email: agent.parameters.email
        })
            .remove((err) => {
                if (!err) {
                    response.send("removed")
                } else {
                    response.status(500).send("something went wrong while deleting")
                }

                agent.add(`successfully deleted booking`);
            })
    }
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('book hotel', bookhotel);
    intentMap.set('show bookings', showBookings);
    intentMap.set('delete bookings', deleteBooking);
    _agent.handleRequest(intentMap);
});
