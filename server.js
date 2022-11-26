const express=require('express')
// const mongoose=require('./db/db.js')
const privateKey = require('./.private-key.json');
const ee = require('@google/earthengine');
const homeRouter=require('./routes/homeRouter')

const app=express()
const port=process.env.PORT||3000

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use('/', homeRouter)

ee.data.authenticateViaPrivateKey(
    privateKey,
    () => {
      console.log('Authentication successful.');
      ee.initialize(
          null, null,
          () => {
            console.log('Earth Engine client library initialized.');
            app.listen(port,()=>{
              console.log('Server is up on the port '+port+" !")
          })
            // console.log(`Listening on port ${port}`);
          },
          (err) => {
            console.log(err);
            console.log(
                `Please make sure you have created a service account and have been approved.
Visit https://developers.google.com/earth-engine/service_account#how-do-i-create-a-service-account to learn more.`);
          });
    },
    (err) => {
      console.log(err);
    });


